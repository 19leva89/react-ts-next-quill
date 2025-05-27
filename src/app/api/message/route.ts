import { streamText } from 'ai'
import { TRPCError } from '@trpc/server'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { NextRequest, NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { getPineconeClient } from '@/lib/pinecone'
import { SendMessageValidator } from '@/lib/send-message-validator'

export const POST = async (req: NextRequest) => {
	// Endpoint for asking a question to a PDF file
	const body = await req.json()

	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user) {
		return new NextResponse('UNAUTHORIZED', { status: 401 })
	}

	const userId = user.id

	const { fileId, message } = SendMessageValidator.parse(body)

	const file = await prisma.file.findFirst({ where: { id: fileId, userId } })

	if (!file) return new NextResponse('Not found', { status: 404 })

	await prisma.message.create({ data: { text: message, isUserMessage: true, userId, fileId } })

	if (!process.env.OPENAI_API_KEY) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'The OpenAI API key is not set in the environment variables.',
		})
	}

	// 1: vectorize message
	const embeddings = new OpenAIEmbeddings({
		openAIApiKey: process.env.OPENAI_API_KEY,
		// batchSize: 512, // Default value if omitted is 512. Max is 2048
		// model: 'text-embedding-ada-002',
	})

	const pinecone = await getPineconeClient()
	const pineconeIndex = pinecone.index('quill')

	const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex, namespace: file.id })

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

	const previousConversation = formattedPrevMessages
		.map((message) =>
			message.role === 'user' ? `User: ${message.content}` : `Assistant: ${message.content}`,
		)
		.join('\n')

	const context = results.map((r) => r.pageContent).join('\n\n')

	const userMessage = `
			Use the following pieces of context (or previous conversation if needed) to answer the user's question in markdown format. 
			If you don't know the answer, just say that you don't know, don't try to make up an answer.

			----------------
			PREVIOUS CONVERSATION:
			${previousConversation}

			----------------
			CONTEXT:
			${context}

			USER INPUT: ${message}
		`

	try {
		const result = streamText({
			model: openai('gpt-3.5-turbo'),
			system: 'Answer in markdown format.',
			temperature: 0.2,
			messages: [{ role: 'user', content: userMessage }],
		})

		let completion = ''

		// Receive a text stream
		const stream = result.textStream

		// Collect the full response and save it in the DB
		const saveCompletion = async () => {
			for await (const textPart of stream) {
				completion += textPart
			}

			await prisma.message.create({ data: { text: completion, isUserMessage: false, fileId, userId } })
		}

		// Start saving in the background
		saveCompletion().catch(console.error)

		// Return the text stream directly
		return result.toTextStreamResponse()
	} catch (error) {
		console.error('Error processing the request:', error)

		if ((error as any)?.response?.status === 429) {
			return new NextResponse('API Rate Limit Exceeded', { status: 429 })
		}

		return new NextResponse('Internal Server Error', { status: 500 })
	}
}
