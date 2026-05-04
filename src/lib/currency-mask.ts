export function formatCurrencyForInput(rawValue: string): string {
  if (!rawValue) return ''
  const num = parseFloat(rawValue)
  if (isNaN(num)) return ''
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseCurrencyFromInput(inputValue: string): string {
  const digits = inputValue.replace(/\D/g, '')
  if (!digits) return ''
  const num = Number(digits) / 100
  return num.toFixed(2)
}
