'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getUser, getUserMetrics, togglePaymentLinks } from '@/lib/api/admin'
import type { User, UserMetrics } from '@/types/user'
import { centsToBRL } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

type Period = 'today' | '7d' | '30d'

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [metrics, setMetrics] = useState<UserMetrics | null>(null)
  const [period, setPeriod] = useState<Period>('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [isTogglingLinks, setIsTogglingLinks] = useState(false)

  useEffect(() => {
    getUser(id).then(setUser).catch(() => router.replace('/admin/users'))
  }, [id, router])

  useEffect(() => {
    if (!id) return
    getUserMetrics(id, period).then(setMetrics).finally(() => setIsLoading(false))
  }, [id, period])

  async function handleTogglePaymentLinks() {
    if (!user) return
    setIsTogglingLinks(true)
    try {
      const updated = await togglePaymentLinks(user.id)
      setUser(updated)
      toast.success(
        updated.payment_links_enabled
          ? 'Links de pagamento habilitados.'
          : 'Links de pagamento desabilitados.'
      )
    } catch {
      toast.error('Erro ao alterar permissão de links.')
    } finally {
      setIsTogglingLinks(false)
    }
  }

  if (!user) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Detalhes do Usuário</h1>
      </div>

      {/* Profile */}
      <Card flat>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
            <span className="text-xl font-bold text-[var(--color-primary)]">{user.full_name[0]}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{user.full_name}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge variant={user.role === 'admin' ? 'warning' : 'default'}>{user.role}</Badge>
            <Badge variant={user.is_active ? 'success' : 'danger'}>{user.is_active ? 'Ativo' : 'Bloqueado'}</Badge>
          </div>
        </div>
        {user.notice_message && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <p className="text-sm text-yellow-800">Mensagem: {user.notice_message}</p>
          </div>
        )}
      </Card>

      {/* Permissions */}
      {user.role !== 'admin' && (
        <Card flat>
          <h3 className="font-semibold text-gray-900 mb-3">Permissões</h3>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Links de Pagamento</p>
                <p className="text-xs text-gray-400">Permite criar e compartilhar links de cobrança</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={user.payment_links_enabled ? 'success' : 'default'}>
                {user.payment_links_enabled ? 'Habilitado' : 'Desabilitado'}
              </Badge>
              <button
                onClick={handleTogglePaymentLinks}
                disabled={isTogglingLinks}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  user.payment_links_enabled
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'
                }`}
              >
                {isTogglingLinks ? '...' : user.payment_links_enabled ? 'Desabilitar' : 'Habilitar'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Metrics */}
      <Card flat>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Métricas</h3>
          <div className="flex gap-2">
            {(['today', '7d', '30d'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  period === p ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                {p === 'today' ? 'Hoje' : p === '7d' ? '7d' : '30d'}
              </button>
            ))}
          </div>
        </div>

        {isLoading || !metrics ? (
          <div className="flex justify-center py-5"><Spinner /></div>
        ) : (
          <div>
            <MetricRow label="Volume total" value={centsToBRL(metrics.volume_cents)} />
            <MetricRow label="Transações aprovadas" value={String(metrics.transaction_count)} />
            <MetricRow label="Ticket médio" value={centsToBRL(metrics.avg_ticket_cents)} />
            <MetricRow label="Taxa de aprovação" value={`${metrics.approval_rate}%`} />
            <MetricRow
              label="Comissão Share (5%)"
              value={`${centsToBRL(metrics.fee_cents)}`}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
