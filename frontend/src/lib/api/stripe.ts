import { api } from './client'

export interface StripeAccount {
  id: string
  publishable_key_suffix: string
  stripe_account_id: string
  account_name: string
  account_email: string
  charges_enabled: boolean
  is_active: boolean
  activated_at: string
  deactivated_at: string | null
  created_at: string
}

export async function listStripeAccounts(): Promise<StripeAccount[]> {
  const { data } = await api.get<StripeAccount[]>('/stripe/accounts/')
  return data
}

export async function linkStripeAccount(publishableKey: string, secretKey: string): Promise<StripeAccount> {
  const { data } = await api.post<StripeAccount>('/stripe/accounts/', {
    publishable_key: publishableKey,
    secret_key: secretKey,
  })
  return data
}
