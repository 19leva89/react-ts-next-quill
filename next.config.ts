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

	reactStrictMode: false,

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
	// 	if (!isServer) {
	// 		config.resolve.fallback = {
	// 			...config.resolve.fallback,
	// 			fs: false, // Отключаем обработку fs для клиентской стороны
	// 		}
	// 	}

	// 	config.resolve.alias.canvas = false
	// 	config.resolve.alias.encoding = false

	// 	return config
	// },
}

export default nextConfig
