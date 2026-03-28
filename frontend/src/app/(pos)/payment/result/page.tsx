'use client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Copy, RefreshCw, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

import { usePaymentStore } from '@/store/paymentStore'
import { useCountdown } from '@/hooks/useCountdown'
import { centsToBRL } from '@/lib/utils/currency'
import { Button } from '@/components/ui/Button'
import { StepIndicator } from '@/components/pos/StepIndicator'
import { CardBrandIcon } from '@/components/pos/CardBrandIcon'
import { detectCardBrand } from '@/lib/utils/cardBrand'

export default function ResultPage() {
  const router = useRouter()
  const { result, amountCents, reset } = usePaymentStore()

  const isSuccess = result?.status === 'succeeded'

  const { remaining } = useCountdown(60, () => {
    if (isSuccess) {
      reset()
      router.replace('/pos')
    }
  })

  if (!result) {
    if (typeof window !== 'undefined') router.replace('/pos')
    return null
  }

  function handleNewSale() {
    reset()
    router.replace('/pos')
  }

  function handleRetry() {
    router.replace('/payment/method')
  }

  function copyTxId() {
    navigator.clipboard.writeText(result!.id)
    toast.success('ID copiado!')
  }

  const brandDetected = result.card_brand
    ? detectCardBrand(result.card_brand.toLowerCase())
    : 'unknown'

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator currentStep={4} />

      {isSuccess ? (
        /* ── APPROVED ── */
        <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
          {/* Green shimmer header */}
          <div className="approved-shimmer px-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={2} />
            </div>
            <p className="text-white font-mono font-bold text-xl tracking-widest">APROVADO</p>
            <p className="text-white/80 font-mono text-[10px] tracking-widest mt-1">TRANSAÇÃO AUTORIZADA</p>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <p className="font-bold font-mono text-terminalText text-3xl text-center mb-5">
              {centsToBRL(amountCents)}
            </p>

            {result.card_last4 && (
              <div className="flex items-center justify-between py-3 border-b border-terminalBorder">
                <span className="text-[10px] font-mono text-terminalLabel uppercase tracking-wider">Cartão</span>
                <div className="flex items-center gap-2">
                  <CardBrandIcon brand={brandDetected} />
                  <span className="text-sm text-terminalText font-mono">•••• {result.card_last4}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between py-3 border-b border-terminalBorder">
              <span className="text-[10px] font-mono text-terminalLabel uppercase tracking-wider">NSU / ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-terminalText">{result.id.slice(0, 8).toUpperCase()}</span>
                <button onClick={copyTxId} className="text-terminalMuted hover:text-success transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Countdown bar */}
            <div className="mt-5">
              <div className="relative h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-success transition-all duration-1000 rounded-full"
                  style={{ width: `${((60 - remaining) / 60) * 100}%` }}
                />
              </div>
              <p className="text-center text-[10px] font-mono text-terminalLabel">
                Nova venda automática em {remaining}s
              </p>
            </div>

            <Button fullWidth onClick={handleNewSale} size="lg" className="mt-4 font-bold tracking-wide rounded-xl">
              <Plus className="w-4 h-4" /> Nova Venda
            </Button>
          </div>
        </div>
      ) : (
        /* ── DECLINED ── */
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          {/* Red header */}
          <div className="bg-danger px-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-9 h-9 text-white" strokeWidth={2} />
            </div>
            <p className="text-white font-mono font-bold text-xl tracking-widest">RECUSADO</p>
            <p className="text-white/80 font-mono text-[10px] tracking-widest mt-1">TRANSAÇÃO NÃO AUTORIZADA</p>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <p className="font-bold font-mono text-terminalText text-3xl text-center mb-4">
              {centsToBRL(amountCents)}
            </p>

            {result.error_message && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
                <p className="text-sm text-danger font-mono text-center">{result.error_message}</p>
              </div>
            )}

            <div className="flex items-center justify-between py-3 border-b border-terminalBorder mb-4">
              <span className="text-[10px] font-mono text-terminalLabel uppercase tracking-wider">NSU / ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-terminalText">{result.id.slice(0, 8).toUpperCase()}</span>
                <button onClick={copyTxId} className="text-terminalMuted hover:text-danger transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Button fullWidth variant="secondary" onClick={handleRetry} size="lg" className="font-bold tracking-wide rounded-xl">
                <RefreshCw className="w-4 h-4" /> Tentar Novamente
              </Button>
              <Button fullWidth variant="ghost" onClick={handleNewSale} className="text-terminalMuted">
                Nova Venda
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
