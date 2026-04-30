import { createAdminClient } from '@/utils/supabase/admin'
import type { CustomerProfile, CustomerSummary } from '@/lib/customer-shared'

function isMissingTable(error: { code?: string } | null, tableCode = '42P01') {
  return error?.code === tableCode
}

export async function getCustomerProfiles(page = 1, limit = 20): Promise<{
  customers: CustomerProfile[]
  total: number
  summary: CustomerSummary
  setupRequired: boolean
  errorMessage: string | null
}> {
  let supabase

  try {
    supabase = createAdminClient()
  } catch (error) {
    return {
      customers: [],
      total: 0,
      summary: {
        total: 0,
        active: 0,
        inactive: 0,
        withWhatsapp: 0,
        withAddress: 0,
      },
      setupRequired: true,
      errorMessage: error instanceof Error ? error.message : 'Cliente administrativo indisponivel.',
    }
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { count, error: countError } = await supabase
    .from('customer_profiles')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (isMissingTable(error) || isMissingTable(countError)) {
    return {
      customers: [],
      total: 0,
      summary: {
        total: 0,
        active: 0,
        inactive: 0,
        withWhatsapp: 0,
        withAddress: 0,
      },
      setupRequired: true,
      errorMessage: null,
    }
  }

  if (error || !data) {
    return {
      customers: [],
      total: 0,
      summary: {
        total: 0,
        active: 0,
        inactive: 0,
        withWhatsapp: 0,
        withAddress: 0,
      },
      setupRequired: false,
      errorMessage: error?.message ?? 'Nao foi possivel carregar os clientes.',
    }
  }

  const customers = (data as CustomerProfile[]) ?? []

  return {
    customers,
    total: count ?? 0,
    summary: {
      total: count ?? 0,
      active: customers.filter((customer) => customer.status === 'active').length,
      inactive: customers.filter((customer) => customer.status === 'inactive').length,
      withWhatsapp: customers.filter((customer) => Boolean(customer.whatsapp?.trim())).length,
      withAddress: customers.filter((customer) => Boolean(customer.delivery_address?.trim())).length,
    },
    setupRequired: false,
    errorMessage: null,
  }
}
