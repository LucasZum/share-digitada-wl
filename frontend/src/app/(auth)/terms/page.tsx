'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollText } from 'lucide-react'
import toast from 'react-hot-toast'

import { acceptTerms } from '@/lib/api/auth'
import { listStripeAccounts } from '@/lib/api/stripe'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

// ─── Termos de Uso ─────────────────────────────────────────────────────────────
// Edite o conteúdo abaixo para definir os termos da plataforma.
const TERMS_CONTENT = `TERMOS DE USO DA PLATAFORMA

Última atualização: a definir

1. ACEITAÇÃO DOS TERMOS
Ao utilizar esta plataforma, você concorda com os presentes Termos de Uso. Caso não concorde com qualquer disposição, não utilize o serviço.

2. USO DA PLATAFORMA
A plataforma destina-se exclusivamente ao processamento de pagamentos por meio de contas Stripe devidamente credenciadas. O uso para fins ilícitos ou não autorizados é estritamente proibido.

3. RESPONSABILIDADES DO USUÁRIO
O usuário é responsável por manter a confidencialidade de suas credenciais de acesso. Qualquer atividade realizada com sua conta é de sua responsabilidade. Em caso de suspeita de uso não autorizado, notifique o administrador imediatamente.

4. CREDENCIAIS STRIPE
As chaves da API Stripe fornecidas são de responsabilidade exclusiva do usuário. A plataforma armazena as credenciais de forma criptografada, mas não se responsabiliza por uso indevido decorrente de exposição das chaves pelo próprio usuário.

5. PRIVACIDADE E DADOS
Os dados coletados durante o uso da plataforma são utilizados exclusivamente para fins operacionais e de auditoria interna. Não compartilhamos suas informações com terceiros sem consentimento, exceto quando exigido por lei.

6. DISPONIBILIDADE DO SERVIÇO
A plataforma é fornecida "como está". Não garantimos disponibilidade ininterrupta e nos reservamos o direito de realizar manutenções programadas.

7. LIMITAÇÃO DE RESPONSABILIDADE
A plataforma não se responsabiliza por perdas financeiras decorrentes de falhas de conectividade, erros de operação do usuário ou indisponibilidade dos serviços da Stripe.

8. ALTERAÇÕES NOS TERMOS
Podemos atualizar estes termos periodicamente. Alterações relevantes serão comunicadas e poderão exigir nova aceitação.

9. ENCERRAMENTO DE CONTA
O administrador pode suspender ou encerrar sua conta a qualquer momento, mediante notificação, em caso de violação destes termos.

10. DISPOSIÇÕES GERAIS
Estes termos são regidos pelas leis brasileiras. Quaisquer disputas serão resolvidas no foro da comarca do administrador da plataforma.

Ao marcar a caixa de aceite, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso.`

export default function TermsPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { config } = useThemeStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32
    if (atBottom) setScrolledToBottom(true)
  }

  useEffect(() => {
    // If content fits without scrolling, allow accepting immediately
    const el = scrollRef.current
    if (el && el.scrollHeight <= el.clientHeight) {
      setScrolledToBottom(true)
    }
  }, [])

  async function handleAccept() {
    if (!accepted) return
    setIsLoading(true)
    try {
      await acceptTerms()

      const updatedUser = { ...user!, terms_accepted: true }
      setUser(updatedUser)

      try {
        const accounts = await listStripeAccounts()
        router.push(accounts.some((a) => a.is_active) ? '/pos' : '/setup')
      } catch {
        router.push('/pos')
      }
    } catch {
      toast.error('Erro ao registrar aceite. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-machine flex flex-col items-center justify-center p-6 max-w-[430px] mx-auto">
      <div className="w-full space-y-5">
        {/* Brand */}
        <div className="text-center space-y-2">
          {config?.logo_url ? (
            <Image src={config.logo_url} alt={config.brand_name} width={160} height={48}
              className="h-12 w-auto object-contain mx-auto" />
          ) : (
            <h1 className="text-3xl font-bold text-white tracking-tight">{config?.brand_name || 'Share'}</h1>
          )}
          <p className="text-gray-500 text-xs font-mono tracking-widest uppercase">Termos de Uso</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
              <ScrollText className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Termos de Uso</h2>
              <p className="text-xs text-gray-400">Leia até o final para aceitar</p>
            </div>
          </div>

          {/* Scrollable terms */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-64 overflow-y-auto px-5 py-4 text-xs text-gray-500 leading-relaxed whitespace-pre-wrap"
            style={{ scrollbarWidth: 'thin' }}
          >
            {TERMS_CONTENT}
          </div>

          {/* Fade indicator when not scrolled to bottom */}
          {!scrolledToBottom && (
            <div className="h-6 bg-gradient-to-t from-white to-transparent -mt-6 relative pointer-events-none" />
          )}

          {/* Checkbox + button */}
          <div className="px-5 pb-5 pt-4 space-y-4 border-t border-gray-100">
            <label className={`flex items-start gap-3 cursor-pointer ${!scrolledToBottom ? 'opacity-40 pointer-events-none' : ''}`}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[var(--color-primary)] flex-shrink-0"
                disabled={!scrolledToBottom}
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                Li e aceito os Termos de Uso da plataforma
              </span>
            </label>

            {!scrolledToBottom && (
              <p className="text-[10px] text-gray-400 text-center">
                Role até o final para habilitar o aceite
              </p>
            )}

            <Button
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={!accepted}
              onClick={handleAccept}
            >
              Aceitar e continuar
            </Button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-600 font-mono">
          Share Pagamentos • Conexão Segura
        </p>
      </div>
    </div>
  )
}
