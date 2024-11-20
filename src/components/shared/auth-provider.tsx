'use client'

import { httpBatchLink } from '@trpc/client'
import { PropsWithChildren, useState } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { absoluteUrl } from '@/lib'
import { trpc } from '@/app/_trpc/client'

export const AuthProvider = ({ children }: PropsWithChildren) => {
	const [queryClient] = useState(() => new QueryClient())
	const [trpcClient] = useState(() =>
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
				{children}

				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</trpc.Provider>
	)
}
