export type ProductStatus = 'draft' | 'active' | 'hidden' | 'out_of_stock'
export type ProductVariantStatus = 'active' | 'inactive'

export type ProductImageRecord = {
  id?: string
  public_url: string | null
  storage_path?: string | null
  alt_text?: string | null
  sort_order?: number | null
  assigned_color_name?: string | null
  assigned_color_hex?: string | null
}

export type ProductColor = {
  name: string
  hex: string
}

export type ProductVariant = {
  id?: string
  color_name: string
  color_hex: string
  size: string
  sku: string | null
  stock: number
  price: number | null
  compare_at_price: number | null
  cost_price: number | null
  status: ProductVariantStatus
  position?: number | null
}

export type ProductListItem = {
  id: string
  name: string
  sku: string | null
  client_request_id?: string | null
  colors: ProductColor[] | null
  price: number
  compare_at_price: number | null
  stock: number
  status: ProductStatus
  is_active: boolean
  created_at: string
  short_description: string | null
  description: string | null
  category: string | null
  brand: string | null
  collection?: string | null
  audience?: string | null
  tags: string[] | null
  is_featured?: boolean
  is_new?: boolean
  sales_count?: number | null
  review_count?: number
  average_rating?: number | null
  product_images?: ProductImageRecord[] | null
  product_variants?: ProductVariant[] | null
}

export type ProductDetail = ProductListItem & {
  collection: string | null
  audience: string | null
  cost_price: number | null
  is_featured: boolean
  is_new: boolean
  show_specs: boolean
  weight: number | null
  width: number | null
  height: number | null
  length: number | null
}

export type ProductFormOptions = {
  categories: string[]
  brands: string[]
}

export function getProductStatusLabel(status: ProductStatus) {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'hidden':
      return 'Oculto'
    case 'out_of_stock':
      return 'Esgotado'
    default:
      return 'Rascunho'
  }
}

export function getProductStatusClasses(status: ProductStatus) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700'
    case 'hidden':
      return 'bg-slate-100 text-slate-600'
    case 'out_of_stock':
      return 'bg-amber-50 text-amber-700'
    default:
      return 'bg-blue-50 text-blue-700'
  }
}
