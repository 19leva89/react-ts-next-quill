'use client'

import { useEffect } from 'react'
import { Loader2Icon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { trpc } from '@/app/_trpc/client'

const AuthCallbackPage = () => {
	const router = useRouter()

	const searchParams = useSearchParams()
	const origin = searchParams.get('origin')

	// Getting data via trpc
	const { data, error } = trpc.authCallback.useQuery(undefined)

	useEffect(() => {
		if (data?.success) {
			router.push(origin ? `/${encodeURIComponent(origin)}` : '/dashboard')
		} else if (error?.data?.code === 'UNAUTHORIZED') {
			router.push('/sign-in')
		}
	}, [data, error, origin, router])

	return (
		<div className='mt-24 flex w-full justify-center'>
			<div className='flex flex-col items-center gap-2'>
				<Loader2Icon className='size-8 animate-spin text-zinc-800' />

				<h3 className='text-xl font-semibold'>Setting up your account...</h3>

				<p>You will be redirected automatically</p>
			</div>
		</div>
	)
}

export default AuthCallbackPage
