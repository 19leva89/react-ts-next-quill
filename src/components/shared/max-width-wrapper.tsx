import { ReactNode } from 'react'

import { cn } from '@/lib'

interface Props {
	className?: string
	children: ReactNode
}

export const MaxWidthWrapper = ({ className, children }: Props) => {
	return (
		<div className={cn('mx-auto w-full max-w-(--breakpoint-xl) px-2.5 md:px-20', className)}>{children}</div>
	)
}
