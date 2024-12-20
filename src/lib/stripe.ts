import Stripe from 'stripe'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/db'
import { PLANS } from '@/config/stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
	apiVersion: '2024-10-28.acacia',
	typescript: true,
})

export async function getUserSubscriptionPlan(): Promise<{
	isSubscribed: boolean
	isCanceled: boolean
	stripeCurrentPeriodEnd: Date | null
	stripeSubscriptionId?: string | null | undefined
	stripeCustomerId?: string | null | undefined
}> {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user.id) {
		return {
			...PLANS[0],
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
			...PLANS[0],
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
		const stripePlan = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId)
		isCanceled = stripePlan.cancel_at_period_end
	}

	return {
		...plan,
		stripeSubscriptionId: dbUser.stripeSubscriptionId,
		stripeCurrentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
		stripeCustomerId: dbUser.stripeCustomerId,
		isSubscribed,
		isCanceled,
	}
}
