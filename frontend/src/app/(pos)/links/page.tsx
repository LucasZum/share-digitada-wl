'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Copy, Link2, Check, Trash2, ToggleLeft, ToggleRight, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  listPaymentLinks,
  createPaymentLink,
  updatePaymentLink,
  deletePaymentLink,
  type PaymentLink,
} from '@/lib/api/paymentLinks'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusBadge({ status }: { status: PaymentLink['status'] }) {
  if (status === 'active') return <Badge variant="success">● Ativo</Badge>
  if (status === 'paid') return <Badge variant="info">● Pago</Badge>
  return <Badge variant="warning">● Inativo</Badge>
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
      title="Copiar link"
    >
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

export default function LinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<PaymentLink | null>(null)
  const [confirmPaid, setConfirmPaid] = useState<PaymentLink | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setIsLoading(true)
    try {
      const data = await listPaymentLinks()
      setLinks(data)
    } catch {
      toast.error('Erro ao carregar links.')
    } finally {
      setIsLoading(false)
    }
  }

  function parseAmount(value: string): number {
    // Accept "12,50" or "12.50" → 1250 cents
    const cleaned = value.replace(/[^0-9,\.]/g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : Math.round(parsed * 100)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const amountCents = parseAmount(amountInput)
    if (!title.trim()) { toast.error('Informe um título.'); return }
    if (amountCents < 100) { toast.error('Valor mínimo: R$ 1,00'); return }

    setIsCreating(true)
    try {
      const link = await createPaymentLink(title.trim(), amountCents)
      setLinks((prev) => [link, ...prev])
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(link.payment_url)
        toast.success('Link criado e copiado para a área de transferência!')
      } catch {
        toast.success('Link criado com sucesso!')
      }
      setShowCreateModal(false)
      setTitle('')
      setAmountInput('')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosError.response?.data?.detail || 'Erro ao criar link.')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleToggle(link: PaymentLink) {
    if (link.status === 'paid') { toast.error('Links pagos não podem ser alterados.'); return }
    const newStatus = link.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = await updatePaymentLink(link.id, newStatus)
      setLinks((prev) => prev.map((l) => l.id === link.id ? updated : l))
      toast.success(newStatus === 'active' ? 'Link ativado.' : 'Link inativado.')
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  async function handleMarkPaid() {
    if (!confirmPaid) return
    try {
      const updated = await updatePaymentLink(confirmPaid.id, 'paid')
      setLinks((prev) => prev.map((l) => l.id === confirmPaid.id ? updated : l))
      toast.success('Link marcado como pago.')
    } catch {
      toast.error('Erro ao marcar como pago.')
    } finally {
      setConfirmPaid(null)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    try {
      await deletePaymentLink(confirmDelete.id)
      setLinks((prev) => prev.filter((l) => l.id !== confirmDelete.id))
      toast.success('Link excluído.')
    } catch {
      toast.error('Erro ao excluir link.')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold flex-1">Links de Pagamento</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Criar
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : links.length === 0 ? (
        <Card className="text-center py-10">
          <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">Nenhum link criado ainda</p>
          <p className="text-gray-300 text-xs mt-1">Crie um link para cobrar seu cliente</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-sm text-[var(--color-primary)] hover:underline font-medium"
          >
            + Criar primeiro link
          </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <Card key={link.id} padding="sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{link.title}</p>
                    <StatusBadge status={link.status} />
                  </div>
                  <p className="text-lg font-bold text-[var(--color-primary)]">{formatBRL(link.amount)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Criado em {format(new Date(link.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {link.status === 'paid' && link.paid_at && (
                    <p className="text-xs text-success mt-0.5">
                      Pago em {format(new Date(link.paid_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      {link.card_last4 && ` · •••• ${link.card_last4}`}
                      {link.card_brand && ` ${link.card_brand}`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <CopyButton url={link.payment_url} />

                  {link.status !== 'paid' && (
                    <button
                      onClick={() => handleToggle(link)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                      title={link.status === 'active' ? 'Inativar link' : 'Ativar link'}
                    >
                      {link.status === 'active'
                        ? <ToggleRight className="w-4 h-4 text-success" />
                        : <ToggleLeft className="w-4 h-4" />}
                    </button>
                  )}

                  {link.status !== 'paid' && (
                    <button
                      onClick={() => setConfirmPaid(link)}
                      className="p-2 rounded-lg text-gray-400 hover:text-success hover:bg-success/10 transition-colors"
                      title="Marcar como pago"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setConfirmDelete(link)}
                    className="p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Excluir link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setTitle(''); setAmountInput('') }} title="Criar Link de Pagamento">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Título / Descrição"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Consultoria — João Silva"
          />
          <Input
            label="Valor (R$)"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="Ex: 150,00"
            inputMode="decimal"
          />
          <p className="text-xs text-gray-400">
            Após criar, o link será copiado automaticamente para a área de transferência.
          </p>
          <Button type="submit" fullWidth isLoading={isCreating}>Gerar Link</Button>
        </form>
      </Modal>

      {/* Confirm Mark Paid Modal */}
      <Modal isOpen={!!confirmPaid} onClose={() => setConfirmPaid(null)} title="Marcar como Pago">
        <p className="text-sm text-gray-600 mb-4">
          Confirmar que o link <strong>"{confirmPaid?.title}"</strong> ({confirmPaid ? formatBRL(confirmPaid.amount) : ''}) foi pago manualmente?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setConfirmPaid(null)}>Cancelar</Button>
          <Button fullWidth onClick={handleMarkPaid}>Confirmar</Button>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Link">
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir o link <strong>"{confirmDelete?.title}"</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <button
            onClick={handleDelete}
            className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  )
}
