'use client'

import Dropzone from 'react-dropzone'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CloudIcon, FileIcon, Loader2Icon } from 'lucide-react'

import { PLANS } from '@/config/stripe'
import { trpc } from '@/app/_trpc/client'
import { useUploadThing } from '@/lib/uploadthing'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, Progress } from '@/components/ui'

interface Props {
	isSubscribed: boolean
}

const UploadDropzone = ({ isSubscribed }: Props) => {
	const router = useRouter()

	const [isUploading, setIsUploading] = useState<boolean>(false)
	const [uploadProgress, setUploadProgress] = useState<number>(0)

	const { mutateAsync, data, error } = trpc.getFile.useMutation()
	const { startUpload } = useUploadThing(isSubscribed ? 'proPlanUploader' : 'freePlanUploader')

	const startSimulatedProgress = () => {
		setUploadProgress(0)

		const interval = setInterval(() => {
			setUploadProgress((prevProgress) => {
				if (prevProgress >= 95) {
					clearInterval(interval)

					return prevProgress
				}

				return prevProgress + 5
			})
		}, 500)

		return interval
	}

	useEffect(() => {
		if (data) {
			router.push(`/dashboard/${data.id}`)
		} else if (error?.data?.code === 'UNAUTHORIZED') {
			router.push('/sign-in')
		}
	}, [data, error, router])

	return (
		<Dropzone
			multiple={false}
			onDrop={(acceptedFile) => {
				setIsUploading(true)

				const progressInterval = startSimulatedProgress()

				// console.log('Accepted file:', acceptedFile)
				// handle file uploading
				startUpload(acceptedFile).then((res) => {
					// console.log('Upload result:', res)
					if (!res || res.length === 0) {
						console.error('Upload failed: no response')

						return toast.error('Upload failed. Try again')
					}

					const fileResponse = res?.[0]

					const key = fileResponse?.key
					// console.log('File uploaded with key:', key)
					if (!key) {
						return toast.error('Something went wrong. Please try again later')
					}

					clearInterval(progressInterval)
					setUploadProgress(100)

					// setTimeout(() => {
					mutateAsync({ key })
					// }, 10000)
				})
			}}
		>
			{({ getRootProps, getInputProps, acceptedFiles }) => (
				<div {...getRootProps()} className='m-4 h-64 rounded-lg border border-dashed border-gray-300'>
					<div className='flex size-full items-center justify-center'>
						<label
							htmlFor='dropzone-file'
							className='flex size-full cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100'
						>
							<div className='flex flex-col items-center justify-center pt-5 pb-6'>
								<CloudIcon className='mb-2 size-6 text-zinc-500' />

								<p className='mb-2 text-sm text-zinc-700'>
									<span className='font-semibold'>Click to upload</span> or drag and drop
								</p>

								<p className='text-xs text-zinc-500'>
									PDF (up to {isSubscribed ? '16' : '4'} MB and{' '}
									{isSubscribed
										? PLANS.find((plan) => plan.name === 'Pro')?.pagesPerPdf
										: PLANS.find((plan) => plan.name === 'Free')?.pagesPerPdf}{' '}
									Pages)
								</p>
							</div>

							{acceptedFiles && acceptedFiles[0] ? (
								<div className='flex max-w-xs items-center divide-x divide-zinc-200 overflow-hidden rounded-md bg-white outline-[1px] outline-zinc-200'>
									<div className='grid h-full place-items-center px-3 py-2'>
										<FileIcon className='size-4 text-blue-500' />
									</div>

									<div className='h-full truncate px-3 py-2 text-sm'>{acceptedFiles[0].name}</div>
								</div>
							) : null}

							{isUploading ? (
								<div className='mx-auto mt-4 w-full max-w-xs'>
									<Progress
										value={uploadProgress}
										indicatorColor={uploadProgress === 100 ? 'bg-green-500' : ''}
										className='h-1 w-full bg-zinc-200'
									/>

									{uploadProgress === 100 ? (
										<div className='flex items-center justify-center gap-1 pt-2 text-center text-sm text-zinc-700'>
											<Loader2Icon className='size-3 animate-spin' />
											Redirecting...
										</div>
									) : null}
								</div>
							) : null}

							<input {...getInputProps()} type='file' id='dropzone-file' className='hidden' />
						</label>
					</div>
				</div>
			)}
		</Dropzone>
	)
}

export const UploadButton = ({ isSubscribed }: { isSubscribed: boolean }) => {
	const [isOpen, setIsOpen] = useState<boolean>(false)

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
				<Button className='transition-colors duration-300 ease-in-out'>Upload PDF</Button>
			</DialogTrigger>

			<DialogContent aria-describedby={undefined}>
				<VisuallyHidden asChild>
					<DialogTitle>PDF Document Upload</DialogTitle>
				</VisuallyHidden>

				<UploadDropzone isSubscribed={isSubscribed} />
			</DialogContent>
		</Dialog>
	)
}
