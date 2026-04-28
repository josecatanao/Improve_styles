import { createClient } from '@/utils/supabase/server'
import { ensureCustomerProfile } from '@/lib/customer-profile'
import type { CustomerProfile } from '@/lib/customer-shared'

export type StoreCustomerSession = {
  userId: string
  email: string | null
  profile: CustomerProfile | null
} | null

export async function getStoreCustomerSession(): Promise<StoreCustomerSession> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const profile = await ensureCustomerProfile(supabase, user)

  if (!profile) {
    return null
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile as CustomerProfile,
  }
}
