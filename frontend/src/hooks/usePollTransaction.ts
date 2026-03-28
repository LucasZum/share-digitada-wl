'use client'
import { useEffect, useRef, useState } from 'react'
import { getTransactionStatus } from '@/lib/api/transactions'
import type { Transaction } from '@/types/transaction'

const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 30000
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled'])

export function usePollTransaction(transactionId: string | null) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isTimeout, setIsTimeout] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!transactionId) return

    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTimeRef.current

      if (elapsed >= POLL_TIMEOUT_MS) {
        clearInterval(intervalRef.current!)
        setIsTimeout(true)
        return
      }

      try {
        const tx = await getTransactionStatus(transactionId)
        setTransaction(tx)

        if (TERMINAL_STATUSES.has(tx.status)) {
          clearInterval(intervalRef.current!)
        }
      } catch {
        // Keep polling on network error
      }
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [transactionId])

  return { transaction, isTimeout }
}
