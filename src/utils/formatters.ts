export function formatCurrency(value: number | null | undefined, currency = 'BRL'): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatCompactNumber(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`
  }
  return `R$ ${value.toFixed(0)}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const cleanStr = dateStr.includes('T') ? (dateStr.split('T')[0] ?? '') : dateStr
    const parts = cleanStr.split('-')
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const date = new Date(year, month, day)
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)
    }
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)
  } catch {
    return dateStr
  }
}

export function formatFullDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const cleanStr = dateStr.includes('T') ? (dateStr.split('T')[0] ?? '') : dateStr
    const parts = cleanStr.split('-')
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const date = new Date(year, month, day)
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
    }
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  } catch {
    return dateStr
  }
}

