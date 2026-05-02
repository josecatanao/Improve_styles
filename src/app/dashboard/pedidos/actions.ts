'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = createAdminClient()

  const { data: currentOrder, error: fetchError } = await supabase
    .from('store_orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (fetchError || !currentOrder) {
    throw new Error('Pedido nao encontrado.')
  }

  const oldStatus = currentOrder.status

  if (oldStatus === newStatus) {
    return { success: true, unchanged: true }
  }

  const { error } = await supabase
    .from('store_orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    throw new Error('Falha ao atualizar status do pedido.')
  }

  // Restore stock when an order is cancelled (from any non-cancelled state)
  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    await restoreOrderStock(supabase, orderId)
  }

  // Deduct stock when an order is reactivated from cancelled
  if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
    await deductOrderStock(supabase, orderId)
  }

  revalidatePath('/dashboard/pedidos')
  revalidatePath(`/dashboard/pedidos/${orderId}`)
  return { success: true }
}

export async function deleteOrder(orderId: string) {
  const supabase = createAdminClient()

  const { data: currentOrder, error: fetchError } = await supabase
    .from('store_orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (fetchError || !currentOrder) {
    throw new Error('Pedido nao encontrado.')
  }

  // If order is not cancelled, restore stock before deletion
  if (currentOrder.status !== 'cancelled') {
    await restoreOrderStock(supabase, orderId)
  }

  const { error } = await supabase
    .from('store_orders')
    .delete()
    .eq('id', orderId)

  if (error) {
    throw new Error('Falha ao apagar o pedido.')
  }

  revalidatePath('/dashboard/pedidos')
  revalidatePath(`/dashboard/pedidos/${orderId}`)
  return { success: true }
}

async function restoreOrderStock(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: orderItems } = await supabase
    .from('store_order_items')
    .select('product_id, color_hex, size, quantity')
    .eq('order_id', orderId)

  if (!orderItems) return

  for (const item of orderItems) {
    const { product_id: productId, color_hex: colorHex, size, quantity } = item

    if (colorHex && size) {
      const { data: variantData } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('product_id', productId)
        .eq('color_hex', colorHex)
        .eq('size', size)
        .maybeSingle()

      if (variantData) {
        await supabase
          .from('product_variants')
          .update({ stock: Number(variantData.stock) + quantity })
          .eq('product_id', productId)
          .eq('color_hex', colorHex)
          .eq('size', size)
      }
    }

    const { data: productData } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .maybeSingle()

    if (productData) {
      await supabase
        .from('products')
        .update({ stock: Number(productData.stock) + quantity })
        .eq('id', productId)
    }
  }
}

async function deductOrderStock(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: orderItems } = await supabase
    .from('store_order_items')
    .select('product_id, color_hex, size, quantity')
    .eq('order_id', orderId)

  if (!orderItems) return

  for (const item of orderItems) {
    const { product_id: productId, color_hex: colorHex, size, quantity } = item

    if (colorHex && size) {
      const { data: variantData } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('product_id', productId)
        .eq('color_hex', colorHex)
        .eq('size', size)
        .maybeSingle()

      if (variantData) {
        const newStock = Math.max(0, Number(variantData.stock) - quantity)
        await supabase
          .from('product_variants')
          .update({ stock: newStock })
          .eq('product_id', productId)
          .eq('color_hex', colorHex)
          .eq('size', size)
      }
    }

    const { data: productData } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .maybeSingle()

    if (productData) {
      const newStock = Math.max(0, Number(productData.stock) - quantity)
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId)
    }
  }
}
