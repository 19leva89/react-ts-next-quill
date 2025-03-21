'use client'

import { ArrowRightIcon } from 'lucide-react'

import { Button } from '@/components/ui'
import { trpc } from '@/app/_trpc/client'

export const UpgradeButton = () => {
	const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
		onSuccess: ({ url }) => {
			window.location.href = url ?? '/dashboard/billing'
		},
	})

	return (
		<Button
			onClick={() => createStripeSession()}
			className="w-full transition-colors ease-in-out duration-300"
		>
			Upgrade now <ArrowRightIcon className="h-5 w-5 ml-1.5" />
		</Button>
	)
}
