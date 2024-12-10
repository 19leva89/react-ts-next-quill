import { TRPCError } from '@trpc/server'
import { NextRequest } from 'next/server'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
// import { streamText } from 'ai'
// import { openai } from '@ai-sdk/openai'

import { prisma } from '@/db'
import { aiClient } from '@/lib/openai'
import { getPineconeClient } from '@/lib/pinecone'
import { SendMessageValidator } from '@/lib/send-message-validator'

export const POST = async (req: NextRequest) => {
	// endpoint for asking a question to a pdf file
	const body = await req.json()

	const { getUser } = getKindeServerSession()
	const user = await getUser()

	const { id: userId } = user

	if (!userId) return new Response('UNAUTHORIZED', { status: 401 })

	const { fileId, message } = SendMessageValidator.parse(body)

	const file = await prisma.file.findFirst({
		where: {
			id: fileId,
			userId,
		},
	})

	if (!file) return new Response('Not found', { status: 404 })

	await prisma.message.create({
		data: {
			text: message,
			isUserMessage: true,
			userId,
			fileId,
		},
	})

	if (!process.env.OPENAI_API_KEY) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'The OpenAI API key is not set in the environment variables.',
		})
	}

	// 1: vectorize message
	const embeddings = new OpenAIEmbeddings({
		apiKey: process.env.OPENAI_API_KEY,
		batchSize: 512, // Default value if omitted is 512. Max is 2048
		model: 'text-embedding-ada-002',
	})

	const pinecone = await getPineconeClient()
	const pineconeIndex = pinecone.index('quill')

	const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
		pineconeIndex,
		namespace: file.id,
	})

	const results = await vectorStore.similaritySearch(message, 4)

	const prevMessages = await prisma.message.findMany({
		where: { fileId },
		orderBy: { createdAt: 'asc' },
		take: 6,
	})

	const formattedPrevMessages = prevMessages.map((msg) => ({
		role: msg.isUserMessage ? ('user' as const) : ('assistant' as const),
		content: msg.text,
	}))

	try {
		const response = await aiClient.chat.completions.create({
			model: 'gpt-3.5-turbo',
			stream: true,
			messages: [
				{
					role: 'system',
					content:
						'Use the following pieces of context (or previous conversation if needed) to answer the users question in markdown format.',
				},
				{
					role: 'user',
					content: `Use the following pieces of context (or previous conversation if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
					\n----------------\n
					PREVIOUS CONVERSATION:
					${formattedPrevMessages.map((message) => {
						if (message.role === 'user') return `User: ${message.content}\n`
						return `Assistant: ${message.content}\n`
					})}

					\n----------------\n
					CONTEXT:
					${results.map((r: { pageContent: string }) => r.pageContent).join('\n\n')}

					USER INPUT: ${message}`,
				},
			],
		})

		// Потоковая передача ответа с использованием streamText
		const stream = new ReadableStream({
			async start(controller) {
				for await (const chunk of response) {
					const text = chunk.choices[0].delta?.content || ''
					controller.enqueue(new TextEncoder().encode(text))

					// Сохраняем частичный ответ в базе данных
					await prisma.message.create({
						data: {
							text,
							isUserMessage: false,
							userId,
							fileId,
						},
					})
				}
				controller.close()
			},
		})

		// Используем streamText для отправки потока в клиент
		return new Response(stream, {
			headers: { 'Content-Type': 'text/plain; charset=utf-8' },
		})
	} catch (error) {
		if ((error as any).response?.status === 429) {
			// Handle the 429 error
			console.error('API Rate Limit Exceeded:', error)
			return new Response('API Rate Limit Exceeded', { status: 429 })
		} else {
			console.error('API Request Error:', error)
			return new Response('Internal Server Error', { status: 500 })
		}
	}
}
