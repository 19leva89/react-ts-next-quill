import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	async redirects() {
		return [
			{
				source: '/sign-in',
				destination: '/api/auth/login',
				permanent: true,
			},
			{
				source: '/sign-up',
				destination: '/api/auth/register',
				permanent: true,
			},
		]
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'gravatar.com',
			},
		],
		unoptimized: true,
	},
	// cacheComponents: true,
	reactCompiler: true,
	reactStrictMode: false,
	poweredByHeader: false, // remove X-Powered-By
	compress: true, // gzip compression
}

export default nextConfig
