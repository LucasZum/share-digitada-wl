'use client'
import { useEffect, useState } from 'react'
import { Download, Receipt } from 'lucide-react'
import { getBillingReport, getBillingCsvUrl } from '@/lib/api/admin'
import { centsToBRL } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface BillingRecord {
  user_id: string
  email: string
  full_name: string
  volume_cents: number
  transaction_count: number
  fee_cents: number
}

export default function BillingPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [records, setRecords] = useState<BillingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getBillingReport(year, month)
      .then((data) => setRecords(data.records || []))
      .finally(() => setIsLoading(false))
  }, [year, month])

  const totalVolume = records.reduce((sum, r) => sum + r.volume_cents, 0)
  const totalFee = records.reduce((sum, r) => sum + r.fee_cents, 0)

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Faturamento</h1>
        <a
          href={getBillingCsvUrl(year, month)}
          download
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Download className="w-4 h-4" /> CSV
        </a>
      </div>

      {/* Period selector */}
      <Card padding="sm">
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:border-[var(--color-primary)] outline-none"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28 h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:border-[var(--color-primary)] outline-none"
          >
            {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Volume Total</p>
          <p className="text-2xl font-bold text-gray-900">{centsToBRL(totalVolume)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Comissão (5%)</p>
          <p className="text-2xl font-bold text-success">{centsToBRL(totalFee)}</p>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-10">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum registro para este período</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Transações</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão (5%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r) => (
                <tr key={r.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.full_name}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{r.transaction_count}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">{centsToBRL(r.volume_cents)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-success">{centsToBRL(r.fee_cents)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-gray-700" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-right font-mono text-gray-900">{centsToBRL(totalVolume)}</td>
                <td className="px-4 py-3 text-right font-mono text-success">{centsToBRL(totalFee)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
