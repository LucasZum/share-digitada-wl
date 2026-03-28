'use client'
import { AlertTriangle, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function BlockedPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-warning" strokeWidth={1.5} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Temporariamente Suspenso</h1>
            {user?.notice_message && (
              <blockquote className="border-l-4 border-warning pl-4 text-sm text-gray-600 italic my-3 text-left">
                &ldquo;{user.notice_message}&rdquo;
              </blockquote>
            )}
            <p className="text-sm text-gray-400">Entre em contato com o administrador do sistema para mais informações.</p>
          </div>

          <Button variant="ghost" onClick={handleLogout} className="text-gray-400">
            <LogOut className="w-4 h-4" /> Sair da conta
          </Button>
        </div>
      </Card>
    </div>
  )
}
