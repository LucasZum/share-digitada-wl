export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'unknown'

export function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7([01]\d|20))/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'elo'
  return 'unknown'
}

export function formatCardNumber(value: string, brand: CardBrand): string {
  const digits = value.replace(/\D/g, '')
  if (brand === 'amex') {
    return digits.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim()
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export function getCVVLength(brand: CardBrand): number {
  return brand === 'amex' ? 4 : 3
}
