import { Pinecone as PineconeClient } from '@pinecone-database/pinecone'

export const getPineconeClient = async () => {
	const pinecone = new PineconeClient({
		apiKey: process.env.PINECONE_API_KEY!,
	})

	return pinecone
}
