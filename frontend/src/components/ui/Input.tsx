import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-[52px] px-4 rounded-lg border text-gray-900 text-base bg-white',
            'transition-all duration-150',
            'placeholder:text-gray-400',
            error
              ? 'border-2 border-danger focus:border-danger'
              : 'border border-gray-200 focus:border-2 focus:border-[var(--color-primary)]',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
        {hint && !error && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
