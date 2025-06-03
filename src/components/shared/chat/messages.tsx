'use client'

import { useIntersection } from '@mantine/hooks'
import { useContext, useEffect, useRef } from 'react'
import { Loader2Icon, MessageSquareIcon } from 'lucide-react'

import { trpc } from '@/app/_trpc/client'
import { Skeleton } from '@/components/ui'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { ChatContext, Message } from '@/components/shared/chat'

interface Props {
	fileId: string
}

export const Messages = ({ fileId }: Props) => {
	const { isLoading: isAiThinking } = useContext(ChatContext)

	const { data, isLoading, fetchNextPage } = trpc.getFileMessages.useInfiniteQuery(
		{ fileId, limit: INFINITE_QUERY_LIMIT },
		{
			getNextPageParam: (lastPage: { nextCursor?: string | null }) => lastPage?.nextCursor,
			keepPreviousData: true,
		} as any,
	)

	const messages = data?.pages.flatMap((page) => page.messages)

	const loadingMessage = {
		createdAt: new Date().toISOString(),
		id: 'loading-message',
		isUserMessage: false,
		text: (
			<span className='flex h-full items-center justify-center'>
				<Loader2Icon className='size-4 animate-spin' />
			</span>
		),
	}

	const combinedMessages = [...(isAiThinking ? [loadingMessage] : []), ...(messages ?? [])]

	const lastMessageRef = useRef<HTMLDivElement>(null)

	const { ref, entry } = useIntersection({ root: lastMessageRef.current, threshold: 1 })

	useEffect(() => {
		if (entry?.isIntersecting) {
			fetchNextPage()
		}
	}, [entry, fetchNextPage])

	return (
		<div className='scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch flex max-h-[calc(100vh-3.5rem-7rem)] flex-1 flex-col-reverse gap-4 overflow-y-auto border-zinc-200 p-3'>
			{combinedMessages && combinedMessages.length > 0 ? (
				combinedMessages.map((message, i) => {
					const isNextMessageSamePerson =
						combinedMessages[i - 1]?.isUserMessage === combinedMessages[i]?.isUserMessage

					if (i === combinedMessages.length - 1) {
						return (
							<Message
								key={message.id}
								ref={ref}
								message={message}
								isNextMessageSamePerson={isNextMessageSamePerson}
							/>
						)
					} else
						return (
							<Message key={message.id} message={message} isNextMessageSamePerson={isNextMessageSamePerson} />
						)
				})
			) : isLoading ? (
				<div className='flex w-full flex-col gap-2'>
					<Skeleton className='h-16' />
					<Skeleton className='h-16' />
					<Skeleton className='h-16' />
					<Skeleton className='h-16' />
				</div>
			) : (
				<div className='flex flex-1 flex-col items-center justify-center gap-2'>
					<MessageSquareIcon className='size-8 text-blue-500' />

					<h3 className='text-xl font-semibold'>You&apos;re all set!</h3>

					<p className='text-sm text-zinc-500'>Ask your first question to get started</p>
				</div>
			)}
		</div>
	)
}
