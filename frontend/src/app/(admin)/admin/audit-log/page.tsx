'use client'
import { useEffect, useState } from 'react'
import { getAuditLog } from '@/lib/api/admin'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Spinner } from '@/components/ui/Spinner'

interface AuditLogEntry {
  id: string
  actor_email: string | null
  actor_role: string
  action: string
  target_type: string
  target_id: string | null
  metadata: Record<string, string>
  ip_address: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  'auth.login': 'text-blue-600 bg-blue-50',
  'auth.logout': 'text-gray-500 bg-gray-50',
  'user.created': 'text-green-600 bg-green-50',
  'user.blocked': 'text-red-600 bg-red-50',
  'user.deleted': 'text-red-800 bg-red-100',
  'stripe.account_linked': 'text-purple-600 bg-purple-50',
  'transaction.confirmed': 'text-indigo-600 bg-indigo-50',
  'white_label.updated': 'text-orange-600 bg-orange-50',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [action, setAction] = useState('')

  async function load(cursor?: string) {
    setIsLoading(true)
    const data = await getAuditLog({ action: action || undefined, cursor })
    if (cursor) setLogs((prev) => [...prev, ...data.results])
    else setLogs(data.results)
    setNextCursor(data.next ? new URL(data.next).searchParams.get('cursor') : null)
    setIsLoading(false)
  }

  useEffect(() => { load() }, [action])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Log de Auditoria</h1>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value) }}
          className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:border-[var(--color-primary)] outline-none"
        >
          <option value="">Todas as ações</option>
          {Object.keys(ACTION_COLORS).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading && logs.length === 0 ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${ACTION_COLORS[log.action] || 'text-gray-600 bg-gray-50'}`}>
                        {log.action}
                      </span>
                      {log.actor_email && (
                        <span className="text-xs text-gray-500">{log.actor_email}</span>
                      )}
                    </div>
                    {Object.keys(log.metadata).length > 0 && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                    {log.ip_address && (
                      <p className="text-[10px] text-gray-300 font-mono mt-0.5">{log.ip_address}</p>
                    )}
                  </div>
                  <time className="text-xs text-gray-400 flex-shrink-0">
                    {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {nextCursor && (
        <button onClick={() => load(nextCursor)} disabled={isLoading}
          className="w-full py-3 text-sm text-[var(--color-primary)] font-medium">
          {isLoading ? 'Carregando...' : 'Carregar mais'}
        </button>
      )}
    </div>
  )
}
