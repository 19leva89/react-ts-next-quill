import Link from 'next/link'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { ArrowRightIcon, CheckIcon, HelpCircleIcon, MinusIcon } from 'lucide-react'

import { cn } from '@/lib'
import { PLANS } from '@/config/stripe'
import { MaxWidthWrapper, UpgradeButton } from '@/components/shared'
import {
	buttonVariants,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui'

const PricingPage = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	const pricingItems = [
		{
			plan: 'Free',
			tagline: 'For small side projects',
			quota: 10,
			features: [
				{
					text: '5 pages per PDF',
					footnote: 'The maximum amount of pages per PDF-file',
				},
				{
					text: '4MB file size limit',
					footnote: 'The maximum file size of a single PDF file',
				},
				{
					text: 'Mobile-friendly interface',
				},
				{
					text: 'Higher-quality responses',
					footnote: 'Better algorithmic responses for enhanced content quality',
					negative: true,
				},
				{
					text: 'Priority support',
					negative: true,
				},
			],
		},
		{
			plan: 'Pro',
			tagline: 'For larger projects with higher needs',
			quota: PLANS.find((plan) => plan.slug === 'pro')!.quota,
			features: [
				{
					text: '25 pages per PDF',
					footnote: 'The maximum amount of pages per PDF-file',
				},
				{
					text: '16MB file size limit',
					footnote: 'The maximum file size of a single PDF file',
				},
				{
					text: 'Mobile-friendly interface',
				},
				{
					text: 'Higher-quality responses',
					footnote: 'Better algorithmic responses for enhanced content quality',
				},
				{
					text: 'Priority support',
				},
			],
		},
	]

	return (
		<MaxWidthWrapper className='mt-24 mb-8 max-w-5xl text-center'>
			<div className='mx-auto mb-10 sm:max-w-lg'>
				<h1 className='text-6xl font-bold sm:text-7xl'>Pricing</h1>

				<p className='mt-5 text-gray-600 sm:text-lg'>
					Whether you&apos;re just trying out our service or need more, we&apos;ve got you covered
				</p>
			</div>

			<div className='grid grid-cols-1 gap-10 pt-12 lg:grid-cols-2'>
				<TooltipProvider>
					{pricingItems.map(({ plan, tagline, quota, features }) => {
						const price = PLANS.find((p) => p.slug === plan.toLowerCase())?.price.amount || 0

						return (
							<div
								key={plan}
								className={cn('relative rounded-2xl bg-white shadow-lg', {
									'border-2 border-blue-600 shadow-blue-200': plan === 'Pro',
									'border border-gray-200': plan !== 'Pro',
								})}
							>
								{plan === 'Pro' && (
									<div className='absolute -top-5 right-0 left-0 mx-auto w-32 rounded-full bg-linear-to-r from-blue-600 to-cyan-600 px-3 py-2 text-sm font-medium text-white'>
										Upgrade now
									</div>
								)}

								<div className='p-5'>
									<h3 className='font-display my-3 text-center text-3xl font-bold'>{plan}</h3>
									<p className='text-gray-500'>{tagline}</p>
									<p className='font-display my-5 text-6xl font-semibold'>${price}</p>
									<p className='text-gray-500'>per month</p>
								</div>

								<Separator className='border-t' />

								<div className='flex h-20 items-center justify-center bg-gray-50'>
									<div className='flex items-center space-x-1'>
										<p>{quota.toLocaleString()} PDFs/mo included</p>

										<Tooltip delayDuration={300}>
											<TooltipTrigger className='ml-1.5 cursor-default'>
												<HelpCircleIcon className='size-4 text-zinc-500' />
											</TooltipTrigger>

											<TooltipContent className='w-80 p-2'>
												How many PDFs you can upload per month
											</TooltipContent>
										</Tooltip>
									</div>
								</div>

								<Separator className='border-b' />

								<ul className='my-10 space-y-5 px-8'>
									{features.map(({ text, footnote, negative }) => (
										<li key={text} className='flex space-x-5'>
											<div className='shrink-0'>
												{negative ? (
													<MinusIcon className='size-6 text-gray-300' />
												) : (
													<CheckIcon className='size-6 text-blue-500' />
												)}
											</div>
											{footnote ? (
												<div className='flex items-center space-x-1'>
													<p
														className={cn('text-gray-600', {
															'text-gray-400': negative,
														})}
													>
														{text}
													</p>

													<Tooltip delayDuration={300}>
														<TooltipTrigger className='ml-1.5 cursor-default'>
															<HelpCircleIcon className='size-4 text-zinc-500' />
														</TooltipTrigger>

														<TooltipContent className='w-80 p-2'>{footnote}</TooltipContent>
													</Tooltip>
												</div>
											) : (
												<p
													className={cn('text-gray-600', {
														'text-gray-400': negative,
													})}
												>
													{text}
												</p>
											)}
										</li>
									))}
								</ul>

								<Separator className='border-t' />

								<div className='p-5'>
									{plan === 'Free' ? (
										<Link
											href={user ? '/dashboard' : '/sign-in'}
											className={buttonVariants({
												className: 'w-full transition-colors duration-300 ease-in-out',
												variant: 'secondary',
											})}
										>
											{user ? 'Upgrade now' : 'Sign up'}

											<ArrowRightIcon className='ml-1.5 size-5' />
										</Link>
									) : user ? (
										<UpgradeButton />
									) : (
										<Link
											href='/sign-in'
											className={buttonVariants({
												className: 'w-full transition-colors duration-300 ease-in-out',
											})}
										>
											{user ? 'Upgrade now' : 'Sign up'}

											<ArrowRightIcon className='ml-1.5 size-5' />
										</Link>
									)}
								</div>
							</div>
						)
					})}
				</TooltipProvider>
			</div>
		</MaxWidthWrapper>
	)
}

export default PricingPage
