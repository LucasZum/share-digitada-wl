'use client'
import { useEffect, useState } from 'react'
import { Search, UserPlus, Shield, ShieldOff, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

import { listUsers, createUser, blockUser, unblockUser, deleteUser } from '@/lib/api/admin'
import type { User } from '@/types/user'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showBlock, setShowBlock] = useState<User | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState('')
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'user' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function reload() {
    setIsLoading(true)
    const data = await listUsers({ search: search || undefined })
    setUsers(data.results || data)
    setIsLoading(false)
  }

  useEffect(() => { reload() }, [search])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await createUser(newUser)
      setTempPassword(result.temp_password)
      toast.success('Usuário criado!')
      reload()
    } catch { toast.error('Erro ao criar usuário.') }
    finally { setIsSubmitting(false) }
  }

  async function handleBlock(user: User) {
    try {
      await blockUser(user.id, noticeMessage)
      toast.success('Usuário bloqueado.')
      setShowBlock(null)
      setNoticeMessage('')
      reload()
    } catch { toast.error('Erro ao bloquear.') }
  }

  async function handleUnblock(userId: string) {
    try {
      await unblockUser(userId)
      toast.success('Usuário desbloqueado.')
      reload()
    } catch { toast.error('Erro ao desbloquear.') }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Remover este usuário? O histórico de transações será preservado.')) return
    try {
      await deleteUser(userId)
      toast.success('Usuário removido.')
      reload()
    } catch { toast.error('Erro ao remover.') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
        <Button size="sm" onClick={() => { setShowCreate(true); setTempPassword(null) }}>
          <UserPlus className="w-4 h-4" /> Novo usuário
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:border-[var(--color-primary)] focus:border-2 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={u.role === 'admin' ? 'warning' : 'default'}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'Ativo' : 'Bloqueado'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/users/${u.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--color-primary)] hover:bg-blue-50">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {u.is_active ? (
                        <button onClick={() => { setShowBlock(u); setNoticeMessage('') }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-warning hover:bg-yellow-50">
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleUnblock(u.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-success hover:bg-green-50">
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Novo Usuário">
        {tempPassword ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-gray-600 mb-2">Senha temporária (salve agora):</p>
              <p className="font-mono font-bold text-xl text-gray-900 tracking-widest">{tempPassword}</p>
            </div>
            <p className="text-xs text-gray-400">Esta senha não será exibida novamente.</p>
            <Button fullWidth onClick={() => { setShowCreate(false); setTempPassword(null) }}>Fechar</Button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Nome completo" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} required />
            <Input label="E-mail" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full h-[52px] px-4 rounded-lg border border-gray-200 text-gray-900 bg-white focus:border-2 focus:border-[var(--color-primary)] outline-none"
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" fullWidth isLoading={isSubmitting}>Criar Usuário</Button>
          </form>
        )}
      </Modal>

      {/* Block Modal */}
      <Modal isOpen={!!showBlock} onClose={() => setShowBlock(null)} title={`Bloquear ${showBlock?.full_name}`}>
        <div className="space-y-4">
          <Input
            label="Mensagem para o usuário (opcional)"
            value={noticeMessage}
            onChange={(e) => setNoticeMessage(e.target.value)}
            placeholder="Ex: Conta suspensa para verificação"
          />
          <Button variant="danger" fullWidth onClick={() => showBlock && handleBlock(showBlock)}>
            Confirmar Bloqueio
          </Button>
        </div>
      </Modal>
    </div>
  )
}
