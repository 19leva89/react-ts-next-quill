'use client'

import dynamic from 'next/dynamic'

import { Suspense } from 'react'
import { Loader2Icon } from 'lucide-react'

const PDFViewer = dynamic(() => import('./pdf-viewer').then((mod) => ({ default: mod.PDFViewer })), {
	ssr: false,
	loading: () => (
		<div className='flex justify-center'>
			<Loader2Icon className='my-24 size-6 animate-spin' />
		</div>
	),
})

interface Props {
	url: string
}

export const PDFViewerWrapper = ({ url }: Props) => {
	return (
		<Suspense
			fallback={
				<div className='flex justify-center'>
					<Loader2Icon className='my-24 size-6 animate-spin' />
				</div>
			}
		>
			<PDFViewer url={url} />
		</Suspense>
	)
}
