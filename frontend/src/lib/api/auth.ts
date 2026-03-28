import { api } from './client'
import type { User } from '@/types/user'

export interface LoginResponse {
  access: string
  refresh: string
  user?: User
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login/', { email, password })
  return data
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout/', { refresh: refreshToken })
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me/')
  return data
}
