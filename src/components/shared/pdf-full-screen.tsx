'use client'

import { toast } from 'sonner'
import { useState } from 'react'
import { Document, Page } from 'react-pdf'
import { ExpandIcon, Loader2Icon } from 'lucide-react'
import { useResizeDetector } from 'react-resize-detector'

import SimpleBar from 'simplebar-react'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui'

interface Props {
	fileUrl: string
}

export const PdfFullScreen = ({ fileUrl }: Props) => {
	const [isOpen, setIsOpen] = useState(false)
	const [numPages, setNumPages] = useState<number>()

	const { width, ref } = useResizeDetector()

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(visible) => {
				if (!visible) {
					setIsOpen(visible)
				}
			}}
		>
			<DialogTrigger onClick={() => setIsOpen(true)} asChild>
				<Button variant="ghost" size="icon" className="gap-1.5" aria-label="fullscreen">
					<ExpandIcon className="h-4 w-4" />
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-7xl w-full" aria-describedby={undefined}>
				<VisuallyHidden asChild>
					<DialogTitle>PDF Document Viewer</DialogTitle>
				</VisuallyHidden>

				<SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)] mt-6">
					<div ref={ref}>
						<Document
							file={fileUrl}
							loading={
								<div className="flex justify-center">
									<Loader2Icon className="my-24 h-6 w-6 animate-spin" />
								</div>
							}
							onLoadError={() => {
								toast.error('Error loading PDF. Please try again later')
							}}
							onLoadSuccess={({ numPages }) => setNumPages(numPages)}
							className="max-h-full"
						>
							{new Array(numPages).fill(0).map((_, i) => (
								<Page key={i} width={width ? width : 1} pageNumber={i + 1} />
							))}
						</Document>
					</div>
				</SimpleBar>
			</DialogContent>
		</Dialog>
	)
}
