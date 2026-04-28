'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function deleteCustomer(id: string) {
  const supabase = createAdminClient()

  // First try to delete the auth user, which should cascade to the customer_profiles table
  // if the foreign key has ON DELETE CASCADE.
  const { error: authError } = await supabase.auth.admin.deleteUser(id)

  if (authError && authError.status !== 404) {
    // If the auth user couldn't be deleted for some reason (other than not found),
    // let's at least try to delete the profile directly.
    const { error: profileError } = await supabase.from('customer_profiles').delete().eq('id', id)
    if (profileError) {
      throw new Error(profileError.message || 'Falha ao excluir o cliente.')
    }
  } else if (authError && authError.status === 404) {
     const { error: profileError } = await supabase.from('customer_profiles').delete().eq('id', id)
     if (profileError) {
       throw new Error(profileError.message || 'Falha ao excluir o cliente.')
     }
  }

  revalidatePath('/dashboard/clientes')
}
