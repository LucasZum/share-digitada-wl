import { StatusBar } from '@/components/pos/StatusBar'
import { POSHeader } from '@/components/pos/POSHeader'

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-[430px] mx-auto border-x border-terminalBorder">
      <StatusBar />
      <POSHeader />
      <main className="flex-1 flex flex-col px-4 py-5 overflow-y-auto bg-surface">
        {children}
      </main>
      <footer className="px-4 py-3 text-center border-t border-terminalBorder bg-white">
        <p className="text-[10px] text-terminalLabel font-mono tracking-wider">
          SHARE PAY • v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'} • PCI DSS COMPLIANT
        </p>
      </footer>
    </div>
  )
}
