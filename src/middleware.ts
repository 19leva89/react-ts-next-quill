import { withAuth } from '@kinde-oss/kinde-auth-nextjs/server'

export default withAuth(async function middleware() {}, {
	// Middleware still runs on all routes, but doesn't protect these
	publicPaths: ['/', '/auth-callback'],
})

export const config = {
	matcher: [
		// Run on everything but Next internals and static files
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
	],
}
