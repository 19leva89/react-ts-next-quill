import { TRPCError, initTRPC } from '@trpc/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

const t = initTRPC.create({
	errorFormatter({ shape, error }) {
		// Logging an error on the server
		console.error('tRPC Error:', error)

		// Return formatted error
		return {
			...shape,
			data: {
				...shape.data,
				// Add additional debugging information if needed
				message: error.message,
			},
		}
	},
})

const middleware = t.middleware

const isAuth = middleware(async (options) => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) {
		throw new TRPCError({ code: 'UNAUTHORIZED' })
	}

	return options.next({
		ctx: {
			userId: user.id,
			user,
		},
	})
})

export const router = t.router
export const publicProcedure = t.procedure
export const privateProcedure = t.procedure.use(isAuth)
