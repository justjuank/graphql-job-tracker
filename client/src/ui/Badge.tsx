import type { ReactNode } from 'react'

import { cn } from './cn'

type BadgeProps = {
  children: ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-3 py-2 text-[0.68rem] font-black tracking-[0.1em] uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}
