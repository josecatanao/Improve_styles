export type CustomerProfile = {
  id: string
  email: string
  full_name: string
  whatsapp: string | null
  photo_url: string | null
  delivery_address: string | null
  status: 'active' | 'inactive'
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type CustomerSummary = {
  total: number
  active: number
  inactive: number
  withWhatsapp: number
  withAddress: number
}
