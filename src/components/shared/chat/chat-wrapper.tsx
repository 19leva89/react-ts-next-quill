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
			<div className='relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50'>
				<div className='mt-4 mb-40 flex flex-1 flex-col items-center justify-center'>
					<div className='flex flex-col items-center gap-2'>
						<Loader2Icon className='size-8 animate-spin text-blue-500' />

						<h3 className='text-xl font-semibold'>Loading...</h3>

						<p className='text-sm text-zinc-500'>We&apos;re preparing your PDF</p>
					</div>
				</div>

				<ChatInput isDisabled />
			</div>
		)

	if (data?.status === UploadStatus.PROCESSING)
		return (
			<div className='relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50'>
				<div className='mt-4 mb-40 flex flex-1 flex-col items-center justify-center'>
					<div className='flex flex-col items-center gap-2'>
						<Loader2Icon className='size-8 animate-spin text-blue-500' />

						<h3 className='text-xl font-semibold'>Processing PDF...</h3>

						<p className='text-sm text-zinc-500'>This won&apos;t take long</p>
					</div>
				</div>

				<ChatInput isDisabled />
			</div>
		)

	if (data?.status === UploadStatus.FAILED)
		return (
			<div className='relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50'>
				<div className='mt-4 mb-40 flex flex-1 flex-col items-center justify-center'>
					<div className='flex flex-col items-center gap-2'>
						<XCircleIcon className='size-8 text-red-500' />

						<h3 className='text-xl font-semibold'>Too many pages in PDF</h3>

						<p className='text-sm text-zinc-500'>
							Your <span className='font-medium'>{isSubscribed ? 'Pro' : 'Free'}</span> plan supports up to{' '}
							{isSubscribed
								? PLANS.find((plan) => plan.name === 'Pro')?.pagesPerPdf
								: PLANS.find((plan) => plan.name === 'Free')?.pagesPerPdf}{' '}
							pages per PDF
						</p>

						<Link
							href='/dashboard'
							className={buttonVariants({
								variant: 'secondary',
								className: 'mt-4 transition-colors duration-300 ease-in-out',
							})}
						>
							<ChevronLeftIcon className='mr-1.5 size-3' />
							Back
						</Link>
					</div>
				</div>

				<ChatInput isDisabled />
			</div>
		)

	return (
		<ChatContextProvider fileId={fileId}>
			<div className='relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50'>
				<div className='mt-4 mb-40 flex flex-1 flex-col justify-between'>
					<Messages fileId={fileId} />
				</div>

				<ChatInput />
			</div>
		</ChatContextProvider>
	)
}
