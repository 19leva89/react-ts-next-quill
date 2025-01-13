'use client'

import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

import { trpc } from '@/app/_trpc/client'
import { useToast } from '@/hooks/use-toast'
import { MaxWidthWrapper } from '@/components/shared'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui'

interface BillingFormProps {
	subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}

export const BillingForm = ({ subscriptionPlan }: BillingFormProps) => {
	const { toast } = useToast()

	const { mutate: createStripeSession, status } = trpc.createStripeSession.useMutation({
		onSuccess: ({ url }) => {
			if (url) window.location.href = url

			if (!url) {
				toast({
					title: 'There was a problem...',
					description: 'Please try again in a moment',
					variant: 'destructive',
				})
			}
		},
	})

	const isLoading = status === 'pending'

	return (
		<MaxWidthWrapper className="max-w-5xl">
			<form
				className="mt-12"
				onSubmit={(e) => {
					e.preventDefault()
					createStripeSession()
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle>Subscription Plan</CardTitle>

						<CardDescription>
							You are currently on the <strong>{subscriptionPlan.name}</strong> plan
						</CardDescription>
					</CardHeader>

					<CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
						<Button type="submit">
							{isLoading ? <Loader2 className="mr-4 h-4 w-4 animate-spin" /> : null}

							{subscriptionPlan.isSubscribed ? 'Manage Subscription' : 'Upgrade to PRO'}
						</Button>

						{subscriptionPlan.isSubscribed ? (
							<p className="rounded-full text-xs font-medium">
								{subscriptionPlan.isCanceled ? 'Your plan will be canceled on ' : 'Your plan renews on '}
								{format(subscriptionPlan.stripeCurrentPeriodEnd!, 'dd.MM.yyyy')}
							</p>
						) : null}
					</CardFooter>
				</Card>
			</form>
		</MaxWidthWrapper>
	)
}
