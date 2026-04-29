import { getStoreCustomerSession } from '@/lib/customer-session'
import { getAccountProfile } from '@/lib/account'
import { PersonalDataForm } from '@/components/customers/PersonalDataForm'
import { redirect } from 'next/navigation'

export default async function AccountDataPage() {
  const session = await getStoreCustomerSession()

  if (!session) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  const profile = await getAccountProfile(session.userId)

  return <PersonalDataForm initialProfile={profile} email={session.email ?? profile?.email ?? ''} />
}
