'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Users, CreditCard, Percent } from 'lucide-react'
import { getDashboardSummary, getDashboardChart } from '@/lib/api/admin'
import { centsToBRL } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Period = 'today' | '7d' | '30d'

function MetricCard({ title, value, icon: Icon, colorClass }: {
  title: string; value: string; icon: React.ElementType; colorClass: string
}) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null)
  const [chart, setChart] = useState<{ date: string; volume_cents: number; count: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([getDashboardSummary(period), getDashboardChart(period)])
      .then(([m, c]) => { setMetrics(m); setChart(c) })
      .finally(() => setIsLoading(false))
  }, [period])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          {(['today', '7d', '30d'] as Period[]).map((p) => (
            <button
              key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-white text-gray-500 border hover:border-[var(--color-primary)]'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Volume Total" value={centsToBRL(metrics?.volume_cents as number || 0)} icon={TrendingUp} colorClass="bg-[var(--color-primary)]" />
            <MetricCard title="Transações" value={String(metrics?.transaction_count || 0)} icon={CreditCard} colorClass="bg-success" />
            <MetricCard title="Ticket Médio" value={centsToBRL(metrics?.avg_ticket_cents as number || 0)} icon={TrendingUp} colorClass="bg-warning" />
            <MetricCard title="Taxa Aprovação" value={`${metrics?.approval_rate || 0}%`} icon={Percent} colorClass="bg-blue-500" />
          </div>

          <Card padding="md">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[var(--color-primary)]" />
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{(metrics?.active_users as number) || 0}</p>
          </Card>

          {chart.length > 0 && (
            <Card padding="md">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Volume por Dia</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chart} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(parseISO(v), 'dd/MM', { locale: ptBR })} tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => `R$${(v / 100).toFixed(0)}`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => [centsToBRL(v), 'Volume']} labelFormatter={(l) => format(parseISO(l as string), "dd 'de' MMMM", { locale: ptBR })} />
                  <Area type="monotone" dataKey="volume_cents" stroke="var(--color-primary)" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
