'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Shield, LogOut, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

import { logout } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { linkStripeAccount, listStripeAccounts, type StripeAccount } from '@/lib/api/stripe'

function maskAccountId(id: string): string {
  if (!id) return '—'
  if (id.length <= 8) return id
  return `${id.slice(0, 5)}...${id.slice(-4)}`
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, refreshToken, logout: storeLogout } = useAuthStore()
  const [activeAccount, setActiveAccount] = useState<StripeAccount | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)
  const [pk, setPk] = useState('')
  const [sk, setSk] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    listStripeAccounts().then((accs) => {
      const active = accs.find((a) => a.is_active)
      if (active) setActiveAccount(active)
    }).catch(() => {})
  }, [])

  async function handleLogout() {
    try {
      if (refreshToken) await logout(refreshToken)
    } catch {}
    storeLogout()
    router.replace('/login')
  }

  async function handleUpdateStripe(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdating(true)
    try {
      await linkStripeAccount(pk, sk)
      toast.success('Credenciais atualizadas!')
      setShowManageModal(false)
      setPk(''); setSk('')
      const accs = await listStripeAccounts()
      setActiveAccount(accs.find((a) => a.is_active) || null)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosError.response?.data?.detail || 'Erro ao atualizar credenciais.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold">Configurações</h1>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
            <User className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.full_name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <Badge variant="info" className="ml-auto">{user?.role}</Badge>
        </div>
      </Card>

      {/* Stripe */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="font-semibold text-gray-900 text-sm">Conta Stripe</h3>
          <button
            onClick={() => setShowManageModal(true)}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
            title="Gerenciar credenciais"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {activeAccount ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <Badge variant={activeAccount.charges_enabled ? 'success' : 'warning'}>
                {activeAccount.charges_enabled ? '● Ativa' : '● Pendente'}
              </Badge>
            </div>
            {activeAccount.account_name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Nome</span>
                <span className="text-gray-600 text-right max-w-[60%] truncate">{activeAccount.account_name}</span>
              </div>
            )}
            {activeAccount.account_email && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">E-mail</span>
                <span className="text-gray-600 text-right max-w-[60%] truncate">{activeAccount.account_email}</span>
              </div>
            )}
            {activeAccount.stripe_account_id && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">ID Stripe</span>
                <span className="font-mono text-gray-500 text-xs">{maskAccountId(activeAccount.stripe_account_id)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Chave pública</span>
              <span className="font-mono text-gray-600">{activeAccount.publishable_key_suffix}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-gray-400">Nenhuma conta vinculada</p>
            <button
              onClick={() => setShowManageModal(true)}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              Conectar conta Stripe
            </button>
          </div>
        )}
      </Card>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-danger hover:opacity-80 transition-opacity"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium text-sm">Sair da conta</span>
      </button>

      {/* Manage Stripe Modal */}
      <Modal isOpen={showManageModal} onClose={() => { setShowManageModal(false); setPk(''); setSk('') }} title="Gerenciar Conta Stripe">
        {activeAccount && (
          <div className="mb-4 space-y-2 pb-4 border-b border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <Badge variant={activeAccount.charges_enabled ? 'success' : 'warning'}>
                {activeAccount.charges_enabled ? '● Ativa' : '● Pendente verificação'}
              </Badge>
            </div>
            {activeAccount.account_name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Nome</span>
                <span className="text-gray-700 text-right max-w-[60%] truncate">{activeAccount.account_name}</span>
              </div>
            )}
            {activeAccount.account_email && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">E-mail</span>
                <span className="text-gray-700 text-right max-w-[60%] truncate">{activeAccount.account_email}</span>
              </div>
            )}
            {activeAccount.stripe_account_id && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">ID Stripe</span>
                <span className="font-mono text-gray-500 text-xs">{maskAccountId(activeAccount.stripe_account_id)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Chave pública</span>
              <span className="font-mono text-gray-600">{activeAccount.publishable_key_suffix}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Vinculada em</span>
              <span className="text-gray-600">
                {new Date(activeAccount.activated_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-3">
          {activeAccount ? 'Substituir credenciais' : 'Conectar conta Stripe'}
        </p>
        <form onSubmit={handleUpdateStripe} className="space-y-4">
          <Input label="Chave Publicável" value={pk} onChange={(e) => setPk(e.target.value.trim())} placeholder="pk_live_..." />
          <Input label="Chave Secreta" type="password" value={sk} onChange={(e) => setSk(e.target.value.trim())} placeholder="sk_live_..." />
          <Button type="submit" fullWidth isLoading={isUpdating}>Salvar</Button>
        </form>
      </Modal>
    </div>
  )
}
