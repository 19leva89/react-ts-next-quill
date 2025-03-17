import { BillingForm } from '@/components/shared'
import { getUserSubscriptionPlan } from '@/lib/stripe'

const BillingPage = async () => {
	const subscriptionPlan = await getUserSubscriptionPlan()
	// console.log('subscriptionPlan:', subscriptionPlan)

	return <BillingForm subscriptionPlan={subscriptionPlan} />
}

export default BillingPage
