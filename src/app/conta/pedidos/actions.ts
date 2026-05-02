'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

const CANCELABLE_STATUSES = ['pending', 'processing']

export async function cancelOrderByCustomer(orderId: string) {
  if (!orderId) {
    throw new Error('Pedido nao encontrado.')
  }

  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id

  if (!userId) {
    throw new Error('Voce precisa estar logado para cancelar um pedido.')
  }

  const { data: order, error: orderError } = await supabase
    .from('store_orders')
    .select('id, status, customer_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error('Pedido nao encontrado.')
  }

  if (order.customer_id !== userId) {
    throw new Error('Voce nao tem permissao para cancelar este pedido.')
  }

  if (!CANCELABLE_STATUSES.includes(order.status)) {
    throw new Error('Esse pedido nao pode mais ser cancelado. Para cancelar, entre em contato com a loja.')
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from('store_order_items')
    .select('product_id, color_hex, size, quantity')
    .eq('order_id', orderId)

  if (itemsError || !orderItems) {
    throw new Error('Falha ao recuperar os itens do pedido.')
  }

  const { error: updateError } = await supabase
    .from('store_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateError) {
    throw new Error('Falha ao cancelar o pedido: ' + updateError.message)
  }

  const adminSupabase = createAdminClient()

  for (const item of orderItems) {
    const { product_id: productId, color_hex: colorHex, size, quantity } = item

    if (colorHex && size) {
      const { data: variantData } = await adminSupabase
        .from('product_variants')
        .select('stock')
        .eq('product_id', productId)
        .eq('color_hex', colorHex)
        .eq('size', size)
        .maybeSingle()

      if (variantData) {
        await adminSupabase
          .from('product_variants')
          .update({ stock: Number(variantData.stock) + quantity })
          .eq('product_id', productId)
          .eq('color_hex', colorHex)
          .eq('size', size)
      }
    }

    const { data: productData } = await adminSupabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .maybeSingle()

    if (productData) {
      await adminSupabase
        .from('products')
        .update({ stock: Number(productData.stock) + quantity })
        .eq('id', productId)
    }
  }

  revalidatePath('/conta/pedidos')
  revalidatePath('/dashboard/pedidos')

  return { success: true }
}
