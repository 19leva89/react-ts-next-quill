import type Stripe from 'stripe'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
	const body = await request.text()

	const headersList = await headers()
	const signature = headersList.get('Stripe-Signature') ?? ''

	let event: Stripe.Event

	try {
		event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || '')
	} catch (err) {
		return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`, {
			status: 400,
		})
	}

	const session = event.data.object as Stripe.Checkout.Session

	if (!session?.metadata?.userId) {
		console.error('❌ No userId in metadata')

		return new NextResponse(null, {
			status: 200,
		})
	}

	if (event.type === 'checkout.session.completed') {
		const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
		console.log('📝 Subscription data:', subscription)

		const updatedUser = await prisma.user.update({
			where: {
				id: session.metadata.userId,
			},
			data: {
				stripeSubscriptionId: subscription.id,
				stripeCustomerId: subscription.customer as string,
				stripePriceId: subscription.items.data[0]?.price.id,
				stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
			},
		})

		console.log('✅ CHECKOUT User updated:', updatedUser)
	}

	if (event.type === 'invoice.payment_succeeded') {
		// Retrieve the subscription details from Stripe
		const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
		console.log('📝 Subscription data:', subscription)

		const updatedUser = await prisma.user.update({
			where: {
				stripeSubscriptionId: subscription.id,
			},
			data: {
				stripePriceId: subscription.items.data[0]?.price.id,
				stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
			},
		})

		console.log('✅ INVOICE User updated:', updatedUser)
	}

	return new NextResponse(null, { status: 200 })
}
