import { TRPCError } from '@trpc/server'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/db'
import { PLANS } from '@/config/stripe'
import { UploadStatus } from '@prisma/client'
import { getPineconeClient } from '@/lib/pinecone'
import { getUserSubscriptionPlan } from '@/lib/stripe'

const f = createUploadthing()

const middleware = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) throw new TRPCError({ code: 'UNAUTHORIZED' })
	console.log('User ID:', user.id)

	const subscriptionPlan = await getUserSubscriptionPlan()
	console.log('subscriptionPlan', subscriptionPlan)

	return {
		subscriptionPlan,
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
	// Проверка на существование файла в базе данных
	const isFileExist = await prisma.file.findFirst({
		where: {
			key: file.key,
		},
	})
	console.log('Файл уже существует:', isFileExist)

	// Если файл уже существует, выходим
	if (isFileExist) return

	console.log('Generated file URL:', file.url)
	console.log('User ID:', metadata.userId)

	// Создание записи в базе данных
	const createdFile = await prisma.file.create({
		data: {
			key: file.key,
			name: file.name,
			userId: metadata.userId,
			url: file.url,
			uploadStatus: UploadStatus.PROCESSING,
		},
	})
	console.log('Файл успешно создан:', createdFile)

	try {
		// Загрузка PDF файла
		const response = await fetch(file.url)
		const blob = await response.blob()

		// Инициализация PDF загрузчика и обработка документа
		const loader = new PDFLoader(blob)
		const pageLevelDocs = await loader.load()
		console.log('Количество документов для обработки:', pageLevelDocs.length)

		const pagesAmount = pageLevelDocs.length

		const { subscriptionPlan } = metadata
		const { isSubscribed } = subscriptionPlan

		const isProExceeded = pagesAmount > PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf
		const isFreeExceeded = pagesAmount > PLANS.find((plan) => plan.name === 'Free')!.pagesPerPdf

		if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
			await prisma.file.update({
				data: {
					uploadStatus: UploadStatus.FAILED,
				},
				where: {
					id: createdFile.id,
				},
			})
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
		await prisma.file.update({
			data: {
				uploadStatus: UploadStatus.SUCCESS,
			},
			where: {
				id: createdFile.id,
			},
		})
	} catch {
		await prisma.file.update({
			data: {
				uploadStatus: UploadStatus.FAILED,
			},
			where: {
				id: createdFile.id,
			},
		})
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
