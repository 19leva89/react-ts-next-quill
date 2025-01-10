import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { privateProcedure, publicProcedure, router } from './trpc'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/db'
import { absoluteUrl } from '@/lib'
import { PLANS } from '@/config/stripe'
import { UploadStatus } from '@prisma/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { getUserSubscriptionPlan, stripe } from '@/lib/stripe'

export const appRouter = router({
	authCallback: publicProcedure.query(async () => {
		try {
			// Getting user data via Kinde
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			// User ID or email is missing
			if (!user.id || !user.email) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'User ID or email is missing.',
				})
			}

			// Checking the existence of a user in the database
			const dbUser = await prisma.user.findFirst({
				where: { id: user.id },
			})

			if (!dbUser) {
				// Creating a new user in the database
				await prisma.user.create({
					data: {
						id: user.id,
						email: user.email,
					},
				})
			}

			// Successful response
			return { success: true }
		} catch (error) {
			console.error('Error in authCallback:', error)

			// TRPC Error Handling
			if (error instanceof TRPCError) {
				throw error // TRPC Error Throw
			}

			// General error for all other cases
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'An error occurred during user authentication',
			})
		}
	}),

	getUserFiles: privateProcedure.query(async ({ ctx }) => {
		const { userId } = ctx

		if (!userId) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'User not authenticated',
			})
		}

		return await prisma.file.findMany({
			where: {
				userId,
			},
		})
	}),

	createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
		const { userId } = ctx

		const billingUrl = absoluteUrl('/dashboard/billing')

		if (!userId) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'User not authenticated',
			})
		}

		const dbUser = await prisma.user.findFirst({
			where: {
				id: userId,
			},
		})

		if (!dbUser) throw new TRPCError({ code: 'UNAUTHORIZED' })

		const subscriptionPlan = await getUserSubscriptionPlan()

		if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
			const stripeSession = await stripe.billingPortal.sessions.create({
				customer: dbUser.stripeCustomerId,
				return_url: billingUrl,
			})

			return { url: stripeSession.url }
		}

		const stripeSession = await stripe.checkout.sessions.create({
			success_url: billingUrl,
			cancel_url: billingUrl,
			payment_method_types: ['card', 'paypal'],
			mode: 'subscription',
			billing_address_collection: 'auto',
			line_items: [
				{
					price: PLANS.find((plan) => plan.name === 'Pro')?.price.priceIds.test,
					quantity: 1,
				},
			],
			metadata: {
				userId: userId,
			},
		})

		return { url: stripeSession.url }
	}),

	getFileMessages: privateProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).nullish(),
				cursor: z.string().nullish(),
				fileId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { userId } = ctx
			const { fileId, cursor } = input
			const limit = input.limit ?? INFINITE_QUERY_LIMIT

			const file = await prisma.file.findFirst({
				where: {
					id: fileId,
					userId,
				},
			})

			if (!file) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'File not found.',
				})
			}

			const messages = await prisma.message.findMany({
				take: limit + 1,
				where: { fileId },
				orderBy: { createdAt: 'desc' },
				cursor: cursor ? { id: cursor } : undefined,
				select: {
					id: true,
					isUserMessage: true,
					createdAt: true,
					text: true,
				},
			})

			let nextCursor: typeof cursor | undefined = undefined
			if (messages.length > limit) {
				const nextItem = messages.pop()

				nextCursor = nextItem?.id
			}

			return {
				messages,
				nextCursor,
			}
		}),

	getFileUploadStatus: privateProcedure
		.input(z.object({ fileId: z.string() }))
		.query(async ({ input, ctx }) => {
			const file = await prisma.file.findFirst({
				where: {
					id: input.fileId,
					userId: ctx.userId,
				},
			})

			if (!file) return { status: 'PENDING' as const }

			return { status: file.uploadStatus as UploadStatus }
		}),

	getFile: privateProcedure.input(z.object({ key: z.string() })).mutation(async ({ ctx, input }) => {
		const { userId } = ctx

		// Логирование для отладки
		// console.log('Searching for file with key:', input.key, 'and userId:', userId)

		const file = await prisma.file.findFirst({
			where: {
				key: input.key,
				userId,
			},
		})

		// console.log('DB query result:', file)

		if (!file) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: `File with key "${input.key}" not found.`,
			})
		}

		return file
	}),

	deleteFile: privateProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		const { userId } = ctx

		const file = await prisma.file.findFirst({
			where: {
				id: input.id,
				userId,
			},
		})

		if (!file) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: `File with ID "${input.id}" not found.`,
			})
		}

		await prisma.file.delete({
			where: {
				id: input.id,
			},
		})

		return file
	}),
})

export type AppRouter = typeof appRouter
