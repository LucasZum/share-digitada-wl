'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Copy, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

import { getTransactionStatus } from '@/lib/api/transactions'
import type { Transaction } from '@/types/transaction'
import { centsToBRL } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

export default function TransactionDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [tx, setTx] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getTransactionStatus(id)
      .then(setTx)
      .catch(() => router.replace('/history'))
      .finally(() => setIsLoading(false))
  }, [id, router])

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (!tx) return null

  const isSuccess = tx.status === 'succeeded'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold">Detalhe da Transação</h1>
      </div>

      <Card className="text-center">
        <div className="flex justify-center mb-3">
          {isSuccess
            ? <CheckCircle2 className="w-14 h-14 text-success" strokeWidth={1.5} />
            : <XCircle className="w-14 h-14 text-danger" strokeWidth={1.5} />}
        </div>
        <p className="text-3xl font-bold font-mono text-gray-900 mb-1">{centsToBRL(tx.amount)}</p>
        <p className="text-sm text-gray-400 mb-3">
          {format(new Date(tx.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        <StatusBadge status={tx.status} />
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detalhes</h3>
        <dl className="space-y-3">
          {tx.card_last4 && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Cartão</dt>
              <dd className="text-sm font-medium text-gray-900 font-mono">
                {tx.card_brand} •••• {tx.card_last4}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Método</dt>
            <dd className="text-sm font-medium text-gray-900">
              {tx.payment_method === 'card_digital' ? 'Venda Digitada' : 'Cartão Presente'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Moeda</dt>
            <dd className="text-sm font-medium text-gray-900 uppercase">{tx.currency}</dd>
          </div>
          {tx.error_message && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-danger">{tx.error_message}</p>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <dt className="text-xs text-gray-400 font-mono">ID da transação</dt>
            <button
              onClick={() => { navigator.clipboard.writeText(tx.id); toast.success('Copiado!') }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
            >
              <span className="font-mono">{tx.id.slice(0, 8)}...{tx.id.slice(-6)}</span>
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </dl>
      </Card>
    </div>
  )
}
