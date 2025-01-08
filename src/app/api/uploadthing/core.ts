import { TRPCError } from '@trpc/server'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/db'
import { PLANS } from '@/config/stripe'
import { getPineconeClient } from '@/lib/pinecone'
import { getUserSubscriptionPlan } from '@/lib/stripe'

const f = createUploadthing()

const middleware = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) {
		console.error('User not authenticated')

		throw new TRPCError({ code: 'UNAUTHORIZED' })
	}

	console.log('User authenticated:', user.id)

	const subscriptionPlan = await getUserSubscriptionPlan()
	console.log('User subscription plan:', subscriptionPlan)

	return {
		subscriptionPlan,
		userId: user.id,
	}
}

const updateFileStatus = async (fileId: string, status: 'FAILED' | 'SUCCESS') => {
	try {
		await prisma.file.update({
			data: { uploadStatus: status },
			where: { id: fileId },
		})
	} catch (error) {
		console.error(`Failed to update file status to ${status} for file ID ${fileId}:`, error)
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
	let createdFile: { id: string } | null = null

	try {
		// Проверка на существование файла в базе данных
		const isFileExist = await prisma.file.findUnique({
			where: {
				key: file.key,
			},
		})

		// Если файл уже существует, выходим
		if (isFileExist) {
			console.log('A file with this key already exists:', file.key)
			return
		}

		console.log('Generated file URL:', file.url)
		console.log('User ID:', metadata.userId)

		// Проверка наличия всех необходимых данных
		if (!file.key || !file.name || !metadata.userId || !file.url) {
			console.error('Missing data for file creation:', { file, metadata })
			return
		}

		// Создание записи в базе данных
		createdFile = await prisma.file.create({
			data: {
				key: file.key,
				name: file.name,
				userId: metadata.userId,
				url: file.url,
				uploadStatus: 'PROCESSING',
			},
		})

		console.log('File created successfully:', createdFile)

		// Загрузка PDF файла
		const response = await fetch(file.url)
		const blob = await response.blob()

		// Инициализация PDF загрузчика и обработка документа
		const loader = new PDFLoader(blob)
		const pageLevelDocs = await loader.load()
		console.log('Document pages:', pageLevelDocs.length)

		const proPlan = PLANS.find((plan) => plan.name === 'Pro')
		const freePlan = PLANS.find((plan) => plan.name === 'Free')
		if (!proPlan || !freePlan) {
			throw new Error('Subscription plans are not configured.')
		}

		const pagesAmount = pageLevelDocs.length
		const { isSubscribed } = metadata.subscriptionPlan

		if (
			(isSubscribed && pagesAmount > proPlan.pagesPerPdf) ||
			(!isSubscribed && pagesAmount > freePlan.pagesPerPdf)
		) {
			if (createdFile) {
				await updateFileStatus(createdFile.id, 'FAILED')
			}
			return
		}

		// Инициализация Pinecone клиента и индекса
		console.log('Инициализация клиента Pinecone...')
		const pinecone = await getPineconeClient()
		console.log('Клиент Pinecone успешно инициализирован.')

		const pineconeIndex = pinecone.index('quill')
		console.log('Индекс Pinecone получен:', pineconeIndex)

		// Инициализация OpenAI Embeddings
		console.log('Инициализация OpenAIEmbeddings...')
		const embeddings = new OpenAIEmbeddings({
			apiKey: process.env.OPENAI_API_KEY,
			batchSize: 512, // Default value if omitted is 512. Max is 2048
			model: 'text-embedding-ada-002',
		})
		console.log('OpenAIEmbeddings успешно инициализированы.', embeddings)

		// Обработка документов с помощью PineconeStore
		console.log('Обработка документов с помощью PineconeStore...')
		await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
			pineconeIndex,
			namespace: createdFile.id,
		})
		console.log('Документы успешно обработаны.')

		// Обновление статуса файла на успешную загрузку
		if (createdFile) {
			await updateFileStatus(createdFile.id, 'SUCCESS')
		}
	} catch (error) {
		console.error('Error processing file:', error)

		if (createdFile) {
			await updateFileStatus(createdFile.id, 'FAILED')
		} else {
			console.error('File creation failed, cannot update status.')
		}
	}
}

export const uploadRouter = {
	freePlanUploader: f({ pdf: { maxFileSize: '4MB' } })
		.middleware(middleware)
		.onUploadComplete(onUploadComplete),

	proPlanUploader: f({ pdf: { maxFileSize: '16MB' } })
		.middleware(middleware)
		.onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
