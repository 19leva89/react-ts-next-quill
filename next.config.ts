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

	// webpack: (config) => {
	// 	config.resolve.alias = {
	// 		...config.resolve.alias,
	// 		canvas: false,
	// 		encoding: false,
	// 	}
	// 	return config
	// },
}

export default nextConfig
