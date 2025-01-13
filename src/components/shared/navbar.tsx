'use server'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { LoginLink, RegisterLink, getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { buttonVariants, Separator } from '@/components/ui'
import { MaxWidthWrapper, MobileNavbar } from '@/components/shared'
import { UserAccountNav } from '@/components/shared/user-account-nav'

export const Navbar = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	return (
		<>
			<nav className="sticky h-14 inset-x-0 top-0 z-30 w-full bg-white/75 backdrop-blur-lg transition-all">
				<MaxWidthWrapper>
					<div className="flex h-14 items-center justify-between">
						<Link href="/" className="flex z-40 font-semibold">
							<Image src="/svg/quill-logo.svg" alt="quill" width={56} height={32} priority />
						</Link>

						<MobileNavbar isAuth={!!user} />

						<div className="hidden items-center space-x-4 sm:flex">
							{!user ? (
								<>
									<Link
										href="/pricing"
										className={buttonVariants({
											variant: 'ghost',
											size: 'sm',
										})}
									>
										Pricing
									</Link>

									<LoginLink
										className={buttonVariants({
											variant: 'ghost',
											size: 'sm',
										})}
									>
										Sign in
									</LoginLink>

									<RegisterLink
										className={buttonVariants({
											size: 'sm',
										})}
									>
										Get started <ArrowRight className="ml-1.5 h-5 w-5" />
									</RegisterLink>
								</>
							) : (
								<>
									<Link
										href="/dashboard"
										className={buttonVariants({
											variant: 'ghost',
											size: 'sm',
										})}
									>
										Dashboard
									</Link>

									<UserAccountNav
										name={
											!user.given_name || !user.family_name
												? 'Your Account'
												: `${user.given_name} ${user.family_name}`
										}
										email={user.email ?? ''}
										imageUrl={user.picture ?? ''}
									/>
								</>
							)}
						</div>
					</div>
				</MaxWidthWrapper>
			</nav>

			<Separator />
		</>
	)
}
