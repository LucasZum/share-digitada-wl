'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Lock, Shield, User, CheckCircle2, MapPin } from 'lucide-react'
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
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StepIndicator } from '@/components/pos/StepIndicator'
import { updateTransactionCustomer } from '@/lib/api/transactions'

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

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

interface BillingData {
  name: string
  cpf: string
  email: string
  phone: string
  postal_code: string
  line1: string
  line2: string
  city: string
  state: string
}

const EMPTY_BILLING: BillingData = {
  name: '', cpf: '', email: '', phone: '',
  postal_code: '', line1: '', line2: '', city: '', state: '',
}

function maskCpf(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskCep(v: string) {
  return v.replace(/\D/g, '').slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

function hasBillingData(b: BillingData) {
  return Object.values(b).some(v => v.trim() !== '')
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

  const [showBillingModal, setShowBillingModal] = useState(false)
  const [billingData, setBillingData] = useState<BillingData>(EMPTY_BILLING)
  const [draftBilling, setDraftBilling] = useState<BillingData>(EMPTY_BILLING)

  function openModal() {
    setDraftBilling(billingData)
    setShowBillingModal(true)
  }

  function saveBilling() {
    setBillingData(draftBilling)
    setShowBillingModal(false)
  }

  function set(field: keyof BillingData, value: string) {
    setDraftBilling(prev => ({ ...prev, [field]: value }))
  }

  async function handleCharge() {
    if (!stripe || !elements || !clientSecret) return
    setIsLoading(true)

    const cardNumber = elements.getElement(CardNumberElement)
    if (!cardNumber) {
      setIsLoading(false)
      return
    }

    // Send CPF to backend as PaymentIntent metadata (best-effort)
    const cleanCpf = billingData.cpf.replace(/\D/g, '')
    if (cleanCpf && transactionId) {
      try {
        await updateTransactionCustomer(transactionId, cleanCpf)
      } catch {
        // non-blocking
      }
    }

    // Build billing_details — only include non-empty fields
    const addr: Record<string, string> = { country: 'BR' }
    const cleanCep = billingData.postal_code.replace(/\D/g, '')
    if (cleanCep) addr.postal_code = cleanCep
    if (billingData.line1.trim()) addr.line1 = billingData.line1.trim()
    if (billingData.line2.trim()) addr.line2 = billingData.line2.trim()
    if (billingData.city.trim()) addr.city = billingData.city.trim()
    if (billingData.state) addr.state = billingData.state

    const billingDetails: Record<string, unknown> = { address: addr }
    if (billingData.name.trim()) billingDetails.name = billingData.name.trim()
    if (billingData.email.trim()) billingDetails.email = billingData.email.trim()
    const cleanPhone = billingData.phone.replace(/\D/g, '')
    if (cleanPhone) billingDetails.phone = `+55${cleanPhone}`

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: billingDetails,
      },
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

  const filled = hasBillingData(billingData)

  return (
    <>
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

        {/* Optional billing data button */}
        <button
          type="button"
          onClick={openModal}
          className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed transition-colors duration-150 text-[10px] font-mono uppercase tracking-wider
            ${filled
              ? 'border-green-300 bg-green-50 text-success'
              : 'border-terminalBorder text-terminalLabel hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
            }`}
        >
          {filled
            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Dados do cliente informados</>
            : <><User className="w-3.5 h-3.5" /> + Adicionar dados do cliente (recomendado)</>
          }
        </button>

        <div className="mt-4 space-y-3">
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

      {/* Billing data modal */}
      <Modal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        title="Dados do cliente"
        className="max-h-[90vh] overflow-y-auto"
      >
        <p className="text-xs text-gray-400 -mt-3 mb-5">
          Informações opcionais que aumentam as chances de aprovação pelo banco emissor.
        </p>

        <div className="space-y-5">
          {/* Identificação */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 font-mono">Identificação</p>
            </div>
            <div className="space-y-3">
              <Input
                label="Nome no cartão"
                placeholder="Como impresso no cartão"
                value={draftBilling.name}
                onChange={e => set('name', e.target.value)}
                autoComplete="cc-name"
              />
              <Input
                label="CPF do titular"
                placeholder="000.000.000-00"
                value={draftBilling.cpf}
                onChange={e => set('cpf', maskCpf(e.target.value))}
                inputMode="numeric"
              />
              <Input
                label="E-mail"
                placeholder="email@exemplo.com"
                type="email"
                value={draftBilling.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Telefone / Celular"
                placeholder="(00) 00000-0000"
                value={draftBilling.phone}
                onChange={e => set('phone', maskPhone(e.target.value))}
                inputMode="tel"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 font-mono">Endereço de cobrança</p>
            </div>
            <div className="space-y-3">
              <Input
                label="CEP"
                placeholder="00000-000"
                value={draftBilling.postal_code}
                onChange={e => set('postal_code', maskCep(e.target.value))}
                inputMode="numeric"
              />
              <Input
                label="Logradouro"
                placeholder="Rua, Avenida, etc."
                value={draftBilling.line1}
                onChange={e => set('line1', e.target.value)}
                autoComplete="address-line1"
              />
              <Input
                label="Número / Complemento"
                placeholder="Nº, Apto, Bloco"
                value={draftBilling.line2}
                onChange={e => set('line2', e.target.value)}
                autoComplete="address-line2"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cidade"
                  placeholder="São Paulo"
                  value={draftBilling.city}
                  onChange={e => set('city', e.target.value)}
                  autoComplete="address-level2"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Estado (UF)</label>
                  <select
                    value={draftBilling.state}
                    onChange={e => set('state', e.target.value)}
                    className="h-[52px] px-4 rounded-lg border border-gray-200 text-gray-900 text-base bg-white focus:border-2 focus:border-[var(--color-primary)] transition-all duration-150 outline-none"
                  >
                    <option value="">UF</option>
                    {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button fullWidth size="lg" onClick={saveBilling} className="font-bold">
            Salvar dados
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setShowBillingModal(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </>
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
