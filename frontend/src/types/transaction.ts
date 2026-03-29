export type TransactionStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
export type PaymentMethod = 'card_digital' | 'card_present'

export interface Transaction {
  id: string
  amount: number
  amount_brl: string
  currency: string
  status: TransactionStatus
  payment_method: PaymentMethod
  card_last4: string
  card_brand: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface CreateTransactionResponse extends Transaction {
  client_secret: string
  publishable_key: string
}
