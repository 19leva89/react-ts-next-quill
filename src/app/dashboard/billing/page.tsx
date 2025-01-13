import { BillingForm } from '@/components/shared'
import { getUserSubscriptionPlan } from '@/lib/stripe'

const BillingPage = async () => {
	const subscriptionPlan = await getUserSubscriptionPlan()

	return <BillingForm subscriptionPlan={subscriptionPlan} />
}

export default BillingPage
