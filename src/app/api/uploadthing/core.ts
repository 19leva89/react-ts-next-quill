import { prisma } from '@/db'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

// import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
// import { PineconeStore } from 'langchain/vectorstores/pinecone'
// import { getPineconeClient } from '@/lib/pinecone'
// import { getUserSubscriptionPlan } from '@/lib/stripe'
// import { PLANS } from '@/config/stripe'

const file = createUploadthing()

const middleware = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) throw new Error('UNAUTHORIZED')

	// const subscriptionPlan = await getUserSubscriptionPlan()

	return {
		// subscriptionPlan,
		userId: user.id,
	}
}

const onUploadComplete = async ({
	metadata,
	file,
}: {
	metadata: Awaited<ReturnType<typeof middleware>>
	file: {
		key: string
		name: string
		url: string
	}
}) => {
	const isFileExist = await prisma.file.findFirst({
		where: {
			key: file.key,
		},
	})

	if (isFileExist) return

	const createdFile = await prisma.file.create({
		data: {
			key: file.key,
			name: file.name,
			userId: metadata.userId,
			url: file.url,
			uploadStatus: 'PROCESSING',
		},
	})

	try {
		const response = await fetch(file.url)

		const blob = await response.blob()

		const loader = new PDFLoader(blob)

		const pageLevelDocs = await loader.load()

		const pagesAmt = pageLevelDocs.length

		const { subscriptionPlan } = metadata
		const { isSubscribed } = subscriptionPlan

		const isProExceeded = pagesAmt > PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf
		const isFreeExceeded = pagesAmt > PLANS.find((plan) => plan.name === 'Free')!.pagesPerPdf

		if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
			await prisma.file.update({
				data: {
					uploadStatus: 'FAILED',
				},
				where: {
					id: createdFile.id,
				},
			})
		}

		// vectorize and index entire document
		const pinecone = await getPineconeClient()
		const pineconeIndex = pinecone.Index('quill')

		const embeddings = new OpenAIEmbeddings({
			openAIApiKey: process.env.OPENAI_API_KEY,
		})

		await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
			pineconeIndex,
			namespace: createdFile.id,
		})

		await prisma.file.update({
			data: {
				uploadStatus: 'SUCCESS',
			},
			where: {
				id: createdFile.id,
			},
		})
	} catch (err) {
		await prisma.file.update({
			data: {
				uploadStatus: 'FAILED',
			},
			where: {
				id: createdFile.id,
			},
		})
	}
}

export const ourFileRouter = {
	freePlanUploader: file({ pdf: { maxFileSize: '4MB' } })
		.middleware(middleware)
		.onUploadComplete(onUploadComplete),

	proPlanUploader: file({ pdf: { maxFileSize: '16MB' } })
		.middleware(middleware)
		.onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
