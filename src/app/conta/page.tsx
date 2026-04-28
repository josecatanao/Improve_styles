import Link from 'next/link'
import { MapPin, Mail, Phone, ShoppingBag, UserRound } from 'lucide-react'
import { RecentOrdersPanel } from '@/components/store/RecentOrdersPanel'
import { StoreShell } from '@/components/store/StoreShell'
import { getStoreCustomerSession } from '@/lib/customer-session'
import { getStorefrontData } from '@/lib/products'
import { slugifyStoreValue } from '@/lib/storefront'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const [customerSession, storefront] = await Promise.all([getStoreCustomerSession(), getStorefrontData()])

  if (!customerSession) {
    redirect('/login?mode=customer&next=%2Fconta')
  }

  const categories = storefront.categoryHighlights.map((item) => ({
    label: item.label,
    href: `/loja/${slugifyStoreValue(item.label)}`,
  }))

  const profile = customerSession.profile
  const customerName = profile?.full_name?.trim() || customerSession.email || 'Minha conta'
  const customerPhotoUrl = profile?.photo_url?.trim() || null

  return (
    <StoreShell categories={categories}>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Area do cliente</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Minha conta</h1>
            <p className="mt-2 text-sm text-slate-500">
              Consulte seus dados de cadastro e mantenha a experiencia da loja consistente.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Voltar para a loja
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                {customerPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customerPhotoUrl} alt={customerName} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">{customerName}</h2>
              <p className="mt-1 text-sm text-slate-500">{customerSession.email}</p>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
                <p className="mt-1 text-sm font-medium text-slate-900">Conta ativa para compras</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Acesso</p>
                <p className="mt-1 text-sm font-medium text-slate-900">Login da loja separado do admin</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Dados cadastrais</h2>
                <p className="mt-1 text-sm text-slate-500">Informacoes usadas no contato e no fluxo de entrega.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="h-4 w-4" />
                  <p className="text-sm font-medium">Email</p>
                </div>
                <p className="mt-3 text-sm text-slate-900">{customerSession.email || 'Nao informado'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="h-4 w-4" />
                  <p className="text-sm font-medium">WhatsApp</p>
                </div>
                <p className="mt-3 text-sm text-slate-900">{profile?.whatsapp?.trim() || 'Nao informado'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <p className="text-sm font-medium">Endereco de entrega</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-900">
                  {profile?.delivery_address?.trim() || 'Nenhum endereco informado no cadastro.'}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Checkout e acompanhamento</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use o checkout para confirmar novos pedidos. Os pedidos confirmados ficam salvos neste navegador e aparecem logo abaixo.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="lg:col-span-2">
            <RecentOrdersPanel />
          </div>
        </div>
      </main>
    </StoreShell>
  )
}
