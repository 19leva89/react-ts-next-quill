'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRightIcon, MenuIcon } from 'lucide-react'
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components'

import { Separator } from '@/components/ui'

interface Props {
	isAuth: boolean
}

export const MobileNavbar = ({ isAuth }: Props) => {
	const [isOpen, setOpen] = useState<boolean>(false)

	const toggleOpen = () => setOpen((prev) => !prev)

	const pathname = usePathname()

	useEffect(() => {
		if (isOpen) toggleOpen()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])

	const closeOnCurrent = (href: string) => {
		if (pathname === href) {
			toggleOpen()
		}
	}

	return (
		<div className='sm:hidden'>
			<MenuIcon onClick={toggleOpen} className='relative z-50 size-5 cursor-pointer text-zinc-700' />

			{isOpen ? (
				<div className='fixed inset-0 z-0 w-full animate-in fade-in-20 slide-in-from-top-5'>
					<Separator className='border-b' />

					<ul className='absolute grid w-full gap-3 bg-white px-10 pt-20 pb-8 shadow-xl'>
						{!isAuth ? (
							<>
								<li>
									<Link
										onClick={() => closeOnCurrent('/sign-up')}
										className='flex w-full items-center font-semibold text-green-600'
										href='/sign-up'
									>
										Get started
										<ArrowRightIcon className='ml-2 size-5' />
									</Link>
								</li>

								<li className='my-3 h-px w-full bg-gray-300' />

								<li>
									<Link
										onClick={() => closeOnCurrent('/sign-in')}
										className='flex w-full items-center font-semibold'
										href='/sign-in'
									>
										Sign in
									</Link>
								</li>

								<li className='my-3 h-px w-full bg-gray-300' />

								<li>
									<Link
										onClick={() => closeOnCurrent('/pricing')}
										className='flex w-full items-center font-semibold'
										href='/pricing'
									>
										Pricing
									</Link>
								</li>
							</>
						) : (
							<>
								<li>
									<Link
										onClick={() => closeOnCurrent('/dashboard')}
										className='flex w-full items-center font-semibold'
										href='/dashboard'
									>
										Dashboard
									</Link>
								</li>

								<li className='my-3 h-px w-full bg-gray-300' />

								<li>
									<div className='flex w-full items-center font-semibold'>
										<LogoutLink>Log out</LogoutLink>
									</div>
								</li>
							</>
						)}
					</ul>
				</div>
			) : null}
		</div>
	)
}
