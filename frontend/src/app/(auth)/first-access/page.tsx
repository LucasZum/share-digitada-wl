'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { changePassword } from '@/lib/api/auth'
import { listStripeAccounts } from '@/lib/api/stripe'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useThemeStore } from '@/store/themeStore'
import Image from 'next/image'

interface Rule {
  label: string
  test: (p: string) => boolean
}

const RULES: Rule[] = [
  { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Um número', test: (p) => /\d/.test(p) },
  { label: 'Um caractere especial (!@#$%...)', test: (p) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(p) },
]

export default function FirstAccessPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { config } = useThemeStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const allPassed = RULES.every((r) => r.test(password))
  const matches = password.length > 0 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allPassed) return
    if (!matches) { toast.error('As senhas não coincidem.'); return }

    setIsLoading(true)
    try {
      await changePassword(password)

      const updatedUser = { ...user!, must_change_password: false }
      setUser(updatedUser)

      if (!updatedUser.terms_accepted) {
        router.push('/terms')
        return
      }

      try {
        const accounts = await listStripeAccounts()
        router.push(accounts.some((a) => a.is_active) ? '/pos' : '/setup')
      } catch {
        router.push('/pos')
      }
    } catch {
      toast.error('Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-machine flex flex-col items-center justify-center p-6 max-w-[430px] mx-auto">
      <div className="w-full space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          {config?.logo_url ? (
            <Image src={config.logo_url} alt={config.brand_name} width={160} height={48}
              className="h-12 w-auto object-contain mx-auto" />
          ) : (
            <h1 className="text-3xl font-bold text-white tracking-tight">{config?.brand_name || 'Share'}</h1>
          )}
          <p className="text-gray-500 text-xs font-mono tracking-widest uppercase">Primeiro Acesso</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Crie sua senha</h2>
              </div>
              <p className="text-xs text-gray-400 pl-10">Defina uma senha pessoal para continuar</p>
            </div>

            <Input
              label="Nova senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            {/* Password rules */}
            {password.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-lg bg-gray-50 border border-gray-100">
                {RULES.map((rule) => {
                  const ok = rule.test(password)
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        ok ? 'bg-success' : 'bg-gray-200'
                      }`}>
                        {ok
                          ? <Check className="w-2.5 h-2.5 text-white" />
                          : <X className="w-2.5 h-2.5 text-gray-400" />
                        }
                      </div>
                      <span className={`text-xs ${ok ? 'text-success' : 'text-gray-400'}`}>{rule.label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <Input
              label="Confirmar senha"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              error={confirm.length > 0 && !matches ? 'As senhas não coincidem' : undefined}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={!allPassed || !matches}
            >
              Definir senha e continuar
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
