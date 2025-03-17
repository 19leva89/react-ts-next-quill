import { forwardRef } from 'react'
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize'

import { cn } from '@/lib'

interface TextareaProps extends TextareaAutosizeProps {
	label?: string
}

function TextareaComponent(
	{ className, ...props }: TextareaProps,
	ref: React.ForwardedRef<HTMLTextAreaElement>,
) {
	return (
		<TextareaAutosize
			data-slot="textarea"
			ref={ref}
			className={cn(
				'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				className,
			)}
			{...props}
		/>
	)
}

const Textarea = forwardRef(TextareaComponent)
Textarea.displayName = 'Textarea'

export { Textarea }
