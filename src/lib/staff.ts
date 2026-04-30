import { createClient } from '@/utils/supabase/server'
import type { StaffMember, StaffSummary } from '@/lib/staff-shared'

export async function getStaffMembers(page = 1, limit = 20): Promise<{
  staff: StaffMember[]
  total: number
  summary: StaffSummary
  setupRequired: boolean
  errorMessage: string | null
}> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { count, error: countError } = await supabase
    .from('staff_members')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error?.code === '42P01' || countError?.code === '42P01') {
    return {
      staff: [],
      total: 0,
      summary: {
        total: 0,
        invited: 0,
        active: 0,
        inactive: 0,
        admins: 0,
      },
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error || !data) {
    return {
      staff: [],
      total: 0,
      summary: {
        total: 0,
        invited: 0,
        active: 0,
        inactive: 0,
        admins: 0,
      },
      setupRequired: false,
      errorMessage: error?.message ?? 'Nao foi possivel carregar a equipe.',
    }
  }

  const staff = (data as StaffMember[]) ?? []
  const totalCount = count ?? 0

  return {
    staff,
    total: totalCount,
    summary: {
      total: totalCount,
      invited: staff.filter((member) => member.status === 'invited').length,
      active: staff.filter((member) => member.status === 'active').length,
      inactive: staff.filter((member) => member.status === 'inactive').length,
      admins: staff.filter((member) => member.role === 'admin').length,
    },
    setupRequired: false,
    errorMessage: null,
  }
}
