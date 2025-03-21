'use client'

import { SendIcon } from 'lucide-react'
import { useContext, useRef } from 'react'

import { Button, Textarea } from '@/components/ui'
import { ChatContext } from '@/components/shared/chat'

interface Props {
	isDisabled?: boolean
}

export const ChatInput = ({ isDisabled }: Props) => {
	const { addMessage, handleInputChange, isLoading, message } = useContext(ChatContext)

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	return (
		<div className="absolute bottom-0 left-0 w-full">
			<div className="mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
				<div className="relative flex h-full flex-1 items-stretch md:flex-col">
					<div className="relative flex flex-col w-full grow p-4">
						<div className="relative flex flex-row flex-nowrap items-end gap-4">
							<Textarea
								rows={1}
								maxRows={4}
								value={message}
								ref={textareaRef}
								autoFocus
								onChange={handleInputChange}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault()

										addMessage()

										textareaRef.current?.focus()
									}
								}}
								placeholder="Enter your question..."
								className="resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
							/>

							<Button
								size="icon"
								aria-label="send message"
								disabled={isLoading || isDisabled}
								onClick={() => {
									addMessage()
									textareaRef.current?.focus()
								}}
								className="absolute right-[5px] bottom-[3px] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50 transition-colors ease-in-out duration-300"
							>
								<SendIcon className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
