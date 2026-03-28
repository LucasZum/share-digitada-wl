'use client'
import { useState, useCallback } from 'react'
import { formatBRLInput } from '@/lib/utils/currency'

const MAX_CENTS = 9999900 // R$ 99.999,00

export function useAmountInput() {
  const [cents, setCents] = useState(0)

  const handleDigit = useCallback((digit: string) => {
    setCents((prev) => {
      const next = prev * 10 + parseInt(digit, 10)
      return next > MAX_CENTS ? prev : next
    })
  }, [])

  const handleBackspace = useCallback(() => {
    setCents((prev) => Math.floor(prev / 10))
  }, [])

  const reset = useCallback(() => setCents(0), [])

  return {
    cents,
    display: formatBRLInput(cents),
    handleDigit,
    handleBackspace,
    reset,
    isValid: cents >= 100, // minimum R$ 1,00
  }
}
