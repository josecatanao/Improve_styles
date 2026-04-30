import { redirect } from 'next/navigation'
import { getStoreCustomerSession } from '@/lib/customer-session'
import { WishlistClient } from './WishlistClient'

export default async function AccountFavoritosPage() {
  const session = await getStoreCustomerSession()

  if (!session) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  return <WishlistClient />
}
