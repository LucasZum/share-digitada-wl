'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, CheckCircle, XCircle } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { listTransactions } from '@/lib/api/transactions'
import { centsToBRL } from '@/lib/utils/currency'
import type { Transaction } from '@/types/transaction'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/Badge'

type Period = 'today' | '7d' | '30d'

function formatGroupDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Hoje'
  if (isYesterday(d)) return 'Ontem'
  return format(d, "dd 'de' MMMM", { locale: ptBR })
}

export default function HistoryPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<Period>('30d')

  const load = useCallback(async (cursor?: string) => {
    setIsLoading(true)
    try {
      const now = new Date()
      const dateFrom =
        period === 'today'
          ? format(now, 'yyyy-MM-dd')
          : period === '7d'
          ? format(new Date(now.getTime() - 7 * 86400000), 'yyyy-MM-dd')
          : format(new Date(now.getTime() - 30 * 86400000), 'yyyy-MM-dd')

      const data = await listTransactions({ date_from: dateFrom, cursor })
      if (cursor) {
        setTransactions((prev) => [...prev, ...data.results])
      } else {
        setTransactions(data.results)
      }
      setNextCursor(data.next ? new URL(data.next).searchParams.get('cursor') : null)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => { load() }, [load])

  const filtered = transactions.filter((tx) =>
    !search ||
    tx.card_last4?.includes(search) ||
    tx.amount_brl?.includes(search)
  )

  // Group by date
  const groups = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = tx.created_at.split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold">Histórico</h1>
      </div>

      {/* Search + Filters */}
      <Card padding="sm">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por valor ou últimos 4 dígitos"
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-sm text-gray-800 focus:border-[var(--color-primary)] focus:border-2 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['today', '7d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </Card>

      {/* Transactions */}
      {isLoading && transactions.length === 0 ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : Object.keys(groups).length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-400 text-sm">Nenhuma transação encontrada</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs font-medium text-gray-500 mb-2 px-1">{formatGroupDate(date)}</p>
              <Card padding="sm" className="divide-y divide-gray-50">
                {txs.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => router.push(`/history/${tx.id}`)}
                    className="w-full flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-70 transition-opacity"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.status === 'succeeded' ? 'bg-success/10' : 'bg-danger/10'
                    }`}>
                      {tx.status === 'succeeded'
                        ? <CheckCircle className="w-4 h-4 text-success" />
                        : <XCircle className="w-4 h-4 text-danger" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {tx.card_last4 ? `•••• ${tx.card_last4}` : 'Cartão'}
                        {tx.card_brand && <span className="ml-1 text-xs text-gray-400">{tx.card_brand}</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(tx.created_at), 'HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">{tx.amount_brl}</p>
                      <StatusBadge status={tx.status} />
                    </div>
                  </button>
                ))}
              </Card>
            </div>
          ))}

          {nextCursor && (
            <button
              onClick={() => load(nextCursor)}
              disabled={isLoading}
              className="w-full py-3 text-sm text-[var(--color-primary)] font-medium"
            >
              {isLoading ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
