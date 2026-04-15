'use client'
import { useMemo, useState, useEffect } from 'react'
import { Lock, Shield, User, CheckCircle2, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js/pure'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

import { getPublicLink, confirmPayment, type PublicLinkInfo } from '@/lib/api/paymentLinks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'

const ELEMENT_STYLE = {
  style: {
    base: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontSize: '16px',
      color: '#111827',
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
  email: string
  phone: string
  postal_code: string
  line1: string
  line2: string
  city: string
  state: string
}

const EMPTY_BILLING: BillingData = {
  name: '', email: '', phone: '',
  postal_code: '', line1: '', line2: '', city: '', state: '',
}

function maskCep(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function hasBillingData(b: BillingData): boolean {
  return Object.values(b).some((v) => v.trim() !== '')
}

// ─── Success Screen ──────────────────────────────────────────────────────────
function SuccessScreen({ link, cardLast4, cardBrand }: { link: PublicLinkInfo; cardLast4?: string; cardBrand?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-4">
      <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pagamento Aprovado!</h2>
        <p className="text-sm text-gray-500 mt-1">{link.title}</p>
      </div>
      <div className="bg-gray-50 rounded-xl px-6 py-4 w-full">
        <p className="text-2xl font-bold text-[var(--color-primary)]">{formatBRL(link.amount)}</p>
        {cardLast4 && (
          <p className="text-sm text-gray-500 mt-1">
            {cardBrand && `${cardBrand} `}•••• {cardLast4}
          </p>
        )}
      </div>
      <p className="text-xs text-gray-400">Você receberá uma confirmação em breve.</p>
    </div>
  )
}

// ─── Status Screens ──────────────────────────────────────────────────────────
function StatusScreen({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
    </div>
  )
}

// ─── Card Form ───────────────────────────────────────────────────────────────
function CardForm({ link, slug, onSuccess }: { link: PublicLinkInfo; slug: string; onSuccess: (last4: string, brand: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
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
    setDraftBilling((prev) => ({ ...prev, [field]: value }))
  }

  async function handlePay() {
    if (!stripe || !elements) return
    setIsLoading(true)

    const cardNumber = elements.getElement(CardNumberElement)
    if (!cardNumber) { setIsLoading(false); return }

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

    const { error, paymentIntent } = await stripe.confirmCardPayment(link.client_secret, {
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

    if (paymentIntent?.status === 'succeeded') {
      try {
        await confirmPayment(slug, paymentIntent.id)
      } catch {
        // Best-effort — payment already succeeded on Stripe side
      }

      const pm = paymentIntent.payment_method
      const last4 = (typeof pm === 'object' && pm && 'card' in pm) ? (pm as { card?: { last4?: string } }).card?.last4 ?? '' : ''
      const brand = (typeof pm === 'object' && pm && 'card' in pm) ? (pm as { card?: { brand?: string } }).card?.brand ?? '' : ''
      onSuccess(last4, brand)
    } else {
      toast.error('Pagamento não foi aprovado. Tente novamente.')
      setIsLoading(false)
    }
  }

  const filled = hasBillingData(billingData)

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Dados do cartão</h3>

        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Número do cartão
            </label>
            <div className={`w-full h-[52px] px-4 rounded-xl border flex items-center bg-white transition-colors ${
              cardError ? 'border-2 border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-[var(--color-primary)]'
            }`}>
              <CardNumberElement className="w-full" options={ELEMENT_STYLE} onChange={(e) => setCardError(e.error?.message)} />
            </div>
            {cardError && <p className="text-xs text-red-500 mt-1">{cardError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Expiry */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Validade
              </label>
              <div className={`w-full h-[52px] px-4 rounded-xl border flex items-center bg-white transition-colors ${
                expiryError ? 'border-2 border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-[var(--color-primary)]'
              }`}>
                <CardExpiryElement className="w-full" options={ELEMENT_STYLE} onChange={(e) => setExpiryError(e.error?.message)} />
              </div>
              {expiryError && <p className="text-xs text-red-500 mt-1">{expiryError}</p>}
            </div>

            {/* CVC */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                CVV
              </label>
              <div className={`w-full h-[52px] px-4 rounded-xl border flex items-center bg-white transition-colors ${
                cvcError ? 'border-2 border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-[var(--color-primary)]'
              }`}>
                <CardCvcElement className="w-full" options={ELEMENT_STYLE} onChange={(e) => setCvcError(e.error?.message)} />
              </div>
              {cvcError && <p className="text-xs text-red-500 mt-1">{cvcError}</p>}
            </div>
          </div>
        </div>

        {/* Optional billing data button */}
        <button
          type="button"
          onClick={openModal}
          className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors text-sm ${
            filled
              ? 'border-green-200 bg-green-50 text-green-700 font-medium'
              : 'border-gray-200 text-gray-500 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'
          }`}
        >
          {filled
            ? <><CheckCircle2 className="w-4 h-4" /> Dados do titular informados</>
            : <><User className="w-4 h-4" /> Adicionar dados do titular (opcional)</>
          }
        </button>

        <div className="mt-4">
          <Button
            fullWidth
            size="lg"
            onClick={handlePay}
            disabled={!stripe || !elements}
            isLoading={isLoading}
            className="font-semibold rounded-xl"
          >
            Pagar {formatBRL(link.amount)}
          </Button>
        </div>
      </div>

      {/* Billing data modal */}
      <Modal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        title="Dados do titular"
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
              <p className="text-xs font-semibold text-gray-500">Identificação</p>
            </div>
            <div className="space-y-3">
              <Input
                label="Nome no cartão"
                placeholder="Como impresso no cartão"
                value={draftBilling.name}
                onChange={(e) => set('name', e.target.value)}
                autoComplete="cc-name"
              />
              <Input
                label="E-mail"
                placeholder="email@exemplo.com"
                type="email"
                value={draftBilling.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Telefone / Celular"
                placeholder="(00) 00000-0000"
                value={draftBilling.phone}
                onChange={(e) => set('phone', maskPhone(e.target.value))}
                inputMode="tel"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500">Endereço de cobrança</p>
            </div>
            <div className="space-y-3">
              <Input
                label="CEP"
                placeholder="00000-000"
                value={draftBilling.postal_code}
                onChange={(e) => set('postal_code', maskCep(e.target.value))}
                inputMode="numeric"
              />
              <Input
                label="Logradouro"
                placeholder="Rua, Avenida, etc."
                value={draftBilling.line1}
                onChange={(e) => set('line1', e.target.value)}
                autoComplete="address-line1"
              />
              <Input
                label="Número / Complemento"
                placeholder="Nº, Apto, Bloco"
                value={draftBilling.line2}
                onChange={(e) => set('line2', e.target.value)}
                autoComplete="address-line2"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cidade"
                  placeholder="São Paulo"
                  value={draftBilling.city}
                  onChange={(e) => set('city', e.target.value)}
                  autoComplete="address-level2"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Estado (UF)</label>
                  <select
                    value={draftBilling.state}
                    onChange={(e) => set('state', e.target.value)}
                    className="h-[52px] px-4 rounded-lg border border-gray-200 text-gray-900 text-base bg-white focus:border-2 focus:border-[var(--color-primary)] outline-none"
                  >
                    <option value="">UF</option>
                    {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button fullWidth size="lg" onClick={saveBilling} className="font-bold">Salvar dados</Button>
          <Button variant="ghost" fullWidth onClick={() => setShowBillingModal(false)}>Cancelar</Button>
        </div>
      </Modal>
    </>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PayPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const [state, setState] = useState<'loading' | 'ready' | 'inactive' | 'paid' | 'not_found' | 'error' | 'success'>('loading')
  const [linkInfo, setLinkInfo] = useState<PublicLinkInfo | null>(null)
  const [successCard, setSuccessCard] = useState<{ last4: string; brand: string } | null>(null)

  useEffect(() => {
    getPublicLink(slug)
      .then((data) => {
        setLinkInfo(data)
        setState('ready')
      })
      .catch((err: { response?: { data?: { status?: string }; status?: number } }) => {
        const detail = err.response?.data?.status
        const httpStatus = err.response?.status
        if (httpStatus === 410) {
          if (detail === 'paid') setState('paid')
          else setState('inactive')
        } else if (httpStatus === 404) {
          setState('not_found')
        } else {
          setState('error')
        }
      })
  }, [slug])

  const stripePromise = useMemo(
    () => (linkInfo?.publishable_key ? loadStripe(linkInfo.publishable_key) : null),
    [linkInfo?.publishable_key],
  )

  function handleSuccess(last4: string, brand: string) {
    setSuccessCard({ last4, brand })
    setState('success')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between max-w-[480px] mx-auto w-full">
        <img src="/visanet-logo.png" alt="VisaNet" className="h-8 w-auto" />
        <div className="flex items-center gap-1.5 text-green-600">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Pagamento seguro</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-[480px] mx-auto w-full px-4 py-6 gap-4">

        {state === 'loading' && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        )}

        {state === 'not_found' && (
          <StatusScreen
            icon={<XCircle className="w-8 h-8 text-gray-400" />}
            title="Link não encontrado"
            message="Este link de pagamento não existe ou foi removido."
          />
        )}

        {state === 'inactive' && (
          <StatusScreen
            icon={<AlertCircle className="w-8 h-8 text-orange-400" />}
            title="Link inativo"
            message="Este link de pagamento foi desativado pelo emissor."
          />
        )}

        {state === 'paid' && (
          <StatusScreen
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
            title="Já foi pago"
            message="Este link de pagamento já foi utilizado."
          />
        )}

        {state === 'error' && (
          <StatusScreen
            icon={<XCircle className="w-8 h-8 text-red-400" />}
            title="Erro ao carregar"
            message="Não foi possível carregar este link. Tente novamente mais tarde."
          />
        )}

        {state === 'success' && linkInfo && (
          <SuccessScreen
            link={linkInfo}
            cardLast4={successCard?.last4}
            cardBrand={successCard?.brand}
          />
        )}

        {state === 'ready' && linkInfo && (
          <>
            {/* Charge info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Valor a pagar</p>
                  <p className="text-3xl font-bold text-gray-900">{formatBRL(linkInfo.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Descrição</p>
                  <p className="text-sm font-medium text-gray-700 max-w-[180px] text-right">{linkInfo.title}</p>
                </div>
              </div>
            </div>

            {/* Card form */}
            {stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret: linkInfo.client_secret, locale: 'pt-BR' }}>
                <CardForm link={linkInfo} slug={slug} onSuccess={handleSuccess} />
              </Elements>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-[480px] mx-auto w-full px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span className="text-[10px]">PCI DSS</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span className="text-[10px]">SSL 256-bit</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-[10px]">Powered by Stripe</span>
        </div>
      </footer>
    </div>
  )
}
