'use client'
import Image from 'next/image'
import { History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/store/themeStore'

interface POSHeaderProps {
  showHistory?: boolean
}

export function POSHeader({ showHistory = true }: POSHeaderProps) {
  const { config } = useThemeStore()
  const router = useRouter()

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-terminalBorder">
      <div className="flex flex-col">
        {config?.logo_url ? (
          <Image src={config.logo_url} alt={config.brand_name} width={110} height={30} className="h-7 w-auto object-contain" />
        ) : (
          <span className="text-terminalText font-bold text-lg tracking-tight">{config?.brand_name || 'Share Pay'}</span>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-mono text-terminalLabel tracking-widest uppercase">
            VENDA DIGITADA REMOTA
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[8px] font-mono text-success font-bold tracking-wider">ATIVO</span>
          </span>
        </div>
      </div>
      {showHistory && (
        <button
          onClick={() => router.push('/history')}
          className="p-2 rounded-lg text-terminalMuted hover:text-terminalText hover:bg-gray-100 transition-colors"
          aria-label="Histórico de transações"
        >
          <History className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
