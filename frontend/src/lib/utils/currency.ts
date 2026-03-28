export function centsToBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function formatBRLInput(cents: number): string {
  if (cents === 0) return '0,00'
  const str = cents.toString().padStart(3, '0')
  const int = str.slice(0, -2)
  const dec = str.slice(-2)
  const formatted = Number(int).toLocaleString('pt-BR')
  return `${formatted},${dec}`
}
