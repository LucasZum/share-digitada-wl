const errorMap: Record<string, string> = {
  card_declined: 'Cartão recusado. Verifique os dados ou use outro cartão.',
  insufficient_funds: 'Saldo insuficiente. Use outro cartão.',
  lost_card: 'Cartão reportado como perdido. Transação não autorizada.',
  stolen_card: 'Cartão reportado como roubado. Transação não autorizada.',
  expired_card: 'Cartão expirado. Use um cartão válido.',
  incorrect_cvc: 'Código de segurança incorreto. Verifique o CVV.',
  processing_error: 'Erro de processamento. Tente novamente em instantes.',
  incorrect_number: 'Número de cartão incorreto. Verifique os dados.',
  authentication_required: 'Autenticação adicional necessária (3DS). Não suportado no momento.',
}

export function translateStripeError(code: string): string {
  return errorMap[code] ?? 'Pagamento recusado. Por favor, tente novamente.'
}
