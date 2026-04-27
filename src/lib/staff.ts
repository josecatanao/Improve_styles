import { createClient } from '@/utils/supabase/server'
import type { StaffMember, StaffSummary } from '@/lib/staff-shared'

export async function getStaffMembers(): Promise<{
  staff: StaffMember[]
  summary: StaffSummary
  setupRequired: boolean
  errorMessage: string | null
}> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('staff_members').select('*').order('created_at', { ascending: false })

  if (error?.code === '42P01') {
    return {
      staff: [],
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

  return {
    staff,
    summary: {
      total: staff.length,
      invited: staff.filter((member) => member.status === 'invited').length,
      active: staff.filter((member) => member.status === 'active').length,
      inactive: staff.filter((member) => member.status === 'inactive').length,
      admins: staff.filter((member) => member.role === 'admin').length,
    },
    setupRequired: false,
    errorMessage: null,
  }
}
