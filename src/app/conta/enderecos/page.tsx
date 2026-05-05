import { redirect } from 'next/navigation'
import { AddressBookForm } from '@/components/customers/AddressBookForm'
import { getCustomerAddresses } from '@/lib/customer-addresses'
import { getStoreCustomerSession } from '@/lib/customer-session'

export default async function AccountAddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const session = await getStoreCustomerSession()

  if (!session) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  const addresses = await getCustomerAddresses(session.userId)
  const params = await searchParams

  return <AddressBookForm initialAddresses={addresses} returnTo={params.returnTo ?? null} />
}
