import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from './cn'

const variantClasses = {
  primary:
    'border-brand bg-brand text-white hover:not-disabled:bg-brand-hover',
  secondary:
    'border-[#bdc7bf] bg-transparent text-brand hover:not-disabled:border-brand',
  danger: 'border-[#a64032] bg-[#a64032] text-white',
  lime: 'border-lime bg-lime text-brand',
  ghost: 'border-white/25 bg-transparent text-white/80',
  text: 'h-auto border-0 border-b border-[#eff5ef]/30 bg-transparent px-0 py-2 text-[#eff5ef]/75',
} as const

const sizeClasses = {
  medium: 'h-11 px-4',
  tall: 'min-h-[54px] px-5',
  compact: 'min-h-[42px] px-[15px]',
  icon: 'size-[38px] p-0',
} as const

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  size?: keyof typeof sizeClasses
  variant?: keyof typeof variantClasses
}

export function Button({
  children,
  className,
  size = 'medium',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[3px] border font-bold transition disabled:cursor-not-allowed disabled:opacity-45',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
