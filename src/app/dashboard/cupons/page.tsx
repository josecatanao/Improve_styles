import { CouponManagement } from '@/components/coupons/CouponManagement'
import { getManagedCoupons } from '@/lib/store-coupons'

export default async function CouponManagementPage() {
  const { coupons, setupRequired, errorMessage } = await getManagedCoupons()

  return (
    <div className="space-y-6">
      {setupRequired ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Configuracao necessaria</h2>
          <p className="mt-2 text-sm text-amber-800">
            Execute o script SQL <code>supabase/09_coupons.sql</code> no seu Supabase para habilitar a central de cupons.
          </p>
        </section>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMessage}</div>
      ) : (
        <CouponManagement initialCoupons={coupons} />
      )}
    </div>
  )
}
