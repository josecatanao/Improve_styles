'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('store_orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    throw new Error('Falha ao atualizar status do pedido.')
  }

  revalidatePath('/dashboard/pedidos')
  return { success: true }
}

export async function deleteOrder(orderId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('store_orders')
    .delete()
    .eq('id', orderId)

  if (error) {
    throw new Error('Falha ao apagar o pedido.')
  }

  revalidatePath('/dashboard/pedidos')
  return { success: true }
}
