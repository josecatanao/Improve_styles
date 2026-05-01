import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { normalizeStoreSettings } from '@/lib/store-settings'

export const getPublicStoreSettings = cache(async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return normalizeStoreSettings(null)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data } = await supabase.from('store_settings').select('*').limit(1).maybeSingle()
  return normalizeStoreSettings(data)
})
