'use client'

import Link from 'next/link'
import Skeleton from 'react-loading-skeleton'

import { useState } from 'react'
import { format } from 'date-fns'
import { GhostIcon, Loader2Icon, MessageSquareIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { trpc } from '@/app/_trpc/client'
import { Button, Separator } from '@/components/ui'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { UploadButton } from '@/components/shared/upload-button'

interface Props {
	subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}

export const Dashboard = ({ subscriptionPlan }: Props) => {
	const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<string | null>(null)

	const utils = trpc.useUtils()

	const { data: files, isLoading } = trpc.getUserFiles.useQuery()

	const { mutate: deleteFile } = trpc.deleteFile.useMutation({
		onSuccess: () => {
			utils.getUserFiles.invalidate()
		},
		onMutate({ id }) {
			setCurrentlyDeletingFile(id)
		},
		onSettled() {
			setCurrentlyDeletingFile(null)
		},
	})

	return (
		<main className="mx-auto max-w-7xl md:p-10">
			<div className="mt-8 flex flex-col items-start justify-between gap-4 pb-5 sm:flex-row sm:items-center sm:gap-0">
				<h1 className="mb-3 font-bold text-5xl text-gray-900">My Files</h1>

				<UploadButton isSubscribed={subscriptionPlan.isSubscribed} />
			</div>

			<Separator />

			{/* display all user files */}
			{files && files?.length !== 0 ? (
				<ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{files
						.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
						.map((file) => (
							<li
								key={file.id}
								className="col-span-1 rounded-lg bg-white shadow-sm transition hover:shadow-lg"
							>
								<div className="flex flex-col gap-2">
									<div className="pt-6 px-6 flex w-full items-center justify-between space-x-6">
										<Link
											href={`/dashboard/${file.id}`}
											className="h-10 w-10 shrink-0 rounded-full bg-linear-to-r from-cyan-500 to-blue-500"
										/>

										<div className="flex-1 truncate">
											<div className="flex items-center space-x-3">
												<h3 className="truncate text-lg font-medium text-zinc-900">
													<Link href={`/dashboard/${file.id}`}>{file.name}</Link>
												</h3>
											</div>
										</div>
									</div>
								</div>

								<Separator className="mt-4" />

								<div className="px-6 grid grid-cols-3 place-items-center py-2 gap-6 text-xs text-zinc-500">
									<div className="flex items-center gap-2">
										<PlusIcon className="h-4 w-4" />

										{format(new Date(file.createdAt), 'MMM yyyy')}
									</div>

									<div className="flex items-center gap-2">
										<MessageSquareIcon className="h-4 w-4" />
										mocked
									</div>

									<Button
										onClick={() => deleteFile({ id: file.id })}
										size="sm"
										className="w-full"
										variant="destructive"
									>
										{currentlyDeletingFile === file.id ? (
											<Loader2Icon className="h-4 w-4 animate-spin" />
										) : (
											<TrashIcon className="h-4 w-4" />
										)}
									</Button>
								</div>
							</li>
						))}
				</ul>
			) : isLoading ? (
				<Skeleton height={100} className="my-2" count={3} />
			) : (
				<div className="mt-16 flex flex-col items-center gap-2">
					<GhostIcon className="h-8 w-8 text-zinc-800" />

					<h3 className="font-semibold text-xl">Pretty empty around here</h3>

					<p>Let&apos;s upload your first PDF</p>
				</div>
			)}
		</main>
	)
}
