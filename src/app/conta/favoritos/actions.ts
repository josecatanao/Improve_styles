'use server'

import { createClient } from '@/utils/supabase/server'
import type { ProductListItem } from '@/lib/product-shared'

export async function getProductsByIds(ids: string[]): Promise<ProductListItem[]> {
  if (!ids.length) return []

  const supabase = await createClient()

  const { data: products } = await supabase
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
    .in('id', ids)
    .eq('status', 'active')
    .eq('is_active', true)

  return (products as ProductListItem[] | null) || []
}
