import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { normalizeStoreSettings } from '@/lib/store-settings'

const getCachedStoreSettings = unstable_cache(
  async () => {
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
  },
  ['store-branding'],
  {
    tags: ['store-branding'],
  }
)

export async function getPublicStoreSettings() {
  return getCachedStoreSettings()
}
