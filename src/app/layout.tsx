import { Inter } from 'next/font/google'
import { PropsWithChildren } from 'react'

import { Toaster } from '@/components/ui'
import { cn, constructMetadata } from '@/lib'
import { Navbar } from '@/components/shared/navbar'
import { AuthProvider } from '@/components/shared/auth-provider'

import './globals.css'
import 'simplebar-react/dist/simplebar.min.css'

export const metadata = constructMetadata()

const inter = Inter({ subsets: ['latin'] })

export default async function RootLayout({ children }: PropsWithChildren) {
	return (
		<html lang='en' className='light'>
			<body className={cn('grainy min-h-screen font-sans antialiased', inter.className)}>
				<AuthProvider>
					<Toaster position='bottom-right' expand={false} richColors />

					<Navbar />

					{children}
				</AuthProvider>
			</body>
		</html>
	)
}
