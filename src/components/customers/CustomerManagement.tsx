'use client'

import { Mail, MapPin, Phone, UserRound, Users, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteCustomer } from '@/app/dashboard/clientes/actions'
import type { CustomerProfile, CustomerSummary } from '@/lib/customer-shared'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'
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
  const showToast = useToast()
  const confirm = useConfirm()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'Excluir cliente?',
      description: 'Essa exclusão é definitiva e não pode ser desfeita.',
      confirmLabel: 'Excluir cliente',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(id)
      await deleteCustomer(id)
      showToast({
        variant: 'success',
        title: 'Cliente excluído',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao excluir cliente',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      })
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
          { label: 'Com endereço', value: summary.withAddress, helper: 'Dados prontos para entrega.', icon: MapPin },
        ].map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.label} className="border-0 bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <CardContent className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                  <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.helper}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Clientes da loja</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Acompanhe quem já criou conta, com foco em contato e entrega.
          </p>
        </div>

        {customers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum cliente cadastrado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950/60">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <th scope="col" className="px-6 py-3 w-[240px]">Cliente</th>
                  <th scope="col" className="px-6 py-3 w-[210px]">Contato</th>
                  <th scope="col" className="px-6 py-3 w-[200px]">Entrega</th>
                  <th scope="col" className="px-6 py-3 w-[90px]">Status</th>
                  <th scope="col" className="px-6 py-3 w-[130px]">Último acesso</th>
                  <th scope="col" className="px-6 py-3 text-right w-[60px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((customer) => (
                  <tr key={customer.id} className="align-top h-16">
                    <td className="px-6 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                          {customer.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customer.photo_url} alt={customer.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <UserRound className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{customer.full_name}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{customer.email}</p>
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            Cadastro em {formatDate(customer.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span className="truncate">{customer.whatsapp?.trim() || 'Não informado'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {customer.delivery_address?.trim() ? (
                        <span
                          className="block max-w-[200px] truncate cursor-default"
                          title={customer.delivery_address}
                        >
                          {customer.delivery_address}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Não informado</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                          customer.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(customer.last_login_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(customer.id)}
                        disabled={isDeleting === customer.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30"
                        aria-label="Excluir cliente"
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
