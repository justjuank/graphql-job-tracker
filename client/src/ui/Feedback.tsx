import type { ReactNode } from 'react'

import { cn } from './cn'

type AlertProps = {
  children: ReactNode
  className?: string
  variant: 'error' | 'success'
}

export function Alert({ children, className, variant }: AlertProps) {
  if (variant === 'success') {
    return (
      <div
        className={cn(
          'mb-4 flex items-center gap-2.5 border border-[#bfd6c5] bg-[#e3f1e6] px-4 py-3 text-[0.82rem] font-bold text-[#245b38]',
          className,
        )}
        role="status"
      >
        <StatusDot />
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-l-[3px] border-[#d9573f] bg-[#fae8e3] px-3.5 py-3 text-[0.86rem] leading-[1.4] text-[#8f2f22]',
        className,
      )}
      role="alert"
    >
      {children}
    </div>
  )
}

export function StatusDot() {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-[#6db464] shadow-[0_0_0_4px_rgb(109_180_100_/_12%)]"
      aria-hidden="true"
    />
  )
}

export function Spinner() {
  return (
    <span
      className="size-9 animate-spin rounded-full border-[3px] border-[#ccd2ca] border-t-brand"
      aria-hidden="true"
    />
  )
}
