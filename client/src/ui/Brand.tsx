import { cn } from './cn'

type BrandMarkProps = {
  className?: string
  size?: 'large' | 'small'
}

export function BrandMark({ className, size = 'small' }: BrandMarkProps) {
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center bg-lime text-[0.85rem] font-black tracking-[-0.04em] text-brand',
        size === 'large'
          ? 'size-12 rounded-[14px_4px_14px_4px]'
          : 'size-10 rounded-[11px_3px_11px_3px]',
        className,
      )}
      aria-hidden="true"
    >
      JT
    </div>
  )
}
