'use client'

import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Document, Page, pdfjs } from 'react-pdf'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResizeDetector } from 'react-resize-detector'
import { ChevronDownIcon, ChevronUpIcon, Loader2Icon, RotateCwIcon, SearchIcon } from 'lucide-react'

// @ts-expect-error: simplebar-react has missing types
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
import { PdfFullScreen } from '@/components/shared/pdf-full-screen'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
	url: string
}

export const PDFViewer = ({ url }: Props) => {
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
		<div className='flex w-full flex-col items-center rounded-md bg-white shadow-sm'>
			<div className='flex h-14 w-full items-center justify-between px-2'>
				<div className='flex items-center gap-2'>
					<Button
						variant='ghost'
						size='icon'
						aria-label='previous page'
						onClick={handlePrevPage}
						disabled={currPage <= 1}
						className='transition-colors duration-300 ease-in-out disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50'
					>
						<ChevronUpIcon className='size-4' />
					</Button>

					<div className='flex items-center gap-3'>
						<Input
							{...register('page')}
							className={cn(
								'h-full w-14 text-center leading-none',
								errors.page && 'focus-visible:ring-red-500',
							)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleSubmit(handlePageSubmit)()
								}
							}}
						/>

						<p className='leading-none text-zinc-700 md:text-sm'>/</p>

						<p className='leading-none text-zinc-700 md:text-sm'>{numPages ?? 'x'}</p>
					</div>

					<Button
						variant='ghost'
						size='icon'
						aria-label='next page'
						onClick={handleNextPage}
						disabled={numPages === undefined || currPage === numPages}
						className='transition-colors duration-300 ease-in-out disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50'
					>
						<ChevronDownIcon className='size-4' />
					</Button>
				</div>

				<div className='space-x-2'>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='ghost'
								aria-label='zoom'
								className='gap-1.5 transition-colors duration-300 ease-in-out'
							>
								<SearchIcon className='size-4' />
								{scale * 100}%
								<ChevronDownIcon className='size-3 opacity-75' />
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
						variant='ghost'
						size='icon'
						aria-label='rotate 90 degrees'
						onClick={() => setRotation((prev) => prev + 90)}
						className='transition-colors duration-300 ease-in-out'
					>
						<RotateCwIcon className='size-4' />
					</Button>

					<PdfFullScreen fileUrl={url} />
				</div>
			</div>

			<Separator />

			<div className='max-h-screen w-full flex-1'>
				<SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
					<div ref={ref}>
						<Document
							file={url}
							loading={
								<div className='flex justify-center'>
									<Loader2Icon className='my-24 size-6 animate-spin' />
								</div>
							}
							onLoadSuccess={({ numPages }) => setNumPages(numPages)}
							onLoadError={() => {
								toast.error('Error loading PDF. Please try again later')
							}}
							className='max-h-full'
						>
							<Page
								width={width || 1}
								pageNumber={currPage}
								scale={scale}
								rotate={rotation}
								loading={
									<div className='flex justify-center'>
										<Loader2Icon className='my-24 size-6 animate-spin' />
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
