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
	reactStrictMode: false,
}

export default nextConfig
