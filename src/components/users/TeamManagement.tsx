'use client'

import { startTransition, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, Mail, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  getRoleLabel,
  getStatusClasses,
  getStatusLabel,
  permissionOptions,
  staffRoles,
  staffStatuses,
  type StaffMember,
  type StaffPermission,
  type StaffRole,
  type StaffStatus,
  type StaffSummary,
} from '@/lib/staff-shared'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TeamManagementProps = {
  initialStaff: StaffMember[]
  summary: StaffSummary
  inviteEnabled: boolean
}

type StaffFormState = {
  fullName: string
  email: string
  role: StaffRole
  permissions: StaffPermission[]
  notes: string
  sendInvite: boolean
}

const initialFormState: StaffFormState = {
  fullName: '',
  email: '',
  role: 'viewer',
  permissions: ['dashboard:view', 'products:view'],
  notes: '',
  sendInvite: false,
}

export function TeamManagement({ initialStaff, summary, inviteEnabled }: TeamManagementProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const showToast = useToast()
  const confirm = useConfirm()
  const [staff] = useState(initialStaff)
  const [form, setForm] = useState<StaffFormState>(initialFormState)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  function updateForm<K extends keyof StaffFormState>(key: K, value: StaffFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function togglePermission(permission: StaffPermission) {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }))
  }

  function refreshPage() {
    startTransition(() => {
      router.refresh()
    })
  }

  async function handleCreateStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)

    if (!form.fullName.trim() || !form.email.trim()) {
      showToast({
        variant: 'error',
        title: 'Dados incompletos',
        description: 'Informe nome e e-mail do funcionario.',
      })
      setIsCreating(false)
      return
    }

    const payload = {
      full_name: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      permissions: form.permissions,
      notes: form.notes.trim() || null,
      status: form.sendInvite && inviteEnabled ? 'invited' : 'inactive',
    }

    const { data: createdStaff, error: insertError } = await supabase
      .from('staff_members')
      .insert(payload)
      .select('id')
      .single()

    if (insertError || !createdStaff) {
      showToast({
        variant: 'error',
        title: 'Falha ao cadastrar funcionario',
        description: insertError?.message ?? 'Nao foi possivel cadastrar o funcionario.',
      })
      setIsCreating(false)
      return
    }

    if (form.sendInvite && inviteEnabled) {
      const response = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: createdStaff.id,
          email: payload.email,
          fullName: payload.full_name,
          role: payload.role,
        }),
      })

      if (!response.ok) {
        const result = (await response.json()) as { error?: string }
        showToast({
          variant: 'error',
          title: 'Convite nao enviado',
          description: result.error ?? 'Funcionario criado, mas o convite nao foi enviado.',
        })
        setIsCreating(false)
        refreshPage()
        return
      }
    }

    setForm(initialFormState)
    showToast({
      variant: 'success',
      title: form.sendInvite && inviteEnabled ? 'Funcionario cadastrado e convite enviado' : 'Funcionario cadastrado',
    })
    setIsCreating(false)
    refreshPage()
  }

  async function updateStaffMember(
    staffId: string,
    payload: Partial<Pick<StaffMember, 'role' | 'status' | 'permissions'>>
  ) {
    setBusyId(staffId)

    const { error: updateError } = await supabase.from('staff_members').update(payload).eq('id', staffId)

    if (updateError) {
      setBusyId(null)
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar equipe',
        description: updateError.message,
      })
      return
    }

    setBusyId(null)
    showToast({
      variant: 'success',
      title: 'Equipe atualizada',
    })
    refreshPage()
  }

  async function handleDelete(staffId: string, fullName: string) {
    const confirmed = await confirm({
      title: 'Remover funcionario?',
      description: `${fullName} perdera acesso ao painel da loja.`,
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })
    if (!confirmed) {
      return
    }

    setBusyId(staffId)

    const { error: deleteError } = await supabase.from('staff_members').delete().eq('id', staffId)

    if (deleteError) {
      setBusyId(null)
      showToast({
        variant: 'error',
        title: 'Falha ao remover funcionario',
        description: deleteError.message,
      })
      return
    }

    setBusyId(null)
    showToast({
      variant: 'success',
      title: 'Funcionario removido da equipe',
    })
    refreshPage()
  }

  async function handleResendInvite(member: StaffMember) {
    setBusyId(member.id)

    const response = await fetch('/api/staff/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId: member.id,
        email: member.email,
        fullName: member.full_name,
        role: member.role,
      }),
    })

    if (!response.ok) {
      const result = (await response.json()) as { error?: string }
      setBusyId(null)
      showToast({
        variant: 'error',
        title: 'Falha ao reenviar convite',
        description: result.error ?? 'Nao foi possivel reenviar o convite.',
      })
      return
    }

    setBusyId(null)
    showToast({
      variant: 'success',
      title: 'Convite reenviado',
    })
    refreshPage()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Equipe total', value: summary.total, helper: 'Funcionarios cadastrados.', icon: Users },
          { label: 'Ativos', value: summary.active, helper: 'Acesso liberado ao painel.', icon: ShieldCheck },
          { label: 'Convites pendentes', value: summary.invited, helper: 'Ainda aguardando aceite.', icon: Mail },
          { label: 'Administradores', value: summary.admins, helper: 'Com controle amplo do sistema.', icon: UserPlus },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="border-0 bg-white ring-1 ring-slate-200">
              <CardContent className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Card className="border-0 bg-white ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Cadastrar funcionario</CardTitle>
          <CardDescription>
            Crie a equipe interna com uma estrutura mais clara: identidade, acesso e observacoes operacionais.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <form className="space-y-8" onSubmit={handleCreateStaff}>
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Identificacao</h3>
                <p className="mt-1 text-sm text-slate-500">Dados principais do funcionario dentro da operacao.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
                <div className="space-y-2">
                  <Label htmlFor="staff-full-name">Nome completo</Label>
                  <Input
                    id="staff-full-name"
                    value={form.fullName}
                    onChange={(event) => updateForm('fullName', event.target.value)}
                    placeholder="Ex.: Maria Souza"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-email">E-mail</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateForm('email', event.target.value)}
                    placeholder="maria@empresa.com"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-role">Papel</Label>
                  <select
                    id="staff-role"
                    value={form.role}
                    onChange={(event) => updateForm('role', event.target.value as StaffRole)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {staffRoles.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Permissoes</h3>
                <p className="mt-1 text-sm text-slate-500">Defina o que essa pessoa pode acessar e operar no painel.</p>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {permissionOptions.map((permission) => {
                  const checked = form.permissions.includes(permission.key)
                  return (
                    <label
                      key={permission.key}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-colors hover:border-slate-300 hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(permission.key)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{permission.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{permission.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Operacao</h3>
                <p className="mt-1 text-sm text-slate-500">Contexto interno para orientar a operacao da equipe.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-notes">Observacoes</Label>
                <textarea
                  id="staff-notes"
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                  placeholder="Ex.: responsavel por estoque, cadastro e revisao de catalogo."
                  className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </section>

            <div className="flex justify-end">
              <Button type="submit" size="lg" className="rounded-xl px-5" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Cadastrar funcionario
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Equipe cadastrada</CardTitle>
          <CardDescription>Visualize a equipe de forma mais clara e ajuste acesso sem poluir a leitura.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {staff.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              Nenhum funcionario cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-5">
              {staff.map((member) => {
                const isBusy = busyId === member.id
                return (
                  <div key={member.id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-5 py-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-900">{member.full_name}</p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(member.status)}`}
                          >
                            {getStatusLabel(member.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:w-[420px]">
                        <div className="space-y-2">
                          <Label>Papel</Label>
                          <select
                            value={member.role}
                            disabled={isBusy}
                            onChange={(event) =>
                              updateStaffMember(member.id, { role: event.target.value as StaffRole })
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          >
                            {staffRoles.map((role) => (
                              <option key={role} value={role}>
                                {getRoleLabel(role)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select
                            value={member.status}
                            disabled={isBusy}
                            onChange={(event) =>
                              updateStaffMember(member.id, { status: event.target.value as StaffStatus })
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          >
                            {staffStatuses.map((status) => (
                              <option key={status} value={status}>
                                {getStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 px-5 py-5">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Permissoes liberadas</p>
                          <p className="mt-1 text-sm text-slate-500">Ative ou remova os acessos conforme a funcao da pessoa.</p>
                        </div>
                        <div className="grid gap-3 xl:grid-cols-2">
                          {permissionOptions.map((permission) => {
                            const checked = member.permissions.includes(permission.key)
                            return (
                              <label
                                key={`${member.id}-${permission.key}`}
                                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-slate-300 hover:bg-white"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isBusy}
                                  onChange={() =>
                                    updateStaffMember(member.id, {
                                      permissions: checked
                                        ? member.permissions.filter((item) => item !== permission.key)
                                        : [...member.permissions, permission.key],
                                    })
                                  }
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{permission.label}</p>
                                  <p className="mt-1 text-xs text-slate-500">{permission.description}</p>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        {inviteEnabled ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl bg-white"
                            disabled={isBusy}
                            onClick={() => handleResendInvite(member)}
                          >
                            {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            Reenviar convite
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="destructive"
                          className="rounded-xl"
                          disabled={isBusy}
                          onClick={() => handleDelete(member.id, member.full_name)}
                        >
                          {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
