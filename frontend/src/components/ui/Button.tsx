import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 select-none',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-[0.98]': variant === 'primary',
          'border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)] hover:text-white': variant === 'secondary',
          'text-gray-500 bg-transparent hover:text-gray-700': variant === 'ghost',
          'bg-danger text-white hover:opacity-90': variant === 'danger',
          'h-13 px-6 text-base': size === 'lg',
          'h-12 px-5 text-sm': size === 'md',
          'h-9 px-4 text-sm': size === 'sm',
          'w-full': fullWidth,
        },
        className
      )}
      style={{ height: size === 'lg' ? '52px' : size === 'md' ? '48px' : '36px' }}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
