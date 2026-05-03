import { CouponManagement } from '@/components/coupons/CouponManagement'
import { ProductWorkspaceHeader } from '@/components/products/ProductWorkspaceHeader'
import { getManagedCoupons } from '@/lib/store-coupons.server'

export default async function CouponManagementPage() {
  const { coupons, setupRequired, errorMessage } = await getManagedCoupons()

  return (
    <div className="space-y-6">
      <ProductWorkspaceHeader
        title="Cupons"
        description="Crie e gerencie cupons de desconto para campanhas promocionais."
      />

      {setupRequired ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Configuracao necessaria</h2>
          <p className="mt-2 text-sm text-amber-800">
            Execute os scripts SQL de cupons em <code>supabase/09_coupons.sql</code>, <code>supabase/12_coupon_enhancements.sql</code> e <code>supabase/13_coupon_claim.sql</code> no seu Supabase para habilitar a central de cupons.
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
