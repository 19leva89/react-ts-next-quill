import type Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// Disable caching for webhooks
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
	const body = await req.text()
	const signature = req.headers.get('stripe-signature')!
	const secret = process.env.STRIPE_WEBHOOK_SECRET || ''

	try {
		// Validation of the webhook
		const event = stripe.webhooks.constructEvent(body, signature, secret)

		const session = event.data.object as Stripe.Checkout.Session
		// console.log(`🔔 Received event type: ${event.type}, session ID: ${session.id}`)

		// Validation of the session
		if (!session?.metadata?.userId) {
			console.error('❌ Metadata Error: Missing userId in session metadata', session.metadata)
			return new NextResponse('Missing userId', { status: 400 })
		}

		// Validation of the events
		switch (event.type) {
			case 'checkout.session.completed':
				await handleCheckoutSessionCompleted(session)
				break

			case 'invoice.payment_succeeded':
				await handleInvoicePaymentSucceeded(session)
				break

			default:
				console.warn(`⚠️ Unhandled event type: ${event.type}`)
		}

		return new NextResponse(null, { status: 200 })
	} catch (err) {
		const error = err instanceof Error ? err : new Error('Unknown error')
		console.error('❌ Webhook Error:', error.message)
		return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
	}
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
	try {
		console.log('🔄 Processing checkout session:', session.id)

		const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
		// console.log('📝 Subscription Details:', {
		// 	id: subscription.id,
		// 	customer: subscription.customer,
		// 	priceId: subscription.items.data[0]?.price.id,
		// })

		const updatedUser = await prisma.user.update({
			where: { id: session?.metadata?.userId },
			data: {
				stripeSubscriptionId: subscription.id,
				stripeCustomerId: subscription.customer as string,
				stripePriceId: subscription.items.data[0]?.price.id,
				stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
			},
		})

		// console.log('✅ User updated successfully:', {
		// 	userId: updatedUser.id,
		// 	subscriptionId: updatedUser.stripeSubscriptionId,
		// })
	} catch (error) {
		console.error('❌ Checkout Session Error:', error)
		throw new Error('Failed to process checkout session')
	}
}

async function handleInvoicePaymentSucceeded(session: Stripe.Checkout.Session) {
	try {
		console.log('🔄 Processing invoice payment:', session.id)

		const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

		const updatedUser = await prisma.user.update({
			where: { stripeSubscriptionId: subscription.id },
			data: {
				stripePriceId: subscription.items.data[0]?.price.id,
				stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
			},
		})

		// console.log('✅ Subscription renewed successfully:', {
		// 	userId: updatedUser.id,
		// 	periodEnd: updatedUser.stripeCurrentPeriodEnd,
		// })
	} catch (error) {
		console.error('❌ Invoice Payment Error:', error)
		throw new Error('Failed to process invoice payment')
	}
}
