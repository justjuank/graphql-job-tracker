import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'

import { cn } from './cn'

type FormFieldProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode
  label: string
  labelStyle?: 'compact' | 'standard'
  tone?: 'light' | 'dark'
}

export function FormField({
  children,
  className,
  label,
  labelStyle = 'compact',
  tone = 'light',
  ...props
}: FormFieldProps) {
  return (
    <label
      className={cn(
        'grid gap-2',
        labelStyle === 'compact'
          ? 'text-[0.69rem] font-extrabold tracking-[0.07em] uppercase'
          : 'text-[0.8rem] font-bold',
        tone === 'dark' ? 'text-[#edf4ee]/65' : 'text-muted',
        className,
      )}
      {...props}
    >
      <span>{label}</span>
      {children}
    </label>
  )
}

const controlClass =
  'h-11 w-full rounded-[3px] border border-[#cbd0ca] bg-white px-3 text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/10'

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />
}

export function Select({
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, className)} {...props}>
      {children}
    </select>
  )
}
