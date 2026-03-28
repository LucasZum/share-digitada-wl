'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Eye, EyeOff, Info } from 'lucide-react'
import toast from 'react-hot-toast'

import { linkStripeAccount } from '@/lib/api/stripe'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function SetupPage() {
  const router = useRouter()
  const [pk, setPk] = useState('')
  const [sk, setSk] = useState('')
  const [showSk, setShowSk] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ pk?: string; sk?: string }>({})

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!pk.startsWith('pk_live_') && !pk.startsWith('pk_test_')) {
      errs.pk = 'Deve começar com pk_live_ ou pk_test_'
    }
    if (!sk.startsWith('sk_live_') && !sk.startsWith('sk_test_')) {
      errs.sk = 'Deve começar com sk_live_ ou sk_test_'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)

    try {
      await linkStripeAccount(pk, sk)
      toast.success('Conta Stripe vinculada com sucesso!')
      router.push('/pos')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      const msg = axiosError.response?.data?.detail || 'Erro ao validar credenciais Stripe.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Configurar Stripe</h2>
            <p className="text-xs text-gray-400">Vincule sua conta para começar a receber</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 mb-5 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Suas chaves são criptografadas com AES-256 e nunca ficam expostas.
            Acesse o Dashboard do Stripe para obtê-las.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Chave Publicável (Publishable Key)"
            value={pk}
            onChange={(e) => setPk(e.target.value.trim())}
            placeholder="pk_test_..."
            error={errors.pk}
            autoComplete="off"
            spellCheck={false}
          />

          <div className="relative">
            <Input
              label="Chave Secreta (Secret Key)"
              type={showSk ? 'text' : 'password'}
              value={sk}
              onChange={(e) => setSk(e.target.value.trim())}
              placeholder="sk_test_..."
              error={errors.sk}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowSk(!showSk)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showSk ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            {isLoading ? 'Validando...' : 'Vincular Conta'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
