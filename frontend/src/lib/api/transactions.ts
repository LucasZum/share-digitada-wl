import { api } from './client'
import type { Transaction } from '@/types/transaction'

export async function createTransaction(amountCents: number): Promise<Transaction> {
  const { data } = await api.post<Transaction>('/transactions/create/', { amount: amountCents })
  return data
}

export interface ConfirmPayload {
  card_number: string
  exp_month: number
  exp_year: number
  cvc: string
}

export async function confirmTransaction(id: string, payload: ConfirmPayload): Promise<Transaction> {
  const { data } = await api.post<Transaction>(`/transactions/${id}/confirm/`, payload)
  return data
}

export async function getTransactionStatus(id: string): Promise<Transaction> {
  const { data } = await api.get<Transaction>(`/transactions/${id}/status/`)
  return data
}

export interface TransactionFilters {
  status?: string
  date_from?: string
  date_to?: string
  cursor?: string
}

export async function listTransactions(filters?: TransactionFilters) {
  const { data } = await api.get('/transactions/', { params: filters })
  return data
}
