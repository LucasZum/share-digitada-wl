import { api } from './client'
import type { User, UserMetrics } from '@/types/user'

// ─── Users ────────────────────────────────────────────────────────────────────
export async function listUsers(params?: { search?: string; is_active?: boolean }) {
  const { data } = await api.get('/admin/users/', { params })
  return data
}

export async function createUser(payload: { email: string; full_name: string; role?: string }) {
  const { data } = await api.post<User & { temp_password: string }>('/admin/users/', payload)
  return data
}

export async function getUser(id: string): Promise<User> {
  const { data } = await api.get<User>(`/admin/users/${id}/`)
  return data
}

export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  const { data } = await api.patch<User>(`/admin/users/${id}/`, payload)
  return data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}/`)
}

export async function blockUser(id: string, notice_message?: string): Promise<User> {
  const { data } = await api.patch<User>(`/admin/users/${id}/block/`, { notice_message })
  return data
}

export async function unblockUser(id: string): Promise<User> {
  const { data } = await api.patch<User>(`/admin/users/${id}/unblock/`)
  return data
}

export async function getUserMetrics(id: string, period = '30d'): Promise<UserMetrics> {
  const { data } = await api.get<UserMetrics>(`/admin/users/${id}/metrics/`, { params: { period } })
  return data
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function getDashboardSummary(period = '30d') {
  const { data } = await api.get('/admin/dashboard/summary/', { params: { period } })
  return data
}

export async function getDashboardChart(period = '30d') {
  const { data } = await api.get('/admin/dashboard/chart/', { params: { period } })
  return data
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export async function getBillingReport(year: number, month: number) {
  const { data } = await api.get('/admin/reports/billing/', { params: { year, month } })
  return data
}

export function getBillingCsvUrl(year: number, month: number): string {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''
  return `${API_URL}/api/admin/reports/billing/?year=${year}&month=${month}&format=csv`
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export async function getAuditLog(params?: { action?: string; cursor?: string }) {
  const { data } = await api.get('/admin/audit-log/', { params })
  return data
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(is_read?: boolean) {
  const { data } = await api.get('/admin/notifications/', { params: { is_read } })
  return data
}
