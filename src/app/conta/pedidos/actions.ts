'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function cancelOrderByCustomer(orderId: string) {
  if (!orderId) {
    throw new Error('Pedido não encontrado.')
  }

  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id

  if (!userId) {
    throw new Error('Você precisa estar logado para cancelar um pedido.')
  }

  const { data: order, error: orderError } = await supabase
    .from('store_orders')
    .select('id, status, customer_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error('Pedido não encontrado.')
  }

  if (order.customer_id !== userId) {
    throw new Error('Você não tem permissão para cancelar este pedido.')
  }

  if (order.status !== 'pending') {
    throw new Error('Apenas pedidos com status Pendente podem ser cancelados.')
  }

  const { error: updateError } = await supabase
    .from('store_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateError) {
    throw new Error('Falha ao cancelar o pedido: ' + updateError.message)
  }

  revalidatePath('/conta/pedidos')
  revalidatePath('/dashboard/pedidos')

  return { success: true }
}
