import { notFound, redirect } from 'next/navigation'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/lib/prisma'
import { ChatWrapper } from '@/components/shared/chat'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { PDFViewer } from '@/components/shared/pdf-viewer'

interface Props {
	params: Promise<{ fileId: string }>
}

const DashboardIdPage = async ({ params }: Props) => {
	const { fileId } = await params

	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileId}`)

	const file = await prisma.file.findFirst({
		where: {
			id: fileId,
			userId: user.id,
		},
	})

	if (!file) notFound()

	const plan = await getUserSubscriptionPlan()

	// Define a new file status depending on the plan
	const newStatus = plan.name === 'Pro' ? 'SUCCESS' : 'FAILED'

	// Update the file status if it does not match the required one
	if (file.uploadStatus !== newStatus) {
		await prisma.file.update({
			where: { id: fileId },
			data: { uploadStatus: newStatus },
		})
	}

	return (
		<div className="flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]">
			<div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
				{/* Left sidebar & main wrapper */}
				<div className="flex-1 xl:flex">
					<div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
						{/* Main area */}
						<PDFViewer url={file.url} />
					</div>
				</div>

				<div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
					<ChatWrapper isSubscribed={plan.isSubscribed} fileId={file.id} />
				</div>
			</div>
		</div>
	)
}

export default DashboardIdPage
