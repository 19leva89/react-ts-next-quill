'use client'

import { z } from 'zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Document, Page, pdfjs } from 'react-pdf'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResizeDetector } from 'react-resize-detector'
import { ChevronDown, ChevronUp, Loader2, RotateCw, Search } from 'lucide-react'

import SimpleBar from 'simplebar-react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	Separator,
} from '@/components/ui'
import { cn } from '@/lib'
import { useToast } from '@/hooks/use-toast'
import { PdfFullScreen } from '@/components/shared/pdf-full-screen'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

console.log('pdfjs.version', pdfjs.version)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
// pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/legacy/build/pdf.worker.min.mjs'
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`

interface PDFViewerProps {
	url: string
}

export const PDFViewer = ({ url }: PDFViewerProps) => {
	const { toast } = useToast()

	const [scale, setScale] = useState<number>(1)
	const [numPages, setNumPages] = useState<number>()
	const [currPage, setCurrPage] = useState<number>(1)
	const [rotation, setRotation] = useState<number>(0)
	const [renderedScale, setRenderedScale] = useState<number | null>(null)

	const zoomOptions = [100, 150, 200, 250]

	const isLoading = renderedScale !== scale

	const CustomPageValidator = z.object({
		page: z.string().refine((num) => Number(num) > 0 && Number(num) <= numPages!),
	})

	type TCustomPageValidator = z.infer<typeof CustomPageValidator>

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<TCustomPageValidator>({
		defaultValues: {
			page: '1',
		},
		resolver: zodResolver(CustomPageValidator),
	})

	// console.log(errors)

	const { width, ref } = useResizeDetector()

	const handlePageSubmit = ({ page }: TCustomPageValidator) => {
		setCurrPage(Number(page))
		setValue('page', String(page))
	}

	const handleNextPage = () => {
		setCurrPage((prev) => (prev + 1 > numPages! ? numPages! : prev + 1))
		setValue('page', String(currPage + 1))
	}

	const handlePrevPage = () => {
		setCurrPage((prev) => (prev - 1 > 1 ? prev - 1 : 1))
		setValue('page', String(currPage - 1))
	}

	return (
		<div className="w-full bg-white rounded-md shadow flex flex-col items-center">
			<div className="h-14 w-full flex items-center justify-between px-2">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						aria-label="previous page"
						onClick={handlePrevPage}
						disabled={currPage <= 1}
						className="disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
					>
						<ChevronDown className="h-4 w-4" />
					</Button>

					<div className="flex items-center gap-3">
						<Input
							{...register('page')}
							className={cn(
								'w-14 h-full leading-none text-center',
								errors.page && 'focus-visible:ring-red-500',
							)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleSubmit(handlePageSubmit)()
								}
							}}
						/>

						<p className="text-zinc-700 leading-none md:text-sm">/</p>

						<p className="text-zinc-700 leading-none md:text-sm">{numPages ?? 'x'}</p>
					</div>

					<Button
						variant="ghost"
						aria-label="next page"
						onClick={handleNextPage}
						disabled={numPages === undefined || currPage === numPages}
						className="disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
					>
						<ChevronUp className="h-4 w-4" />
					</Button>
				</div>

				<div className="space-x-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="gap-1.5" aria-label="zoom" variant="ghost">
								<Search className="h-4 w-4" />
								{scale * 100}%
								<ChevronDown className="h-3 w-3 opacity-75" />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent>
							{zoomOptions.map((zoom) => (
								<DropdownMenuItem key={zoom} onSelect={() => setScale(zoom / 100)}>
									{zoom}%
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						variant="ghost"
						aria-label="rotate 90 degrees"
						onClick={() => setRotation((prev) => prev + 90)}
					>
						<RotateCw className="h-4 w-4" />
					</Button>

					<PdfFullScreen fileUrl={url} />
				</div>
			</div>

			<Separator />

			<div className="flex-1 w-full max-h-screen">
				<SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)]">
					<div ref={ref}>
						<Document
							file={url}
							loading={
								<div className="flex justify-center">
									<Loader2 className="my-24 h-6 w-6 animate-spin" />
								</div>
							}
							onLoadSuccess={({ numPages }) => setNumPages(numPages)}
							onLoadError={() => {
								toast({
									title: 'Error loading PDF',
									description: 'Please try again later',
									variant: 'destructive',
								})
							}}
							className="max-h-full"
						>
							<Page
								width={width || 1}
								pageNumber={currPage}
								scale={scale}
								rotate={rotation}
								loading={
									<div className="flex justify-center">
										<Loader2 className="my-24 h-6 w-6 animate-spin" />
									</div>
								}
								onRenderSuccess={() => setRenderedScale(scale)}
								className={isLoading && !renderedScale ? 'hidden' : ''}
							/>
						</Document>
					</div>
				</SimpleBar>
			</div>
		</div>
	)
}
