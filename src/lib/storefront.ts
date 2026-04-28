import type { ProductDetail, ProductImageRecord, ProductListItem, ProductVariant } from '@/lib/product-shared'

export type StoreSortOption = 'popular' | 'price_asc' | 'price_desc'
export type ExtendedStoreSortOption = StoreSortOption | 'recent'
export type ProductVariantAvailability = 'in_stock' | 'low_stock' | 'out_of_stock'

export type VariantColorOption = {
  name: string
  hex: string
  totalStock: number
  hasStock: boolean
}

export type VariantSizeOption = {
  size: string
  stock: number
  hasStock: boolean
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function slugifyStoreValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeStoreCategoryLabel(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return 'Sem categoria'
  }

  const normalized = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  const aliases: Array<{ label: string; match: string[] }> = [
    { label: 'Camisetas', match: ['camiseta', 'camisetas', 't shirt', 'tshirts'] },
    { label: 'Camisas', match: ['camisa', 'camisas', 'social'] },
    { label: 'Calcas', match: ['calca', 'calcas', 'jeans'] },
    { label: 'Bermudas', match: ['bermuda', 'bermudas', 'short', 'shorts'] },
    { label: 'Bolsas', match: ['bolsa', 'bolsas', 'mochila', 'mochilas', 'bag', 'bags'] },
    { label: 'Calcados', match: ['calcado', 'calcados', 'tenis', 'sapato', 'sapatos'] },
    { label: 'Jaquetas', match: ['jaqueta', 'jaquetas'] },
    { label: 'Moletons', match: ['moletom', 'moletons', 'hoodie', 'hoodies'] },
    { label: 'Bones', match: ['bone', 'bones', 'cap', 'caps'] },
    { label: 'Polos', match: ['polo', 'polos'] },
    { label: 'Blusas', match: ['blusa', 'blusas'] },
    { label: 'Acessorios', match: ['acessorio', 'acessorios'] },
  ]

  const alias = aliases.find((entry) =>
    entry.match.some((candidate) => normalized === candidate || normalized.startsWith(`${candidate} `))
  )

  if (alias) {
    return alias.label
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function getStoreCategoryKey(value: string | null | undefined) {
  return slugifyStoreValue(normalizeStoreCategoryLabel(value))
}

export function getProductPrimaryImage(product: ProductListItem | ProductDetail) {
  return product.product_images?.find((image) => image.public_url)?.public_url ?? null
}

export function getProductGallery(product: ProductListItem | ProductDetail) {
  const images = product.product_images?.filter((image): image is ProductImageRecord => Boolean(image.public_url)) ?? []

  if (images.length > 0) {
    return images
  }

  return [
    {
      public_url: null,
      alt_text: product.name,
      assigned_color_hex: null,
      assigned_color_name: null,
    },
  ]
}

export function getProductDisplayBadge(product: ProductListItem) {
  if (Number(product.compare_at_price ?? 0) > Number(product.price ?? 0)) {
    return 'Promocao'
  }

  if (product.is_featured) {
    return 'Destaque'
  }

  if (product.is_new) {
    return 'Novo'
  }

  return null
}

export function sortProducts(products: ProductListItem[], sort: ExtendedStoreSortOption) {
  const cloned = [...products]

  switch (sort) {
    case 'price_asc':
      return cloned.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
    case 'price_desc':
      return cloned.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0))
    case 'recent':
      return cloned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    default:
      return cloned.sort((a, b) => {
        const scoreA = getPopularityScore(a)
        const scoreB = getPopularityScore(b)
        return scoreB - scoreA
      })
  }
}

function getPopularityScore(product: ProductListItem) {
  return Number(product.sales_count ?? 0)
}

export function getProductColorOptions(product: ProductDetail) {
  const variants = getSellableVariants(product.product_variants)
  const fromVariants = new Map<string, { name: string; hex: string }>()

  variants.forEach((variant) => {
    const key = `${variant.color_name}-${variant.color_hex}`
    if (variant.color_name && variant.color_hex && !fromVariants.has(key)) {
      fromVariants.set(key, {
        name: variant.color_name,
        hex: variant.color_hex,
      })
    }
  })

  if (fromVariants.size > 0) {
    return Array.from(fromVariants.values())
  }

  return product.colors ?? []
}

export function getProductSizeOptions(product: ProductDetail) {
  const variants = getSellableVariants(product.product_variants)
  const sizeSet = new Set<string>()

  variants.forEach((variant) => {
    if (variant.size?.trim()) {
      sizeSet.add(variant.size)
    }
  })

  return Array.from(sizeSet)
}

export function resolveVariantSelection(
  variants: ProductVariant[] | null | undefined,
  colorName?: string | null,
  size?: string | null
) {
  const sellableVariants = getSellableVariants(variants)

  if (!sellableVariants.length) {
    return null
  }

  return (
    sellableVariants.find((variant) => {
      const matchesColor = colorName ? variant.color_name === colorName : true
      const matchesSize = size ? variant.size === size : true
      return matchesColor && matchesSize
    }) ??
    sellableVariants.find((variant) => (colorName ? variant.color_name === colorName : true)) ??
    sellableVariants.find((variant) => (size ? variant.size === size : true)) ??
    sellableVariants[0]
  )
}

export function getSellableVariants(variants: ProductVariant[] | null | undefined) {
  return (variants ?? []).filter((variant) => variant.status === 'active')
}

export function hasRealVariants(product: ProductDetail) {
  return getSellableVariants(product.product_variants).length > 0
}

export function getVariantColorOptions(product: ProductDetail): VariantColorOption[] {
  const variants = getSellableVariants(product.product_variants)

  if (!variants.length) {
    return (product.colors ?? []).map((color) => ({
      name: color.name,
      hex: color.hex,
      totalStock: Number(product.stock ?? 0),
      hasStock: Number(product.stock ?? 0) > 0,
    }))
  }

  const colorMap = new Map<string, VariantColorOption>()

  variants.forEach((variant) => {
    const key = `${variant.color_name}-${variant.color_hex}`
    const stock = Number(variant.stock ?? 0)
    const existing = colorMap.get(key)

    if (existing) {
      existing.totalStock += stock
      existing.hasStock = existing.hasStock || stock > 0
      return
    }

    colorMap.set(key, {
      name: variant.color_name,
      hex: variant.color_hex,
      totalStock: stock,
      hasStock: stock > 0,
    })
  })

  return Array.from(colorMap.values())
}

export function getVariantSizeOptions(product: ProductDetail, colorName?: string | null): VariantSizeOption[] {
  const variants = getSellableVariants(product.product_variants)

  if (!variants.length) {
    const fallbackSize = 'Unico'
    return [
      {
        size: fallbackSize,
        stock: Number(product.stock ?? 0),
        hasStock: Number(product.stock ?? 0) > 0,
      },
    ]
  }

  const filtered = colorName ? variants.filter((variant) => variant.color_name === colorName) : variants
  const sizeMap = new Map<string, VariantSizeOption>()

  filtered.forEach((variant) => {
    const stock = Number(variant.stock ?? 0)
    const key = variant.size.trim() || 'Unico'
    const existing = sizeMap.get(key)

    if (existing) {
      existing.stock += stock
      existing.hasStock = existing.hasStock || stock > 0
      return
    }

    sizeMap.set(key, {
      size: key,
      stock,
      hasStock: stock > 0,
    })
  })

  return Array.from(sizeMap.values())
}

export function getFirstAvailableVariantSelection(product: ProductDetail) {
  const variants = getSellableVariants(product.product_variants)

  if (!variants.length) {
    return {
      colorName: product.colors?.[0]?.name ?? null,
      size: 'Unico',
    }
  }

  const firstInStock = variants.find((variant) => Number(variant.stock ?? 0) > 0) ?? variants[0]

  return {
    colorName: firstInStock.color_name || null,
    size: firstInStock.size?.trim() || 'Unico',
  }
}

export function getExactVariant(
  variants: ProductVariant[] | null | undefined,
  colorName?: string | null,
  size?: string | null
) {
  const sellableVariants = getSellableVariants(variants)

  if (!sellableVariants.length || !colorName || !size) {
    return null
  }

  return sellableVariants.find((variant) => variant.color_name === colorName && variant.size === size) ?? null
}

export function getVariantAvailability(stock: number): ProductVariantAvailability {
  if (stock <= 0) {
    return 'out_of_stock'
  }

  if (stock <= 3) {
    return 'low_stock'
  }

  return 'in_stock'
}

export function getVariantStockMessage(stock: number) {
  const availability = getVariantAvailability(stock)

  if (availability === 'out_of_stock') {
    return 'Indisponivel'
  }

  if (availability === 'low_stock') {
    return `Ultimas ${stock} unidades`
  }

  return `${stock} unidade(s) em estoque`
}
