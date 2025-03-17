import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@kinde-oss/kinde-auth-nextjs/server'

export default withAuth(
	async function middleware(req: NextRequest) {
		// Allow all API requests
		if (req.nextUrl.pathname.startsWith('/api')) {
			return NextResponse.next()
		}
	},
	{
		// Middleware still runs on all routes, but doesn't protect these
		publicPaths: ['/', '/auth-callback', '/api/webhooks/stripe', '/api/uploadthing'],
	},
)

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
