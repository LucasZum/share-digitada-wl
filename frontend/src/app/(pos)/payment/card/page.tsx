'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, HelpCircle, Lock, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

import { confirmTransaction } from '@/lib/api/transactions'
import { usePaymentStore } from '@/store/paymentStore'
import { centsToBRL } from '@/lib/utils/currency'
import { luhnCheck } from '@/lib/utils/luhn'
import { detectCardBrand, formatCardNumber, getCVVLength } from '@/lib/utils/cardBrand'
import { Button } from '@/components/ui/Button'
import { StepIndicator } from '@/components/pos/StepIndicator'
import { CardBrandIcon } from '@/components/pos/CardBrandIcon'

export default function CardEntryPage() {
  const router = useRouter()
  const { amountCents, transactionId, setStep, setResult } = usePaymentStore()

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState<{ card?: string; expiry?: string; cvv?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const expiryRef = useRef<HTMLInputElement>(null)
  const cvvRef = useRef<HTMLInputElement>(null)

  const brand = detectCardBrand(cardNumber)
  const cvvLen = getCVVLength(brand)

  if (!transactionId) {
    if (typeof window !== 'undefined') router.replace('/pos')
    return null
  }

  const handleCardNumber = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const maxLen = brand === 'amex' ? 15 : 16
    const trimmed = raw.slice(0, maxLen)
    const formatted = formatCardNumber(trimmed, brand)
    setCardNumber(formatted)
    setErrors((prev) => ({ ...prev, card: undefined }))

    if (trimmed.length >= maxLen) {
      expiryRef.current?.focus()
    }
  }, [brand])

  const handleExpiry = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    let formatted = raw
    if (raw.length >= 2) {
      formatted = raw.slice(0, 2) + '/' + raw.slice(2)
    }
    setExpiry(formatted)
    setErrors((prev) => ({ ...prev, expiry: undefined }))

    if (raw.length === 4) {
      cvvRef.current?.focus()
    }
  }, [])

  function validate(): boolean {
    const errs: typeof errors = {}
    const digits = cardNumber.replace(/\D/g, '')

    if (!luhnCheck(digits)) errs.card = 'Número de cartão inválido.'

    const [mm, yy] = expiry.split('/')
    const month = parseInt(mm || '0', 10)
    const year = parseInt(yy || '0', 10) + 2000
    const now = new Date()
    if (!mm || !yy || month < 1 || month > 12 || year < now.getFullYear() ||
        (year === now.getFullYear() && month < now.getMonth() + 1)) {
      errs.expiry = 'Data de validade inválida.'
    }

    if (cvv.length < cvvLen) errs.cvv = `CVV deve ter ${cvvLen} dígitos.`

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleCharge() {
    if (!validate()) return
    setIsLoading(true)

    const [mm, yy] = expiry.split('/')
    try {
      const result = await confirmTransaction(transactionId!, {
        card_number: cardNumber.replace(/\D/g, ''),
        exp_month: parseInt(mm, 10),
        exp_year: parseInt(yy, 10) + 2000,
        cvc: cvv,
      })
      setResult(result)
      setStep(4)
      router.push('/payment/processing')
    } catch {
      toast.error('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    cardNumber.replace(/\D/g, '').length >= 13 &&
    expiry.length === 5 &&
    cvv.length === cvvLen

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator currentStep={3} />

      {/* Amount + security header */}
      <div className="bg-white rounded-xl border border-terminalBorder px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono text-terminalLabel uppercase tracking-widest">
              VENDA DIGITADA
            </p>
            <p className="font-bold font-mono text-terminalText text-xl">{centsToBRL(amountCents)}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-100">
            <Lock className="w-3.5 h-3.5 text-success" />
            <span className="text-[9px] font-mono text-success font-bold tracking-wider">SEGURO</span>
          </div>
        </div>
      </div>

      {/* Card form */}
      <div className="bg-white rounded-xl border border-terminalBorder p-5">
        <p className="text-[9px] font-mono text-terminalLabel uppercase tracking-widest mb-4 text-center">
          DADOS DO CARTÃO
        </p>

        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="text-[10px] font-semibold text-terminalText block mb-1.5 font-mono uppercase tracking-wider">
              Número do Cartão
            </label>
            <div className="relative">
              <input
                value={cardNumber}
                onChange={handleCardNumber}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                autoComplete="cc-number"
                className={`w-full h-[52px] px-4 pr-16 rounded-lg border text-terminalText text-base bg-surface font-mono tracking-widest transition-colors duration-150
                  ${errors.card
                    ? 'border-2 border-danger bg-red-50'
                    : 'border border-terminalBorder focus:border-2 focus:border-[var(--color-primary)] focus:bg-white'
                  }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CardBrandIcon brand={brand} />
              </div>
            </div>
            {errors.card && <p className="text-xs text-danger mt-1 font-mono">{errors.card}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Expiry */}
            <div>
              <label className="text-[10px] font-semibold text-terminalText block mb-1.5 font-mono uppercase tracking-wider">
                Validade
              </label>
              <input
                ref={expiryRef}
                value={expiry}
                onChange={handleExpiry}
                placeholder="MM/AA"
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
                className={`w-full h-[52px] px-4 rounded-lg border text-terminalText text-base bg-surface font-mono tracking-widest transition-colors duration-150
                  ${errors.expiry
                    ? 'border-2 border-danger bg-red-50'
                    : 'border border-terminalBorder focus:border-2 focus:border-[var(--color-primary)] focus:bg-white'
                  }`}
              />
              {errors.expiry && <p className="text-xs text-danger mt-1 font-mono">{errors.expiry}</p>}
            </div>

            {/* CVV */}
            <div>
              <label className="text-[10px] font-semibold text-terminalText block mb-1.5 font-mono uppercase tracking-wider flex items-center gap-1">
                CVV <HelpCircle className="w-3.5 h-3.5 text-terminalLabel" />
              </label>
              <input
                ref={cvvRef}
                value={cvv}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, cvvLen)
                  setCvv(v)
                  setErrors((prev) => ({ ...prev, cvv: undefined }))
                }}
                type="password"
                placeholder={cvvLen === 4 ? '••••' : '•••'}
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={cvvLen}
                className={`w-full h-[52px] px-4 rounded-lg border text-terminalText text-base bg-surface font-mono transition-colors duration-150
                  ${errors.cvv
                    ? 'border-2 border-danger bg-red-50'
                    : 'border border-terminalBorder focus:border-2 focus:border-[var(--color-primary)] focus:bg-white'
                  }`}
              />
              {errors.cvv && <p className="text-xs text-danger mt-1 font-mono">{errors.cvv}</p>}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button fullWidth size="lg" onClick={handleCharge} disabled={!isFormValid} isLoading={isLoading} className="font-bold tracking-wide rounded-xl">
            Cobrar {centsToBRL(amountCents)}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.back()} className="text-terminalMuted">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </div>
      </div>

      {/* Security footer */}
      <div className="flex items-center justify-center gap-3 py-1">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-terminalLabel" />
          <span className="text-[9px] font-mono text-terminalLabel">PCI DSS</span>
        </div>
        <span className="text-terminalLabel text-[9px]">•</span>
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-terminalLabel" />
          <span className="text-[9px] font-mono text-terminalLabel">SSL/TLS</span>
        </div>
        <span className="text-terminalLabel text-[9px]">•</span>
        <span className="text-[9px] font-mono text-terminalLabel">256-bit</span>
      </div>
    </div>
  )
}
