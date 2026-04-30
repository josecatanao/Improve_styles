import { createClient } from '@/utils/supabase/client'

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function resolveUniqueProductSlug({
  supabase,
  ownerId,
  productName,
  productId,
}: {
  supabase: ReturnType<typeof createClient>
  ownerId: string
  productName: string
  productId?: string | null
}) {
  const baseSlug = slugify(productName) || 'produto'

  const { data: existingSlugs, error } = await supabase
    .from('products')
    .select('slug')
    .eq('owner_id', ownerId)
    .ilike('slug', `${baseSlug}%`)

  if (error) {
    throw new Error(error.message)
  }

  const slugSet = new Set((existingSlugs ?? []).map((row) => row.slug))

  if (productId) {
    const { data: currentProduct } = await supabase
      .from('products')
      .select('slug')
      .eq('id', productId)
      .single()

    if (currentProduct?.slug) {
      slugSet.delete(currentProduct.slug)
    }
  }

  if (!slugSet.has(baseSlug)) {
    return baseSlug
  }

  for (let attempt = 2; attempt <= 100; attempt += 1) {
    const candidate = `${baseSlug}-${attempt}`
    if (!slugSet.has(candidate)) {
      return candidate
    }
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 6).toLowerCase()}`
}

export async function checkSkuUniqueness(
  supabase: ReturnType<typeof createClient>,
  ownerId: string,
  sku: string,
  excludeProductId?: string | null
) {
  let query = supabase
    .from('product_variants')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('sku', sku)
    .limit(1)

  if (excludeProductId) {
    query = query.neq('product_id', excludeProductId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data?.length ?? 0) === 0
}

export async function resolveUniqueSku(
  supabase: ReturnType<typeof createClient>,
  ownerId: string,
  baseSku: string,
  excludeProductId?: string | null
) {
  const isUnique = await checkSkuUniqueness(supabase, ownerId, baseSku, excludeProductId)
  if (isUnique) {
    return baseSku
  }

  for (let attempt = 2; attempt <= 50; attempt += 1) {
    const candidate = `${baseSku}-${attempt}`
    const candidateUnique = await checkSkuUniqueness(supabase, ownerId, candidate, excludeProductId)
    if (candidateUnique) {
      return candidate
    }
  }

  return `${baseSku}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
}

export function normalizeHex(value: string) {
  const cleaned = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase()
  return cleaned ? `#${cleaned}` : '#000000'
}

export function isValidHex(value: string) {
  return /^#[0-9A-F]{6}$/i.test(value)
}

export function parseOptionalNumber(value: string) {
  const normalized = value.replace(',', '.').trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatCurrency(value: number | null) {
  if (value == null) {
    return 'Preco nao informado'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function createSku(name: string, seed: string) {
  const base = slugify(name).replace(/-/g, '').toUpperCase().slice(0, 6) || 'PROD'
  return `${base}-${seed}`
}

export function createVariantSku(name: string, colorName: string, size: string, index: number) {
  const base = slugify(name).replace(/-/g, '').toUpperCase().slice(0, 5) || 'PROD'
  const color = slugify(colorName).replace(/-/g, '').toUpperCase().slice(0, 3) || 'COR'
  const variantSize = slugify(size).replace(/-/g, '').toUpperCase().slice(0, 3) || 'UNI'
  return `${base}-${color}-${variantSize}-${String(index + 1).padStart(2, '0')}`
}

export async function validateRemoteImageUrl(url: string): Promise<{ valid: boolean; contentType?: string; error?: string }> {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Use um link http ou https valido.' }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' as RequestMode,
      })

      clearTimeout(timeoutId)

      if (response.ok || response.type === 'opaque') {
        const contentType = response.headers.get('content-type') ?? ''
        if (response.type === 'opaque' || contentType.startsWith('image/')) {
          return { valid: true, contentType }
        }
        return { valid: false, error: 'A URL nao aponta para uma imagem (Content-Type invalido).' }
      }

      return { valid: false, error: `Servidor retornou status ${response.status}.` }
    } catch {
      clearTimeout(timeoutId)
      return { valid: false, error: 'Nao foi possivel verificar a URL da imagem.' }
    }
  } catch {
    return { valid: false, error: 'Informe uma URL valida para a imagem.' }
  }
}
