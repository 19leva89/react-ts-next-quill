import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@kinde-oss/kinde-auth-nextjs/server'

export default withAuth(
	async function middleware(req: NextRequest) {
		const path = req.nextUrl.pathname

		// Allow all API requests
		if (path.startsWith('/api') || path.startsWith('/_next/img')) {
			return NextResponse.next()
		}
	},
	{
		// Middleware still runs on all routes, but doesn't protect these
		publicPaths: ['/', '/pricing', '/auth-callback', '/api/webhooks/stripe', '/api/uploadthing'],
	},
)

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		// Always run for API routes
		'/(api|trpc)(.*)',
	],
}
