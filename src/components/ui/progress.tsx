'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import { ComponentProps } from 'react'

import { cn } from '@/lib'

function Progress({
	className,
	value,
	indicatorColor,
	...props
}: ComponentProps<typeof ProgressPrimitive.Root> & {
	indicatorColor?: string
}) {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className={cn('h-full w-full flex-1 bg-primary transition-all', indicatorColor)}
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	)
}

export { Progress }
