import { TRPCError } from '@trpc/server'
import { NextRequest } from 'next/server'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { prisma } from '@/db'
import { openai } from '@/lib/openai'
import { getPineconeClient } from '@/lib/pinecone'
import { SendMessageValidator } from '@/lib/send-message-validator'

export const POST = async (req: NextRequest) => {
	// Endpoint for asking a question to a PDF file
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
		openAIApiKey: process.env.OPENAI_API_KEY,
		// batchSize: 512, // Default value if omitted is 512. Max is 2048
		// model: 'text-embedding-ada-002',
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
		const completion = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			// model: 'gpt-4o-mini',
			temperature: 0.2,
			messages: [
				{ role: 'system', content: 'Answer in markdown format.' },
				{ role: 'user', content: userMessage },
			],
		})

		// Extracting text from the response
		const responseText = completion.choices[0].message?.content || 'No response generated.'

		// Saving the result to the database
		await prisma.message.create({
			data: {
				text: responseText,
				isUserMessage: false,
				fileId,
				userId,
			},
		})

		// Return the result to the client
		return new Response(responseText, {
			headers: { 'Content-Type': 'text/plain; charset=utf-8' },
		})
	} catch (error) {
		console.error('Error processing the request:', error)

		if ((error as any)?.response?.status === 429) {
			return new Response('API Rate Limit Exceeded', { status: 429 })
		}

		return new Response('Internal Server Error', { status: 500 })
	}
}
