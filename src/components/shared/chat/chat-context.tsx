'use client'

import { useMutation } from '@tanstack/react-query'
import { ChangeEvent, createContext, ReactNode, useRef, useState } from 'react'

import { trpc } from '@/app/_trpc/client'
import { useToast } from '@/hooks/use-toast'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'

type StreamResponse = {
	message: string
	isLoading: boolean
	addMessage: () => void
	handleInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
}
interface ChatContextProviderProps {
	fileId: string
	children: ReactNode
}

export const ChatContext = createContext<StreamResponse>({
	message: '',
	isLoading: false,
	addMessage: () => {},
	handleInputChange: () => {},
})

export const ChatContextProvider = ({ fileId, children }: ChatContextProviderProps) => {
	const [message, setMessage] = useState<string>('')
	const [isLoading, setIsLoading] = useState<boolean>(false)

	const utils = trpc.useUtils()

	const { toast } = useToast()

	const backupMessage = useRef('')

	const { mutate: sendMessage } = useMutation({
		mutationFn: async ({ message }: { message: string }) => {
			const response = await fetch('/api/message', {
				method: 'POST',
				body: JSON.stringify({
					fileId,
					message,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to send message')
			}

			return response.body
		},

		onMutate: async ({ message }) => {
			backupMessage.current = message
			setMessage('')

			// step 1
			await utils.getFileMessages.cancel()

			// step 2
			const previousMessages = utils.getFileMessages.getInfiniteData()

			// step 3
			utils.getFileMessages.setInfiniteData({ fileId, limit: INFINITE_QUERY_LIMIT }, (old) => {
				if (!old) {
					return {
						pages: [],
						pageParams: [],
					}
				}

				let newPages = [...old.pages]

				let latestPage = newPages[0]!

				latestPage.messages = [
					{
						id: crypto.randomUUID(),
						text: message,
						isUserMessage: true,
						createdAt: new Date().toISOString(),
					},
					...latestPage.messages,
				]

				newPages[0] = latestPage

				return {
					...old,
					pages: newPages,
				}
			})

			setIsLoading(true)

			return {
				previousMessages: previousMessages?.pages.flatMap((page) => page.messages) ?? [],
			}
		},

		onSuccess: async (stream) => {
			setIsLoading(false)

			if (!stream) {
				return toast({
					title: 'There was a problem sending this message',
					description: 'Please refresh this page and try again',
					variant: 'destructive',
				})
			}

			const reader = stream.getReader()
			const decoder = new TextDecoder()
			let done = false

			// accumulated response
			let accResponse = ''

			while (!done) {
				const { value, done: doneReading } = await reader.read()
				done = doneReading
				const chunkValue = decoder.decode(value)

				accResponse += chunkValue

				// append chunk to the actual message
				utils.getFileMessages.setInfiniteData({ fileId, limit: INFINITE_QUERY_LIMIT }, (old) => {
					if (!old) return { pages: [], pageParams: [] }

					let isAiResponseCreated = old.pages.some((page) =>
						page.messages.some((message) => message.id === 'ai-response'),
					)

					let updatedPages = old.pages.map((page) => {
						if (page === old.pages[0]) {
							let updatedMessages

							if (!isAiResponseCreated) {
								updatedMessages = [
									{
										id: 'ai-response',
										text: accResponse,
										isUserMessage: false,
										createdAt: new Date().toISOString(),
									},
									...page.messages,
								]
							} else {
								updatedMessages = page.messages.map((message) => {
									if (message.id === 'ai-response') {
										return {
											...message,
											text: accResponse,
										}
									}
									return message
								})
							}

							return {
								...page,
								messages: updatedMessages,
							}
						}

						return page
					})

					return { ...old, pages: updatedPages }
				})
			}
		},

		onError: (_, __, context) => {
			setMessage(backupMessage.current)
			utils.getFileMessages.setData({ fileId }, { messages: context?.previousMessages ?? [] })
		},

		onSettled: async () => {
			setIsLoading(false)

			await utils.getFileMessages.invalidate({ fileId })
		},
	})

	const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setMessage(e.target.value)
	}

	const addMessage = () => sendMessage({ message })

	return (
		<ChatContext.Provider
			value={{
				message,
				isLoading,
				addMessage,
				handleInputChange,
			}}
		>
			{children}
		</ChatContext.Provider>
	)
}
