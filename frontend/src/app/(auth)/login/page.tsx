'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Mail, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

import { login, getMe } from '@/lib/api/auth'
import { listStripeAccounts } from '@/lib/api/stripe'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const { setTokens, setUser } = useAuthStore()
  const { config } = useThemeStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBlockedMessage(null)
    setIsLoading(true)

    try {
      const data = await login(email, password)
      setTokens(data.access, data.refresh)

      const user = await getMe()
      setUser(user)

      if (user.role === 'admin') {
        router.push('/admin/dashboard')
        return
      }

      // Onboarding gates
      if (user.must_change_password) {
        router.push('/first-access')
        return
      }
      if (!user.terms_accepted) {
        router.push('/terms')
        return
      }

      // Check if user has active Stripe account
      try {
        const accounts = await listStripeAccounts()
        const hasActive = accounts.some((a) => a.is_active)
        router.push(hasActive ? '/pos' : '/setup')
      } catch {
        router.push('/pos')
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string; code?: string }; status?: number } }
      const detail = axiosError.response?.data?.detail
      const code = axiosError.response?.data?.code

      if (code === 'account_inactive') {
        setBlockedMessage(typeof detail === 'string' ? detail : 'Conta suspensa.')
      } else if (axiosError.response?.status === 429) {
        setError('Muitas tentativas. Aguarde 15 minutos e tente novamente.')
      } else {
        setError('E-mail ou senha incorretos. Verifique os dados e tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (blockedMessage) {
    return (
      <div className="min-h-screen bg-machine flex flex-col items-center justify-center p-6 max-w-[430px] mx-auto">
        <Card className="w-full text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Suspenso</h1>
              <p className="text-sm text-gray-600 italic">&ldquo;{blockedMessage}&rdquo;</p>
            </div>
            <p className="text-xs text-gray-400">Entre em contato com o administrador para mais informações.</p>
            <button
              onClick={() => setBlockedMessage(null)}
              className="text-sm text-[var(--color-primary)] font-medium hover:underline"
            >
              Voltar ao login
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-machine flex flex-col items-center justify-center p-6 max-w-[430px] mx-auto">
      <div className="w-full space-y-6">
        {/* Logo / Brand */}
        <div className="text-center space-y-2">
          {config?.logo_url ? (
            <Image src={config.logo_url} alt={config.brand_name} width={160} height={48}
              className="h-12 w-auto object-contain mx-auto" />
          ) : (
            <h1 className="text-3xl font-bold text-white tracking-tight">{config?.brand_name || 'Share'}</h1>
          )}
          <p className="text-gray-500 text-sm font-mono tracking-widest uppercase text-xs">Sistema de Pagamentos</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">Entrar</h2>
              <p className="text-xs text-gray-400">Use as credenciais fornecidas pelo administrador</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-danger flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-2">
              {isLoading ? 'Autenticando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-[10px] text-gray-600 font-mono">
          Share Pagamentos • Conexão Segura
        </p>
      </div>
    </div>
  )
}
