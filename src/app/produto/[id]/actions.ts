'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitProductReview(productId: string, rating: number, comment: string) {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) {
    throw new Error('Voce precisa estar logado para avaliar um produto.')
  }

  // Check if user already reviewed
  const { data: existingReview } = await supabase
    .from('product_reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('customer_id', authData.user.id)
    .single()

  if (existingReview) {
    throw new Error('Voce ja avaliou este produto. Obrigado!')
  }

  const { error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    customer_id: authData.user.id,
    rating,
    comment: comment.trim() || null,
  })

  if (error) {
    throw new Error('Nao foi possivel salvar sua avaliacao.')
  }

  revalidatePath(`/produto/${productId}`)
  return { success: true }
}
