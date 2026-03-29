'use client'
import { useRouter } from 'next/navigation'
import { Delete, ChevronRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAmountInput } from '@/hooks/useAmountInput'
import { usePaymentStore } from '@/store/paymentStore'
import { useAuthStore } from '@/store/authStore'
import { createTransaction } from '@/lib/api/transactions'
import { useState } from 'react'
import toast from 'react-hot-toast'

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export default function POSPage() {
  const router = useRouter()
  const { setAmount, setTransactionId, setClientSecret, setPublishableKey, setStep } = usePaymentStore()
  const { user } = useAuthStore()
  const { cents, display, handleDigit, handleBackspace, isValid } = useAmountInput()
  const [isLoading, setIsLoading] = useState(false)

  async function handleContinue() {
    if (!isValid) return
    setIsLoading(true)

    try {
      const tx = await createTransaction(cents)
      setAmount(cents)
      setTransactionId(tx.id)
      setClientSecret(tx.client_secret)
      setPublishableKey(tx.publishable_key)
      setStep(2)
      router.push('/payment/method')
    } catch {
      toast.error('Erro ao iniciar transação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Terminal info strip */}
      <div className="bg-white rounded-xl border border-terminalBorder px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono text-terminalLabel uppercase tracking-widest">Operador</p>
            <p className="font-semibold text-terminalText text-sm">{user?.full_name}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-[9px] font-mono text-terminalLabel uppercase tracking-widest">Terminal</p>
              <p className="font-mono text-[11px] text-terminalMuted">TID-00482913</p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="p-1.5 rounded-lg text-terminalMuted hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 uppercase tracking-widest font-semibold">
            VENDA DIGITADA REMOTA
          </span>
        </div>
      </div>

      {/* Amount display */}
      <div className="bg-white rounded-xl border border-terminalBorder px-4 py-5">
        <p className="text-[10px] font-mono text-terminalLabel uppercase tracking-widest mb-3 text-center">
          VALOR DA COBRANÇA
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-2xl font-semibold text-terminalMuted font-mono">R$</span>
          <span
            className="amount-display font-mono font-bold text-terminalText"
            style={{ fontSize: '3rem', lineHeight: 1 }}
          >
            {display}
          </span>
        </div>
        {cents === 0 && (
          <p className="text-center text-[11px] text-terminalLabel font-mono mt-2 animate-pulse">
            Digite o valor acima
          </p>
        )}
      </div>

      {/* Keypad */}
      <div className="bg-white rounded-xl border border-terminalBorder p-4">
        <div className="grid grid-cols-3 gap-2">
          {DIGITS.map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-14 rounded-xl text-xl font-bold text-terminalText bg-surface hover:bg-gray-100 active:bg-gray-200 border border-terminalBorder active:scale-95 transition-all duration-75 select-none shadow-sm"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="h-14 rounded-xl text-terminalMuted bg-surface hover:bg-gray-100 active:bg-gray-200 border border-terminalBorder active:scale-95 transition-all duration-75 flex items-center justify-center col-start-3 shadow-sm"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Continue button */}
      <Button
        fullWidth
        size="lg"
        onClick={handleContinue}
        disabled={!isValid}
        isLoading={isLoading}
        className="rounded-xl font-bold tracking-wide"
      >
        Continuar <ChevronRight className="w-5 h-5" />
      </Button>

      <p className="text-center text-[9px] font-mono text-terminalLabel tracking-wider">
        Conexão criptografada • PCI DSS • SSL/TLS
      </p>

    </div>
  )
}
