import { Metadata } from 'next'
import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string): string {
	// If in a browser, return the relative path
	if (typeof window !== 'undefined') {
		return path
	}

	// Define the base URL
	const baseUrl = process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}`
		: `http://localhost:${process.env.PORT || 3000}`

	// Remove extra slashes to avoid format errors
	return new URL(path, baseUrl).toString()
}

export function constructMetadata({
	title = 'Quill - the SaaS for students',
	description = 'Quill is an open-source software to make chatting to your PDF files easy',
	image = '/thumbnail.png',
	icons = '/favicon.ico',
	noIndex = false,
}: {
	title?: string
	description?: string
	image?: string
	icons?: string
	noIndex?: boolean
} = {}): Metadata {
	return {
		title,
		description,
		openGraph: {
			title,
			description,
			images: [
				{
					url: image,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [image],
			creator: '@joshtriedcoding',
		},
		icons,
		metadataBase: new URL('https://quill-jet.vercel.app'),
		themeColor: '#FFF',
		...(noIndex && {
			robots: {
				index: false,
				follow: false,
			},
		}),
	}
}
