import axios from 'axios'
import { api } from './client'

// Unauthenticated client for public endpoints — uses Next.js /api proxy to avoid CSP issues
const publicApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export interface PaymentLink {
  id: string
  title: string
  amount: number
  amount_brl: string
  status: 'active' | 'inactive' | 'paid'
  slug: string
  payment_url: string
  card_last4: string
  card_brand: string
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface PublicLinkInfo {
  title: string
  amount: number
  publishable_key: string
  client_secret: string
}

export async function listPaymentLinks(): Promise<PaymentLink[]> {
  const { data } = await api.get<PaymentLink[]>('/payment-links/')
  return data
}

export async function createPaymentLink(title: string, amountCents: number): Promise<PaymentLink> {
  const { data } = await api.post<PaymentLink>('/payment-links/', { title, amount: amountCents })
  return data
}

export async function updatePaymentLink(id: string, newStatus: 'active' | 'inactive' | 'paid'): Promise<PaymentLink> {
  const { data } = await api.patch<PaymentLink>(`/payment-links/${id}/`, { status: newStatus })
  return data
}

export async function deletePaymentLink(id: string): Promise<void> {
  await api.delete(`/payment-links/${id}/`)
}

export async function getPublicLink(slug: string): Promise<PublicLinkInfo> {
  const { data } = await publicApi.get<PublicLinkInfo>(`/payment-links/public/${slug}/`)
  return data
}

export async function confirmPayment(slug: string, paymentIntentId: string): Promise<void> {
  await publicApi.post(`/payment-links/public/${slug}/confirm/`, { payment_intent_id: paymentIntentId })
}
