'use client'

import { httpBatchLink } from '@trpc/client'
import { PropsWithChildren, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { absoluteUrl } from '@/lib'
import { trpc } from '@/app/_trpc/client'

export const Providers = ({ children }: PropsWithChildren) => {
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
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	)
}
