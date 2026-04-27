import { createClient } from '@/utils/supabase/server'
import type { ProductDetail, ProductFormOptions, ProductListItem } from '@/lib/product-shared'
export { getProductStatusClasses, getProductStatusLabel } from '@/lib/product-shared'

export const PRODUCTS_PAGE_SIZE = 8

export type ProductDashboardMetrics = {
  totalProducts: number
  activeProducts: number
  inventoryValue: number
  lowStockCount: number
  setupRequired: boolean
}

export type ProductOverviewData = {
  statusBreakdown: Array<{ label: string; value: number }>
  categoryBreakdown: Array<{ label: string; value: number }>
  brandBreakdown: Array<{ label: string; value: number }>
  stockBands: Array<{ label: string; value: number }>
  topInventoryProducts: Array<{ id: string; name: string; stock: number; price: number; value: number }>
  recentProducts: ProductListItem[]
  setupRequired: boolean
  errorMessage: string | null
}

export type ProductListResult = {
  products: ProductListItem[]
  total: number
  totalPages: number
  currentPage: number
  setupRequired: boolean
  errorMessage: string | null
}

function sanitizePage(page: string | undefined) {
  const parsed = Number(page ?? '1')
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return Math.floor(parsed)
}

function isMissingTable(error: { code?: string } | null, tableCode = '42P01') {
  return error?.code === tableCode
}

export async function getProductMetrics(): Promise<ProductDashboardMetrics> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, price, stock, status')

  if (isMissingTable(error)) {
    return {
      totalProducts: 0,
      activeProducts: 0,
      inventoryValue: 0,
      lowStockCount: 0,
      setupRequired: true,
    }
  }

  if (error || !data) {
    return {
      totalProducts: 0,
      activeProducts: 0,
      inventoryValue: 0,
      lowStockCount: 0,
      setupRequired: false,
    }
  }

  const inventoryValue = data.reduce((total, product) => {
    return total + Number(product.price ?? 0) * Number(product.stock ?? 0)
  }, 0)

  return {
    totalProducts: data.length,
    activeProducts: data.filter((product) => product.status === 'active').length,
    inventoryValue,
    lowStockCount: data.filter((product) => Number(product.stock ?? 0) <= 3).length,
    setupRequired: false,
  }
}

export async function getProducts(options: {
  page?: string
  query?: string
  status?: string
}): Promise<ProductListResult> {
  const supabase = await createClient()
  const currentPage = sanitizePage(options.page)
  const query = options.query?.trim()
  const status = options.status?.trim()
  const from = (currentPage - 1) * PRODUCTS_PAGE_SIZE
  const to = from + PRODUCTS_PAGE_SIZE - 1

  let request = supabase
    .from('products')
    .select(
      `
        id,
        name,
        sku,
        colors,
        price,
        compare_at_price,
        stock,
        status,
        is_active,
        created_at,
        short_description,
        description,
        category,
        brand,
        tags,
        product_images(public_url, assigned_color_name, assigned_color_hex),
        product_variants(id, color_name, color_hex, size, sku, stock, price, compare_at_price, cost_price, status, position)
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (query) {
    request = request.or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%,brand.ilike.%${query}%`)
  }

  if (status) {
    request = request.eq('status', status)
  }

  const { data, count, error } = await request

  if (isMissingTable(error)) {
    return {
      products: [],
      total: 0,
      totalPages: 0,
      currentPage,
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error) {
    return {
      products: [],
      total: 0,
      totalPages: 0,
      currentPage,
      setupRequired: false,
      errorMessage: error.message,
    }
  }

  const total = count ?? 0

  return {
    products: (data as ProductListItem[]) ?? [],
    total,
    totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)),
    currentPage,
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getProductOverviewData(): Promise<ProductOverviewData> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        name,
        sku,
        colors,
        price,
        compare_at_price,
        stock,
        status,
        is_active,
        created_at,
        short_description,
        description,
        category,
        brand,
        tags,
        product_images(public_url, assigned_color_name, assigned_color_hex),
        product_variants(id, color_name, color_hex, size, sku, stock, price, compare_at_price, cost_price, status, position)
      `
    )
    .order('created_at', { ascending: false })

  if (isMissingTable(error)) {
    return {
      statusBreakdown: [],
      categoryBreakdown: [],
      brandBreakdown: [],
      stockBands: [],
      topInventoryProducts: [],
      recentProducts: [],
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error || !data) {
    return {
      statusBreakdown: [],
      categoryBreakdown: [],
      brandBreakdown: [],
      stockBands: [],
      topInventoryProducts: [],
      recentProducts: [],
      setupRequired: false,
      errorMessage: error?.message ?? 'Nao foi possivel carregar a visao geral.',
    }
  }

  const products = (data as ProductListItem[]) ?? []
  const statusLabels: Record<string, string> = {
    active: 'Ativos',
    draft: 'Rascunhos',
    out_of_stock: 'Esgotados',
    hidden: 'Ocultos',
  }

  const statusMap = new Map<string, number>()
  const categoryMap = new Map<string, number>()
  const brandMap = new Map<string, number>()
  const stockBands = {
    'Sem estoque': 0,
    'Baixo (1-3)': 0,
    'Medio (4-10)': 0,
    'Alto (11+)': 0,
  }

  products.forEach((product) => {
    statusMap.set(product.status, (statusMap.get(product.status) ?? 0) + 1)

    const category = product.category?.trim() || 'Sem categoria'
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1)

    const brand = product.brand?.trim() || 'Sem marca'
    brandMap.set(brand, (brandMap.get(brand) ?? 0) + 1)

    if (product.stock <= 0) {
      stockBands['Sem estoque'] += 1
    } else if (product.stock <= 3) {
      stockBands['Baixo (1-3)'] += 1
    } else if (product.stock <= 10) {
      stockBands['Medio (4-10)'] += 1
    } else {
      stockBands['Alto (11+)'] += 1
    }
  })

  const toSortedArray = (map: Map<string, number>, limit = 5) =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, value]) => ({ label, value }))

  return {
    statusBreakdown: Array.from(statusMap.entries())
      .map(([key, value]) => ({ label: statusLabels[key] ?? key, value }))
      .sort((a, b) => b.value - a.value),
    categoryBreakdown: toSortedArray(categoryMap, 6),
    brandBreakdown: toSortedArray(brandMap, 6),
    stockBands: Object.entries(stockBands).map(([label, value]) => ({ label, value })),
    topInventoryProducts: products
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock: Number(product.stock ?? 0),
        price: Number(product.price ?? 0),
        value: Number(product.stock ?? 0) * Number(product.price ?? 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
    recentProducts: products.slice(0, 5),
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getProductById(productId: string): Promise<{
  product: ProductDetail | null
  setupRequired: boolean
  errorMessage: string | null
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        name,
        sku,
        colors,
        price,
        compare_at_price,
        cost_price,
        stock,
        status,
        is_active,
        created_at,
        short_description,
        description,
        category,
        brand,
        collection,
        audience,
        tags,
        is_featured,
        is_new,
        weight,
        width,
        height,
        length,
        product_images(id, public_url, storage_path, alt_text, sort_order, assigned_color_name, assigned_color_hex),
        product_variants(id, color_name, color_hex, size, sku, stock, price, compare_at_price, cost_price, status, position)
      `
    )
    .eq('id', productId)
    .single()

  if (isMissingTable(error)) {
    return {
      product: null,
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error) {
    return {
      product: null,
      setupRequired: false,
      errorMessage: error.message,
    }
  }

  return {
    product: (data as ProductDetail) ?? null,
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getProductFormOptions(): Promise<ProductFormOptions> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('category, brand')
    .order('created_at', { ascending: false })

  if (isMissingTable(error) || error || !data) {
    return {
      categories: [],
      brands: [],
    }
  }

  const categories = Array.from(
    new Set(
      data
        .map((item) => item.category?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )

  const brands = Array.from(
    new Set(
      data
        .map((item) => item.brand?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )

  return {
    categories,
    brands,
  }
}
