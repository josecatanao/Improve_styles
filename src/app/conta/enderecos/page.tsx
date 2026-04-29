import { redirect } from 'next/navigation'
import { AddressBookForm } from '@/components/customers/AddressBookForm'
import { getAccountProfile } from '@/lib/account'
import { getStoreCustomerSession } from '@/lib/customer-session'

export default async function AccountAddressesPage() {
  const session = await getStoreCustomerSession()

  if (!session) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  const profile = await getAccountProfile(session.userId)

  return <AddressBookForm initialProfile={profile} />
}
