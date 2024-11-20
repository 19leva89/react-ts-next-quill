'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { trpc } from '@/app/_trpc/client'

const AuthCallbackContent = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const origin = searchParams.get('origin')

	// Getting data via trpc
	const { data, error, isError } = trpc.authCallback.useQuery(undefined)

	if (data?.success) {
		if (origin && origin !== 'dashboard') {
			router.push(`/${encodeURIComponent(origin)}`)
		} else {
			router.push('/dashboard')
		}
	}

	if (isError) {
		if (error.data?.code === 'UNAUTHORIZED') {
			router.push('/sign-in')
		} else {
			console.error('Unexpected error:', error)
		}
	}

	return (
		<div className="w-full mt-24 flex justify-center">
			<div className="flex flex-col items-center gap-2">
				<Loader2 className="h-8 w-8 animate-spin text-zinc-800" />

				<h3 className="font-semibold text-xl">Setting up your account...</h3>

				<p>You will be redirected automatically</p>
			</div>
		</div>
	)
}

const AuthCallbackPage = () => {
	return (
		<Suspense>
			<AuthCallbackContent />
		</Suspense>
	)
}

export default AuthCallbackPage
