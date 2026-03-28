'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { usePollTransaction } from '@/hooks/usePollTransaction'
import { usePaymentStore } from '@/store/paymentStore'
import { centsToBRL } from '@/lib/utils/currency'
import { StepIndicator } from '@/components/pos/StepIndicator'

const MESSAGES = [
  'PROCESSANDO...',
  'VERIFICANDO DADOS...',
  'AGUARDANDO BANCO...',
  'NÃO REMOVA O CARTÃO...',
]

export default function ProcessingPage() {
  const router = useRouter()
  const { transactionId, amountCents, setResult } = usePaymentStore()
  const { transaction, isTimeout } = usePollTransaction(transactionId)
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!transaction) return
    if (transaction.status === 'succeeded' || transaction.status === 'failed') {
      setResult(transaction)
      router.replace('/payment/result')
    }
  }, [transaction, router, setResult])

  useEffect(() => {
    if (isTimeout) {
      router.replace('/payment/result')
    }
  }, [isTimeout, router])

  if (!transactionId) {
    if (typeof window !== 'undefined') router.replace('/pos')
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator currentStep={4} />

      <div className="bg-white rounded-xl border border-terminalBorder px-4 py-10 flex flex-col items-center gap-6 text-center">

        {/* Dual counter-rotating spinner */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
          <div
            className="absolute inset-0 rounded-full border-4 border-t-[var(--color-primary)] border-r-transparent border-b-transparent border-l-transparent animate-spin"
            style={{ animationDuration: '1.2s' }}
          />
          <div
            className="absolute rounded-full border-2 border-gray-100"
            style={{ inset: '12px' }}
          />
          <div
            className="absolute rounded-full border-2 border-t-[var(--color-primary)]/60 border-r-transparent border-b-transparent border-l-transparent animate-spin"
            style={{ inset: '12px', animationDuration: '0.8s', animationDirection: 'reverse' }}
          />
          <div className="w-4 h-4 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
          </div>
        </div>

        {/* Rotating message */}
        <div>
          <p
            className="font-mono font-bold text-terminalText text-base tracking-widest uppercase animate-fade-in"
            key={msgIndex}
          >
            {MESSAGES[msgIndex]}
          </p>
          <p className="font-bold font-mono text-[var(--color-primary)] mt-2 text-2xl">
            {centsToBRL(amountCents)}
          </p>
        </div>

        {/* Warning */}
        <div className="w-full p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
          <span className="text-amber-500 text-base flex-shrink-0">⚠</span>
          <div className="text-left">
            <p className="text-xs font-bold text-amber-700 font-mono">NÃO REMOVA O CARTÃO</p>
            <p className="text-[10px] text-amber-600 font-mono mt-0.5">Aguarde a confirmação do banco</p>
          </div>
        </div>

        {/* Fake reference */}
        <p className="text-[9px] font-mono text-terminalLabel tracking-wider">
          REF: {transactionId?.slice(0, 8).toUpperCase() || 'XXXXXXXX'}
        </p>
      </div>
    </div>
  )
}
