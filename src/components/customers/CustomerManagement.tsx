'use client'

import { Mail, MapPin, Phone, UserRound, Users, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteCustomer } from '@/app/dashboard/clientes/actions'
import type { CustomerProfile, CustomerSummary } from '@/lib/customer-shared'
import { Card, CardContent } from '@/components/ui/card'

function formatDate(value: string | null) {
  if (!value) {
    return 'Sem acesso recente'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

type CustomerManagementProps = {
  customers: CustomerProfile[]
  summary: CustomerSummary
}

export function CustomerManagement({ customers, summary }: CustomerManagementProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!window.confirm('Tem certeza que deseja excluir este cliente definitivamente? Esta acao nao pode ser desfeita.')) {
      return
    }

    try {
      setIsDeleting(id)
      await deleteCustomer(id)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao excluir o cliente.')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Clientes cadastrados', value: summary.total, helper: 'Base total da loja.', icon: Users },
          { label: 'Ativos', value: summary.active, helper: 'Contas prontas para compra.', icon: UserRound },
          { label: 'Com WhatsApp', value: summary.withWhatsapp, helper: 'Canal principal de contato.', icon: Phone },
          { label: 'Com endereco', value: summary.withAddress, helper: 'Dados prontos para entrega.', icon: MapPin },
        ].map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.label} className="border-0 bg-white ring-1 ring-slate-200">
              <CardContent className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Clientes da loja</h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe quem ja criou conta, com foco em contato e entrega.
          </p>
        </div>

        {customers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Nenhum cliente cadastrado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Contato</th>
                  <th className="px-6 py-3">Entrega</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Ultimo acesso</th>
                  <th className="px-6 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="align-top">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                          {customer.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customer.photo_url} alt={customer.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <UserRound className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{customer.full_name}</p>
                          <p className="mt-1 text-sm text-slate-500">{customer.email}</p>
                          <p className="mt-2 text-xs text-slate-400">
                            Cadastro em {formatDate(customer.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{customer.whatsapp?.trim() || 'Nao informado'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.delivery_address?.trim() ? (
                        <p className="max-w-sm leading-6">{customer.delivery_address}</p>
                      ) : (
                        <span className="text-slate-400">Nao informado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          customer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(customer.last_login_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(customer.id)}
                        disabled={isDeleting === customer.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Excluir cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
