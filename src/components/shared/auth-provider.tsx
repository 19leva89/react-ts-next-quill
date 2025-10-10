'use client'

import { httpBatchLink, TRPCClient } from '@trpc/client'
import { PropsWithChildren, Suspense, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AppRouter } from '@/trpc'
import { absoluteUrl } from '@/lib'
import { trpc } from '@/app/_trpc/client'

export const AuthProvider = ({ children }: PropsWithChildren) => {
	const [queryClient] = useState<QueryClient>(() => new QueryClient())
	const [trpcClient] = useState<TRPCClient<AppRouter>>(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: absoluteUrl('/api/trpc'),
				}),
			],
		}),
	)

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<Suspense>{children}</Suspense>
			</QueryClientProvider>
		</trpc.Provider>
	)
}
