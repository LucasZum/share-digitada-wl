'use client'
import { useEffect, useState } from 'react'

type ConnectionStatus = 'online' | 'reconnecting' | 'offline'

export function StatusBar() {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)

    const handleOnline = () => setStatus('online')
    const handleOffline = () => setStatus('offline')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-white border-b border-terminalBorder text-xs">
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-3 h-3">
          {status === 'online' && (
            <>
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-40 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </>
          )}
          {status === 'reconnecting' && (
            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning animate-pulse" />
          )}
          {status === 'offline' && (
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-400" />
          )}
        </div>
        <span className="font-mono text-[10px] text-terminalMuted tracking-widest">
          {status === 'online' ? 'CONECTADO' : status === 'reconnecting' ? 'RECONECTANDO' : 'OFFLINE'}
        </span>
      </div>

      <span className="font-mono text-[9px] text-terminalLabel tracking-widest uppercase">
        SHARE PAY DIGITAL
      </span>

      <span className="font-mono text-[10px] text-terminalText font-semibold">{time}</span>
    </div>
  )
}
