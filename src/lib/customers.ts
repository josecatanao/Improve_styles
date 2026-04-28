import { createAdminClient } from '@/utils/supabase/admin'
import type { CustomerProfile, CustomerSummary } from '@/lib/customer-shared'

function isMissingTable(error: { code?: string } | null, tableCode = '42P01') {
  return error?.code === tableCode
}

export async function getCustomerProfiles(): Promise<{
  customers: CustomerProfile[]
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

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (isMissingTable(error)) {
    return {
      customers: [],
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
    summary: {
      total: customers.length,
      active: customers.filter((customer) => customer.status === 'active').length,
      inactive: customers.filter((customer) => customer.status === 'inactive').length,
      withWhatsapp: customers.filter((customer) => Boolean(customer.whatsapp?.trim())).length,
      withAddress: customers.filter((customer) => Boolean(customer.delivery_address?.trim())).length,
    },
    setupRequired: false,
    errorMessage: null,
  }
}
