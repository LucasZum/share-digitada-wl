'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Shield, LogOut, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

import { logout } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { linkStripeAccount, listStripeAccounts } from '@/lib/api/stripe'
import { useEffect } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, refreshToken, logout: storeLogout } = useAuthStore()
  const [activeAccount, setActiveAccount] = useState<{ publishable_key_suffix: string; activated_at: string } | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
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
      setShowUpdateModal(false)
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
        </div>

        {activeAccount ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <Badge variant="success">● Ativa</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Chave pública</span>
              <span className="font-mono text-gray-600">{activeAccount.publishable_key_suffix}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Ativada em</span>
              <span className="text-gray-600">
                {new Date(activeAccount.activated_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Nenhuma conta vinculada</p>
        )}

        <button
          onClick={() => setShowUpdateModal(true)}
          className="mt-4 w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors text-sm"
        >
          <span className="text-gray-600">Atualizar credenciais</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </Card>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-danger hover:opacity-80 transition-opacity"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium text-sm">Sair da conta</span>
      </button>

      {/* Update Stripe Modal */}
      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Atualizar Credenciais">
        <form onSubmit={handleUpdateStripe} className="space-y-4">
          <Input label="Chave Publicável" value={pk} onChange={(e) => setPk(e.target.value.trim())} placeholder="pk_live_..." />
          <Input label="Chave Secreta" type="password" value={sk} onChange={(e) => setSk(e.target.value.trim())} placeholder="sk_live_..." />
          <Button type="submit" fullWidth isLoading={isUpdating}>Salvar</Button>
        </form>
      </Modal>
    </div>
  )
}
