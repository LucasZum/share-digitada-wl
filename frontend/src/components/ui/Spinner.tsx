import { cn } from '@/lib/utils/cn'

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <div
      className={cn(
        'inline-block rounded-full border-2 border-gray-200 animate-spin',
        'border-t-[var(--color-primary)]',
        {
          'w-5 h-5': size === 'sm',
          'w-8 h-8 border-[3px]': size === 'md',
          'w-12 h-12 border-4': size === 'lg',
        },
        className
      )}
    />
  )
}
