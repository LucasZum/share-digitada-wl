'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Lock, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

import { usePaymentStore } from '@/store/paymentStore'
import { centsToBRL } from '@/lib/utils/currency'
import { Button } from '@/components/ui/Button'
import { StepIndicator } from '@/components/pos/StepIndicator'

const ELEMENT_STYLE = {
  style: {
    base: {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '16px',
      color: '#111827',
      letterSpacing: '0.05em',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
}

function CardForm({ amountCents }: { amountCents: number }) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { transactionId, clientSecret, setResult, setStep } = usePaymentStore()
  const [isLoading, setIsLoading] = useState(false)
  const [cardError, setCardError] = useState<string | undefined>()
  const [expiryError, setExpiryError] = useState<string | undefined>()
  const [cvcError, setCvcError] = useState<string | undefined>()

  async function handleCharge() {
    if (!stripe || !elements || !clientSecret) return
    setIsLoading(true)

    const cardNumber = elements.getElement(CardNumberElement)
    if (!cardNumber) {
      setIsLoading(false)
      return
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardNumber },
    })

    if (error) {
      toast.error(error.message ?? 'Pagamento recusado. Verifique os dados e tente novamente.')
      setIsLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      setResult({ id: transactionId! } as never)
      setStep(4)
      router.push('/payment/processing')
    } else {
      toast.error('Pagamento não foi aprovado. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
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
          <div
            className={`w-full h-[52px] px-4 rounded-lg border flex items-center bg-surface transition-colors duration-150
              ${cardError ? 'border-2 border-danger bg-red-50' : 'border border-terminalBorder'}`}
          >
            <CardNumberElement
              className="w-full"
              options={ELEMENT_STYLE}
              onChange={(e) => setCardError(e.error?.message)}
            />
          </div>
          {cardError && <p className="text-xs text-danger mt-1 font-mono">{cardError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Expiry */}
          <div>
            <label className="text-[10px] font-semibold text-terminalText block mb-1.5 font-mono uppercase tracking-wider">
              Validade
            </label>
            <div
              className={`w-full h-[52px] px-4 rounded-lg border flex items-center bg-surface transition-colors duration-150
                ${expiryError ? 'border-2 border-danger bg-red-50' : 'border border-terminalBorder'}`}
            >
              <CardExpiryElement
                className="w-full"
                options={ELEMENT_STYLE}
                onChange={(e) => setExpiryError(e.error?.message)}
              />
            </div>
            {expiryError && <p className="text-xs text-danger mt-1 font-mono">{expiryError}</p>}
          </div>

          {/* CVC */}
          <div>
            <label className="text-[10px] font-semibold text-terminalText block mb-1.5 font-mono uppercase tracking-wider">
              CVV
            </label>
            <div
              className={`w-full h-[52px] px-4 rounded-lg border flex items-center bg-surface transition-colors duration-150
                ${cvcError ? 'border-2 border-danger bg-red-50' : 'border border-terminalBorder'}`}
            >
              <CardCvcElement
                className="w-full"
                options={ELEMENT_STYLE}
                onChange={(e) => setCvcError(e.error?.message)}
              />
            </div>
            {cvcError && <p className="text-xs text-danger mt-1 font-mono">{cvcError}</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          fullWidth
          size="lg"
          onClick={handleCharge}
          disabled={!stripe || !elements}
          isLoading={isLoading}
          className="font-bold tracking-wide rounded-xl"
        >
          Cobrar {centsToBRL(amountCents)}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => router.back()} className="text-terminalMuted">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>
    </div>
  )
}

export default function CardEntryPage() {
  const router = useRouter()
  const { amountCents, transactionId, publishableKey, clientSecret } = usePaymentStore()

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  )

  if (!transactionId || !clientSecret || !publishableKey) {
    if (typeof window !== 'undefined') router.replace('/pos')
    return null
  }

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

      {/* Stripe Elements card form */}
      <Elements stripe={stripePromise} options={{ clientSecret, locale: 'pt-BR' }}>
        <CardForm amountCents={amountCents} />
      </Elements>

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
