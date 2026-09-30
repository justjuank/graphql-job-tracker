import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from './cn'

type EyebrowProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode
}

export function Eyebrow({ children, className, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(
        'mb-3.5 text-[0.72rem] font-extrabold tracking-[0.13em] text-accent uppercase',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  )
}
