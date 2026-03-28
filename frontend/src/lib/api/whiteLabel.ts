import { api } from './client'
import type { WhiteLabelConfig } from '@/types/whiteLabel'

export async function getWhiteLabel(): Promise<WhiteLabelConfig> {
  const { data } = await api.get<WhiteLabelConfig>('/config/white-label/')
  return data
}

export async function updateWhiteLabel(formData: FormData): Promise<WhiteLabelConfig> {
  const { data } = await api.patch<WhiteLabelConfig>('/admin/white-label/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
