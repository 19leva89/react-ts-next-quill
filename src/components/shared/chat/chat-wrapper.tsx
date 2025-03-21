'use client'

import Link from 'next/link'
import { ChevronLeftIcon, Loader2Icon, XCircleIcon } from 'lucide-react'

import { PLANS } from '@/config/stripe'
import { trpc } from '@/app/_trpc/client'
import { UploadStatus } from '@prisma/client'
import { buttonVariants } from '@/components/ui'
import { ChatContextProvider, ChatInput, Messages } from '@/components/shared/chat'

interface Props {
	fileId: string
	isSubscribed: boolean
}

export const ChatWrapper = ({ fileId, isSubscribed }: Props) => {
	const { data, isLoading } = trpc.getFileUploadStatus.useQuery(
		{
			fileId,
		},
		{
			refetchInterval: (data) => {
				const dataAsUnknown = data as unknown

				return (dataAsUnknown as { status: UploadStatus }).status === UploadStatus.SUCCESS ||
					(dataAsUnknown as { status: UploadStatus }).status === UploadStatus.FAILED
					? false
					: 500
			},
		},
	)

	if (isLoading)
		return (
			<div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
				<div className="flex-1 flex justify-center items-center flex-col mb-40 mt-4">
					<div className="flex flex-col items-center gap-2">
						<Loader2Icon className="h-8 w-8 text-blue-500 animate-spin" />

						<h3 className="font-semibold text-xl">Loading...</h3>

						<p className="text-zinc-500 text-sm">We&apos;re preparing your PDF</p>
					</div>
				</div>

				<ChatInput isDisabled />
			</div>
		)

	if (data?.status === UploadStatus.PROCESSING)
		return (
			<div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
				<div className="flex-1 flex justify-center items-center flex-col mb-40 mt-4">
					<div className="flex flex-col items-center gap-2">
						<Loader2Icon className="h-8 w-8 text-blue-500 animate-spin" />

						<h3 className="font-semibold text-xl">Processing PDF...</h3>

						<p className="text-zinc-500 text-sm">This won&apos;t take long</p>
					</div>
				</div>

				<ChatInput isDisabled />
			</div>
		)

	if (data?.status === UploadStatus.FAILED)
		return (
			<div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
				<div className="flex-1 flex justify-center items-center flex-col mb-40 mt-4">
					<div className="flex flex-col items-center gap-2">
						<XCircleIcon className="h-8 w-8 text-red-500" />

						<h3 className="font-semibold text-xl">Too many pages in PDF</h3>

						<p className="text-zinc-500 text-sm">
							Your <span className="font-medium">{isSubscribed ? 'Pro' : 'Free'}</span> plan supports up to{' '}
							{isSubscribed
								? PLANS.find((plan) => plan.name === 'Pro')?.pagesPerPdf
								: PLANS.find((plan) => plan.name === 'Free')?.pagesPerPdf}{' '}
							pages per PDF
						</p>

						<Link
							href="/dashboard"
							className={buttonVariants({
								variant: 'secondary',
								className: 'mt-4 transition-colors ease-in-out duration-300',
							})}
						>
							<ChevronLeftIcon className="h-3 w-3 mr-1.5" />
							Back
						</Link>
					</div>
				</div>

				<ChatInput isDisabled />
			</div>
		)

	return (
		<ChatContextProvider fileId={fileId}>
			<div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
				<div className="flex-1 justify-between flex flex-col mb-40 mt-4">
					<Messages fileId={fileId} />
				</div>

				<ChatInput />
			</div>
		</ChatContextProvider>
	)
}
