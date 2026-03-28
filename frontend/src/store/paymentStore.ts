'use client'
import { create } from 'zustand'
import type { Transaction } from '@/types/transaction'

interface PaymentState {
  amountCents: number
  transactionId: string | null
  step: 1 | 2 | 3 | 4
  result: Transaction | null
  setAmount: (cents: number) => void
  setTransactionId: (id: string) => void
  setStep: (step: 1 | 2 | 3 | 4) => void
  setResult: (tx: Transaction) => void
  reset: () => void
}

export const usePaymentStore = create<PaymentState>((set) => ({
  amountCents: 0,
  transactionId: null,
  step: 1,
  result: null,

  setAmount: (cents) => set({ amountCents: cents }),
  setTransactionId: (id) => set({ transactionId: id }),
  setStep: (step) => set({ step }),
  setResult: (tx) => set({ result: tx }),
  reset: () => set({ amountCents: 0, transactionId: null, step: 1, result: null }),
}))
