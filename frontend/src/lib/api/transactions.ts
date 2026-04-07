import { api } from './client'
import type { Transaction, CreateTransactionResponse } from '@/types/transaction'

export async function createTransaction(amountCents: number): Promise<CreateTransactionResponse> {
  const { data } = await api.post<CreateTransactionResponse>('/transactions/create/', { amount: amountCents })
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

export async function updateTransactionCustomer(id: string, cpf: string): Promise<void> {
  await api.patch(`/transactions/${id}/customer/`, { cpf })
}
