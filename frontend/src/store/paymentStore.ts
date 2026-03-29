'use client'
import { create } from 'zustand'
import type { Transaction } from '@/types/transaction'

interface PaymentState {
  amountCents: number
  transactionId: string | null
  clientSecret: string | null
  publishableKey: string | null
  step: 1 | 2 | 3 | 4
  result: Transaction | null
  setAmount: (cents: number) => void
  setTransactionId: (id: string) => void
  setClientSecret: (secret: string) => void
  setPublishableKey: (key: string) => void
  setStep: (step: 1 | 2 | 3 | 4) => void
  setResult: (tx: Transaction) => void
  reset: () => void
}

export const usePaymentStore = create<PaymentState>((set) => ({
  amountCents: 0,
  transactionId: null,
  clientSecret: null,
  publishableKey: null,
  step: 1,
  result: null,

  setAmount: (cents) => set({ amountCents: cents }),
  setTransactionId: (id) => set({ transactionId: id }),
  setClientSecret: (secret) => set({ clientSecret: secret }),
  setPublishableKey: (key) => set({ publishableKey: key }),
  setStep: (step) => set({ step }),
  setResult: (tx) => set({ result: tx }),
  reset: () => set({ amountCents: 0, transactionId: null, clientSecret: null, publishableKey: null, step: 1, result: null }),
}))
