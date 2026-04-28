import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { CustomerProfile } from '@/lib/customer-shared'

function getDisplayName(user: User) {
  const fullName = user.user_metadata.full_name
  return typeof fullName === 'string' && fullName.trim() ? fullName.trim() : 'Cliente'
}

function isExplicitAdmin(user: User) {
  return user.user_metadata.account_type === 'admin'
}

export async function ensureCustomerProfile(
  supabase: SupabaseClient,
  user: User
): Promise<CustomerProfile | null> {
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfileError) {
    throw new Error(existingProfileError.message)
  }

  if (existingProfile) {
    return existingProfile as CustomerProfile
  }

  if (isExplicitAdmin(user)) {
    return null
  }

  const payload = {
    id: user.id,
    email: user.email ?? '',
    full_name: getDisplayName(user),
    status: 'active',
    last_login_at: new Date().toISOString(),
  }

  const { data: createdProfile, error: upsertError } = await supabase
    .from('customer_profiles')
    .upsert(payload)
    .select('*')
    .single()

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  return createdProfile as CustomerProfile
}
