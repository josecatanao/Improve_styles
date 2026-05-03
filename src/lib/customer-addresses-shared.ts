export type CustomerAddress = {
  id: string
  customer_id: string
  label: string | null
  street: string
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  reference: string | null
  latitude: number | null
  longitude: number | null
  gps_captured_at: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type CustomerAddressInput = {
  label?: string | null
  street: string
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  reference?: string | null
  latitude?: number | null
  longitude?: number | null
  gps_captured_at?: string | null
  is_primary?: boolean
}

export function formatAddressDisplay(address: CustomerAddress): string {
  const parts: string[] = []
  const line1 = [address.street.trim(), address.number?.trim()].filter(Boolean).join(', ')
  if (line1) parts.push(line1)
  const line2 = [address.neighborhood?.trim(), address.complement?.trim()].filter(Boolean).join(' - ')
  if (line2) parts.push(line2)
  const line3 = [address.city?.trim(), address.state?.trim(), address.zip_code?.trim()].filter(Boolean).join(' • ')
  if (line3) parts.push(line3)
  if (address.reference?.trim()) parts.push(`Ref.: ${address.reference.trim()}`)
  return parts.filter(Boolean).join('\n') || address.street
}

export function formatAddressShort(address: CustomerAddress): string {
  const parts: string[] = []
  if (address.street.trim()) {
    parts.push(address.number?.trim() ? `${address.street.trim()}, ${address.number.trim()}` : address.street.trim())
  }
  if (address.neighborhood?.trim()) parts.push(address.neighborhood.trim())
  if (address.city?.trim() && address.state?.trim()) parts.push(`${address.city.trim()}/${address.state.trim()}`)
  else if (address.city?.trim()) parts.push(address.city.trim())
  if (address.zip_code?.trim()) parts.push(address.zip_code.trim())
  return parts.join(' — ') || address.street
}
