import { redirect } from 'next/navigation'
import { AddressBookForm } from '@/components/customers/AddressBookForm'
import { getCustomerAddresses } from '@/lib/customer-addresses'
import { getStoreCustomerSession } from '@/lib/customer-session'

export default async function AccountAddressesPage() {
  const session = await getStoreCustomerSession()

  if (!session) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  const addresses = await getCustomerAddresses(session.userId)

  return <AddressBookForm initialAddresses={addresses} />
}
