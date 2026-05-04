import 'server-only'

import { createClient } from '@/utils/supabase/server'
import { permissionOptions, type StaffPermission } from '@/lib/staff-shared'
import { getPermissionDeniedMessage } from '@/lib/permissions'

export async function getCurrentUserPermissions(): Promise<StaffPermission[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const accountType = user.user_metadata?.account_type

  if (accountType === 'admin') {
    return permissionOptions.map((p) => p.key)
  }

  if (accountType === 'staff') {
    const { data: staffData } = await supabase
      .from('staff_members')
      .select('permissions')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    return (staffData?.permissions as StaffPermission[]) ?? []
  }

  return []
}

export async function requirePermission(permission: StaffPermission): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error(getPermissionDeniedMessage(permission))
  }

  const accountType = user.user_metadata?.account_type

  if (accountType === 'admin') {
    return
  }

  if (accountType === 'staff') {
    const { data: staffData } = await supabase
      .from('staff_members')
      .select('permissions')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!staffData?.permissions?.includes(permission)) {
      throw new Error(getPermissionDeniedMessage(permission))
    }

    return
  }

  throw new Error(getPermissionDeniedMessage(permission))
}
