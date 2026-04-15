export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  notice_message?: string
  must_change_password: boolean
  terms_accepted: boolean
  payment_links_enabled: boolean
  created_at: string
  updated_at: string
}

export interface UserMetrics {
  volume_cents: number
  transaction_count: number
  avg_ticket_cents: number
  approval_rate: number
  fee_cents: number
  period: string
}
