import Stripe from 'stripe'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/lib/prisma'
import { PLANS } from '@/config/stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
	apiVersion: '2025-02-24.acacia',
	typescript: true,
})

export async function getUserSubscriptionPlan(): Promise<{
	isSubscribed: boolean
	isCanceled: boolean
	stripeCurrentPeriodEnd: Date | null
	stripeSubscriptionId?: string | null | undefined
	stripeCustomerId?: string | null | undefined
	name: string
}> {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) {
		return {
			name: PLANS[0].name,
			isSubscribed: false,
			isCanceled: false,
			stripeCurrentPeriodEnd: null,
		}
	}

	const dbUser = await prisma.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) {
		return {
			name: PLANS[0].name,
			isSubscribed: false,
			isCanceled: false,
			stripeCurrentPeriodEnd: null,
		}
	}

	const isSubscribed = Boolean(
		dbUser.stripePriceId &&
			dbUser.stripeCurrentPeriodEnd && // 86400000 = 1 day
			dbUser.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now(),
	)

	const plan = isSubscribed ? PLANS.find((plan) => plan.price.priceIds.test === dbUser.stripePriceId) : null

	let isCanceled = false
	if (isSubscribed && dbUser.stripeSubscriptionId) {
		try {
			const stripePlan = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId)

			isCanceled = stripePlan.cancel_at_period_end
		} catch (error) {
			console.error('Error fetching Stripe subscription:', error)

			isCanceled = false
		}
	}

	return {
		name: plan?.name ?? 'Free',
		stripeSubscriptionId: dbUser.stripeSubscriptionId,
		stripeCurrentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
		stripeCustomerId: dbUser.stripeCustomerId,
		isSubscribed,
		isCanceled,
	}
}
