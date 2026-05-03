import { createClient } from '@/utils/supabase/server'
import type { ProductDetail, ProductFormOptions, ProductListItem } from '@/lib/product-shared'
import {
  getStoreCategoryKey,
  normalizeStoreCategoryLabel,
  sortProducts,
  type ExtendedStoreSortOption,
} from '@/lib/storefront'
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

export type StorefrontResult = {
  allProducts: ProductListItem[]
  featuredProducts: ProductListItem[]
  popularProducts: ProductListItem[]
  newestProducts: ProductListItem[]
  filteredProducts: ProductListItem[]
  categoryHighlights: Array<{ label: string; value: number }>
  brandHighlights: Array<{ label: string; value: number }>
  totalActiveProducts: number
  selectedCategory: string | null
  selectedSort: ExtendedStoreSortOption
  setupRequired: boolean
  errorMessage: string | null
}

export type CategoryStorefrontResult = {
  category: string | null
  slug: string
  products: ProductListItem[]
  categoryHighlights: Array<{ label: string; value: number }>
  setupRequired: boolean
  errorMessage: string | null
}

export type StoreSearchSuggestion = {
  id: string
  label: string
  href: string
  type: 'product' | 'category' | 'brand'
  meta?: string | null
  imageUrl?: string | null
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

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T>()

  items.forEach((item) => {
    const key = getKey(item)
    if (!map.has(key)) {
      map.set(key, item)
    }
  })

  return Array.from(map.values())
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function tokenizeSearchText(value: string | null | undefined) {
  return normalizeSearchText(value)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const variants = new Set<string>([token])

      if (token.endsWith('s') && token.length > 3) {
        variants.add(token.slice(0, -1))
      } else if (token.length > 2) {
        variants.add(`${token}s`)
      }

      return Array.from(variants)
    })
}

function normalizeProductRecord(product: ProductListItem): ProductListItem {
  const images = uniqueBy(
    (product.product_images ?? []).filter((image) => Boolean(image.id || image.public_url)),
    (image) => image.id ?? `${image.public_url ?? 'no-url'}:${image.assigned_color_hex ?? 'no-color'}`
  ).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))

  const variants = uniqueBy(
    (product.product_variants ?? []).filter((variant) => Boolean(variant.id || variant.color_hex || variant.size)),
    (variant) => variant.id ?? `${variant.color_hex}:${variant.size}:${variant.sku ?? 'no-sku'}`
  ).sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))

  const colors = uniqueBy(
    (product.colors ?? []).filter((color) => color.name.trim() || color.hex.trim()),
    (color) => `${color.name.trim().toLowerCase()}:${color.hex.trim().toLowerCase()}`
  )

  return {
    ...product,
    colors,
    product_images: images,
    product_variants: variants,
  }
}

function normalizeProductRows(rows: ProductListItem[] | null | undefined) {
  return uniqueBy(rows ?? [], (product) => product.id).map(normalizeProductRecord)
}

async function attachReviewStats(products: ProductListItem[], supabase: Awaited<ReturnType<typeof createClient>>) {
  if (products.length === 0) {
    return products
  }

  const productIds = products.map((product) => product.id)
  const { data, error } = await supabase
    .from('product_reviews')
    .select('product_id, rating')
    .in('product_id', productIds)

  if (isMissingTable(error)) {
    return products.map((product) => ({
      ...product,
      review_count: 0,
      average_rating: null,
    }))
  }

  if (error || !data) {
    return products
  }

  const stats = new Map<string, { count: number; total: number }>()

  data.forEach((review) => {
    const current = stats.get(review.product_id) ?? { count: 0, total: 0 }
    current.count += 1
    current.total += Number(review.rating ?? 0)
    stats.set(review.product_id, current)
  })

  return products.map((product) => {
    const productStats = stats.get(product.id)

    if (!productStats || productStats.count === 0) {
      return {
        ...product,
        review_count: 0,
        average_rating: null,
      }
    }

    return {
      ...product,
      review_count: productStats.count,
      average_rating: Number((productStats.total / productStats.count).toFixed(1)),
    }
  })
}

export async function getLowStockProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, stock, status')
    .eq('status', 'active')
    .lt('stock', 10)
    .gt('stock', 0)
    .order('stock', { ascending: true })
    .limit(20)

  return (data ?? []) as Array<{ id: string; name: string; stock: number; status: string }>
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

export async function getStoreSearchIndex(): Promise<StoreSearchSuggestion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        name,
        brand,
        category,
        status,
        is_active,
        short_description,
        tags,
        product_images(public_url, sort_order)
      `
    )
    .eq('status', 'active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(500)

  if (isMissingTable(error) || error || !data) {
    return []
  }

  const products = normalizeProductRows(data as ProductListItem[])
  const suggestions: StoreSearchSuggestion[] = []
  const categorySet = new Set<string>()
  const brandSet = new Set<string>()

  products.forEach((product) => {
    suggestions.push({
      id: `product:${product.id}`,
      label: product.name,
      href: `/produto/${product.id}`,
      type: 'product',
      meta: [product.brand?.trim(), normalizeStoreCategoryLabel(product.category)].filter(Boolean).join(' • ') || null,
      imageUrl: product.product_images?.[0]?.public_url ?? null,
    })

    const categoryLabel = normalizeStoreCategoryLabel(product.category)
    const categoryKey = getStoreCategoryKey(product.category)

    if (!categorySet.has(categoryKey)) {
      categorySet.add(categoryKey)
      suggestions.push({
        id: `category:${categoryKey}`,
        label: categoryLabel,
        href: `/loja/${categoryKey}`,
        type: 'category',
        meta: 'Categoria',
        imageUrl: product.product_images?.[0]?.public_url ?? null,
      })
    }

    const brandLabel = product.brand?.trim()
    const brandKey = brandLabel?.toLowerCase()

    if (brandLabel && brandKey && !brandSet.has(brandKey)) {
      brandSet.add(brandKey)
      suggestions.push({
        id: `brand:${brandKey}`,
        label: brandLabel,
        href: `/?q=${encodeURIComponent(brandLabel)}`,
        type: 'brand',
        meta: 'Marca',
        imageUrl: product.product_images?.[0]?.public_url ?? null,
      })
    }
  })

  return suggestions
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
        client_request_id,
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
        is_featured,
        sales_count,
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
    products: normalizeProductRows(data as ProductListItem[]),
    total,
    totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)),
    currentPage,
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getProductOverviewData(page = 1, limit = 20): Promise<ProductOverviewData & { total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        name,
        client_request_id,
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
        sales_count,
        product_images(public_url, assigned_color_name, assigned_color_hex),
        product_variants(id, color_name, color_hex, size, sku, stock, price, compare_at_price, cost_price, status, position)
      `
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (isMissingTable(error) || isMissingTable(countError)) {
    return {
      total: 0,
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
      total: 0,
      statusBreakdown: [],
      categoryBreakdown: [],
      brandBreakdown: [],
      stockBands: [],
      topInventoryProducts: [],
      recentProducts: [],
      setupRequired: false,
      errorMessage: error?.message ?? 'Não foi possível carregar a visão geral.',
    }
  }

  const products = normalizeProductRows(data as ProductListItem[])
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

    const category = normalizeStoreCategoryLabel(product.category)
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
    total: count ?? 0,
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

export async function getStorefrontData(options?: {
  query?: string
  category?: string
  sort?: ExtendedStoreSortOption
  limit?: number
}): Promise<StorefrontResult> {
  const supabase = await createClient()
  const query = options?.query?.trim()
  const category = options?.category?.trim()
  const sort = options?.sort ?? 'popular'
  const limit = options?.limit ?? 50

  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        name,
        client_request_id,
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
        collection,
        audience,
        tags,
        is_featured,
        is_new,
        sales_count,
        product_images(public_url, assigned_color_name, assigned_color_hex),
        product_variants(id, color_name, color_hex, size, sku, stock, price, compare_at_price, cost_price, status, position)
      `
    )
    .eq('status', 'active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (isMissingTable(error)) {
    return {
      allProducts: [],
      featuredProducts: [],
      popularProducts: [],
      newestProducts: [],
      filteredProducts: [],
      categoryHighlights: [],
      brandHighlights: [],
      totalActiveProducts: 0,
      selectedCategory: null,
      selectedSort: sort,
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error || !data) {
    return {
      allProducts: [],
      featuredProducts: [],
      popularProducts: [],
      newestProducts: [],
      filteredProducts: [],
      categoryHighlights: [],
      brandHighlights: [],
      totalActiveProducts: 0,
      selectedCategory: null,
      selectedSort: sort,
      setupRequired: false,
      errorMessage: error?.message ?? 'Não foi possível carregar a vitrine.',
    }
  }

  const allProducts = await attachReviewStats(normalizeProductRows(data as ProductListItem[]), supabase)
  const queryTokenGroups = tokenizeSearchText(query)
  const filteredProducts = allProducts.filter((product) => {
    const searchableParts = [
      product.name,
      product.sku,
      product.category,
      product.brand,
      product.short_description,
      product.description,
      product.collection,
      product.audience,
      ...(product.tags ?? []),
      ...(product.colors ?? []).map((color) => color.name),
      ...(product.product_variants ?? []).flatMap((variant) => [variant.color_name, variant.size]),
    ].filter((value): value is string => Boolean(value))

    const searchableText = normalizeSearchText(searchableParts.join(' '))

    const matchesQuery =
      queryTokenGroups.length > 0
        ? queryTokenGroups.every((group) => group.some((token) => searchableText.includes(token)))
        : true

    const matchesCategory = category ? getStoreCategoryKey(product.category) === getStoreCategoryKey(category) : true

    return matchesQuery && matchesCategory
  })

  const categoryMap = new Map<string, number>()
  const brandMap = new Map<string, number>()

  allProducts.forEach((product) => {
    const productCategory = normalizeStoreCategoryLabel(product.category)
    if (productCategory) {
      categoryMap.set(productCategory, (categoryMap.get(productCategory) ?? 0) + 1)
    }

    const productBrand = product.brand?.trim()
    if (productBrand) {
      brandMap.set(productBrand, (brandMap.get(productBrand) ?? 0) + 1)
    }
  })

  const toHighlightList = (map: Map<string, number>, limit = 6) =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, value]) => ({ label, value }))

  const sortedFilteredProducts = sortProducts(filteredProducts, sort)
  const featuredProducts = sortProducts(allProducts.filter((product) => product.is_featured), 'recent').slice(0, 8)
  const newestProducts = sortProducts(allProducts, 'recent').slice(0, 8)
  const popularProducts = sortProducts(
    allProducts.filter((product) => Number(product.sales_count ?? 0) > 0),
    'popular'
  ).slice(0, 8)
  const selectedCategory =
    category && allProducts.some((product) => getStoreCategoryKey(product.category) === getStoreCategoryKey(category))
      ? normalizeStoreCategoryLabel(
          allProducts.find((product) => getStoreCategoryKey(product.category) === getStoreCategoryKey(category))?.category ?? category
        )
      : null

  return {
    allProducts,
    featuredProducts,
    popularProducts,
    newestProducts,
    filteredProducts: sortedFilteredProducts,
    categoryHighlights: toHighlightList(categoryMap),
    brandHighlights: toHighlightList(brandMap),
    totalActiveProducts: allProducts.length,
    selectedCategory,
    selectedSort: sort,
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getStoreCategoryBySlug(slug: string, options?: {
  query?: string
  sort?: ExtendedStoreSortOption
}): Promise<CategoryStorefrontResult> {
  const supabase = await createClient()
  const [storefront, categoryResult] = await Promise.all([
    getStorefrontData({
      query: options?.query,
      sort: options?.sort,
    }),
    supabase
      .from('store_categories')
      .select('name')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const managedCategoryName = categoryResult.data?.name || null

  if (storefront.setupRequired || storefront.errorMessage) {
    return {
      category: managedCategoryName,
      slug,
      products: [],
      categoryHighlights: storefront.categoryHighlights,
      setupRequired: storefront.setupRequired,
      errorMessage: storefront.errorMessage,
    }
  }

  const categoryMatch = storefront.categoryHighlights.find((item) => getStoreCategoryKey(item.label) === slug)

  const categoryLabel = managedCategoryName || categoryMatch?.label || null

  if (!categoryLabel) {
    return {
      category: null,
      slug,
      products: [],
      categoryHighlights: storefront.categoryHighlights,
      setupRequired: false,
      errorMessage: 'Categoria não encontrada.',
    }
  }

  const products = sortProducts(
    storefront.allProducts.filter((product) => getStoreCategoryKey(product.category) === slug),
    options?.sort ?? 'popular'
  )

  return {
    category: categoryLabel,
    slug,
    products,
    categoryHighlights: storefront.categoryHighlights,
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
        client_request_id,
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
        show_specs,
        sales_count,
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
    product: data ? (await attachReviewStats([normalizeProductRecord(data as ProductListItem)], supabase))[0] as ProductDetail : null,
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getPublicProductById(productId: string): Promise<{
  product: ProductDetail | null
  relatedProducts: ProductListItem[]
  setupRequired: boolean
  errorMessage: string | null
}> {
  const productResult = await getProductById(productId)

  if (productResult.setupRequired || productResult.errorMessage || !productResult.product) {
    return {
      product: productResult.product,
      relatedProducts: [],
      setupRequired: productResult.setupRequired,
      errorMessage: productResult.errorMessage,
    }
  }

  const product = productResult.product

  if (product.status !== 'active' || !product.is_active) {
    return {
      product: null,
      relatedProducts: [],
      setupRequired: false,
      errorMessage: 'Produto indisponível na loja.',
    }
  }

  const storefront = await getStorefrontData()
  const relatedProducts = storefront.allProducts
    .filter((item) => item.id !== product.id)
    .filter((item) => {
      if (product.category?.trim() && item.category?.trim() === product.category.trim()) {
        return true
      }

      if (product.brand?.trim() && item.brand?.trim() === product.brand.trim()) {
        return true
      }

      return false
    })
    .slice(0, 4)

  return {
    product,
    relatedProducts,
    setupRequired: false,
    errorMessage: null,
  }
}

export async function getProductFormOptions(): Promise<ProductFormOptions> {
  const supabase = await createClient()
  const { data: categoryRows, error: categoryError } = await supabase
    .from('store_categories')
    .select('name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!isMissingTable(categoryError) && !categoryError && categoryRows) {
    const categories = Array.from(
      new Set(
        categoryRows
          .map((item) => item.name?.trim())
          .filter((value): value is string => Boolean(value))
          .map((value) => normalizeStoreCategoryLabel(value))
      )
    )

    const { data: brandRows, error: brandError } = await supabase
      .from('products')
      .select('brand')
      .order('created_at', { ascending: false })

    if (isMissingTable(brandError) || brandError || !brandRows) {
      return {
        categories,
        brands: [],
      }
    }

    const brands = Array.from(
      new Set(
        brandRows
          .map((item) => item.brand?.trim())
          .filter((value): value is string => Boolean(value))
      )
    )

    return {
      categories,
      brands,
    }
  }

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
