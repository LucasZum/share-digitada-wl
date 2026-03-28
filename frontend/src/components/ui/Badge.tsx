import { cn } from '@/lib/utils/cn'
import type { TransactionStatus } from '@/types/transaction'

const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processando', className: 'bg-blue-100 text-blue-800' },
  succeeded: { label: 'Aprovado', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Recusado', className: 'bg-red-100 text-red-700' },
  canceled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
}

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      {
        'bg-gray-100 text-gray-700': variant === 'default',
        'bg-green-100 text-green-700': variant === 'success',
        'bg-red-100 text-red-700': variant === 'danger',
        'bg-yellow-100 text-yellow-800': variant === 'warning',
        'bg-blue-100 text-blue-800': variant === 'info',
      },
      className
    )}>
      {children}
    </span>
  )
}
