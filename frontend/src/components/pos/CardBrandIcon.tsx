import { CreditCard } from 'lucide-react'
import type { CardBrand } from '@/lib/utils/cardBrand'

interface CardBrandIconProps {
  brand: CardBrand
  className?: string
}

const brandColors: Record<CardBrand, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#016FD0',
  elo: '#00B0CA',
  unknown: '#9CA3AF',
}

const brandLabels: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  elo: 'ELO',
  unknown: '',
}

export function CardBrandIcon({ brand, className }: CardBrandIconProps) {
  if (brand === 'unknown') {
    return <CreditCard className={className || 'w-6 h-6 text-gray-300'} />
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded font-bold text-white px-1.5 py-0.5 text-[10px] tracking-widest"
      style={{ backgroundColor: brandColors[brand], minWidth: '36px' }}
    >
      {brandLabels[brand]}
    </span>
  )
}
