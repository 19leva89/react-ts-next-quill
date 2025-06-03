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
			className='w-full transition-colors duration-300 ease-in-out'
		>
			Upgrade now <ArrowRightIcon className='ml-1.5 size-5' />
		</Button>
	)
}
