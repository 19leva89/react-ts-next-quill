'use server'

import Link from 'next/link'
import Image from 'next/image'
import { GemIcon } from 'lucide-react'
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/server'

import {
	Avatar,
	AvatarFallback,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui'
import { Icons } from '@/components/shared'
import { getUserSubscriptionPlan } from '@/lib/stripe'

interface Props {
	email: string | undefined
	name: string
	imageUrl: string
}

export const UserAccountNav = async ({ email, imageUrl, name }: Props) => {
	const subscriptionPlan = await getUserSubscriptionPlan()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild className="overflow-visible">
				<Button className="rounded-full h-8 w-8 aspect-square bg-slate-400 transition-colors ease-in-out duration-300">
					<Avatar className="relative w-8 h-8">
						{imageUrl ? (
							<div className="relative aspect-square h-full w-full">
								<Image
									fill
									src={imageUrl}
									alt="profile picture"
									referrerPolicy="no-referrer"
									className="object-cover"
								/>
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="text-white text-xl font-bold">{name.charAt(0)}</span>
								</div>
							</div>
						) : (
							<AvatarFallback>
								<span className="sr-only">{name}</span>

								<Icons.user className="h-4 w-4 text-zinc-900" />
							</AvatarFallback>
						)}
					</Avatar>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="bg-white" align="end">
				<div className="flex items-center justify-start gap-2 p-2">
					<div className="flex flex-col space-y-0.5 leading-none">
						{name && <p className="font-medium text-sm text-black">{name}</p>}

						{email && <p className="w-[200px] truncate text-xs text-zinc-700">{email}</p>}
					</div>
				</div>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link href="/dashboard">Dashboard</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					{subscriptionPlan?.isSubscribed ? (
						<Link href="/dashboard/billing">Manage Subscription</Link>
					) : (
						<Link href="/pricing">
							Upgrade to PRO
							<GemIcon className="text-blue-600 h-4 w-4 ml-1.5" />
						</Link>
					)}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem className="cursor-pointer">
					<LogoutLink>Log out</LogoutLink>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
