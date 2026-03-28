'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Wifi, Shield } from 'lucide-react'
import { usePaymentStore } from '@/store/paymentStore'
import { centsToBRL } from '@/lib/utils/currency'

const TERMINAL_MESSAGES = [
  'AGUARDANDO CARTÃO...',
  'INSIRA OU APROXIME',
  'NFC ATIVO',
  'PRONTO PARA PAGAR',
]

export default function PaymentMethodPage() {
  const router = useRouter()
  const { amountCents, setStep } = usePaymentStore()
  const [msgIndex, setMsgIndex] = useState(0)

  if (!amountCents) {
    if (typeof window !== 'undefined') router.replace('/pos')
    return null
  }

  function handleDigitada() {
    setStep(3)
    router.push('/payment/card')
  }

  useEffect(() => {
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % TERMINAL_MESSAGES.length), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 'calc(100vh - 180px)' }}>

      {/* Amount display */}
      <div className="bg-white rounded-xl border border-terminalBorder px-4 py-4">
        <p className="text-[9px] font-mono text-terminalLabel uppercase tracking-widest text-center mb-1">
          VALOR A PAGAR
        </p>
        <p
          className="font-bold font-mono text-terminalText text-center"
          style={{ fontSize: '2.4rem', lineHeight: 1 }}
        >
          {centsToBRL(amountCents)}
        </p>
      </div>

      {/* NFC hero */}
      <div className="flex-1 bg-white rounded-xl border border-terminalBorder flex flex-col items-center justify-center py-10 relative overflow-hidden">

        {/* Scanline texture */}
        <div className="absolute inset-0 terminal-screen pointer-events-none" />

        {/* NFC animation */}
        <div className="relative flex items-center justify-center mb-8" style={{ width: 130, height: 130 }}>
          {/* Outer pulse rings */}
          <div className="absolute inset-0 rounded-full border-2 border-nfcRing/50 animate-nfc-ring-1" />
          <div className="absolute inset-0 rounded-full border-2 border-nfcRing/30 animate-nfc-ring-2" />
          {/* Mid ring */}
          <div
            className="absolute rounded-full border border-[var(--color-primary)]/20"
            style={{ inset: '16px' }}
          />
          {/* Core circle */}
          <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 border-2 border-[var(--color-primary)]/30 flex items-center justify-center animate-nfc-pulse">
            <CreditCard className="w-9 h-9 text-[var(--color-primary)]" strokeWidth={1.5} />
          </div>
          {/* NFC waves icon */}
          <div className="absolute top-2 right-2">
            <Wifi
              className="w-5 h-5 text-nfcBlue/70 animate-pulse"
              style={{ transform: 'rotate(45deg)' }}
            />
          </div>
        </div>

        {/* Rotating message */}
        <div className="text-center px-6">
          <p
            className="font-mono font-bold text-terminalText text-lg tracking-widest uppercase animate-fade-in"
            key={msgIndex}
          >
            {TERMINAL_MESSAGES[msgIndex]}
          </p>
          <p className="text-[11px] font-mono text-terminalLabel mt-2 tracking-wide">
            Aproxime, insira ou passe o cartão no terminal
          </p>
        </div>

        {/* Scanning bar */}
        <div className="mt-6 w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full w-1/3"
            style={{ animation: 'scanning 2s ease-in-out infinite alternate' }}
          />
        </div>

        {/* Security badge */}
        <div className="mt-5 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-success" />
          <span className="text-[9px] font-mono text-terminalLabel tracking-wider">
            CONEXÃO SEGURA • PCI DSS
          </span>
        </div>
      </div>

      {/* Fallback to manual entry */}
      <div className="text-center py-2">
        <button
          onClick={handleDigitada}
          className="text-[11px] text-terminalMuted underline underline-offset-2 hover:text-[var(--color-primary)] transition-colors font-mono"
        >
          Digitar dados do cartão manualmente
        </button>
      </div>

    </div>
  )
}
