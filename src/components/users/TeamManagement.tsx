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
  sendInvite: true,
}

export function TeamManagement({ initialStaff, summary, inviteEnabled }: TeamManagementProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [staff] = useState(initialStaff)
  const [form, setForm] = useState<StaffFormState>(initialFormState)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setMessage(null)
    setError(null)

    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Informe nome e e-mail do funcionario.')
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
      setError(insertError?.message ?? 'Nao foi possivel cadastrar o funcionario.')
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
        setError(result.error ?? 'Funcionario criado, mas o convite nao foi enviado.')
        setIsCreating(false)
        refreshPage()
        return
      }
    }

    setForm(initialFormState)
    setMessage(
      form.sendInvite && inviteEnabled
        ? 'Funcionario cadastrado e convite enviado.'
        : 'Funcionario cadastrado com sucesso.'
    )
    setIsCreating(false)
    refreshPage()
  }

  async function updateStaffMember(
    staffId: string,
    payload: Partial<Pick<StaffMember, 'role' | 'status' | 'permissions'>>
  ) {
    setBusyId(staffId)
    setMessage(null)
    setError(null)

    const { error: updateError } = await supabase.from('staff_members').update(payload).eq('id', staffId)

    if (updateError) {
      setBusyId(null)
      setError(updateError.message)
      return
    }

    setBusyId(null)
    setMessage('Equipe atualizada com sucesso.')
    refreshPage()
  }

  async function handleDelete(staffId: string, fullName: string) {
    const confirmed = window.confirm(`Deseja remover ${fullName} da equipe?`)
    if (!confirmed) {
      return
    }

    setBusyId(staffId)
    setMessage(null)
    setError(null)

    const { error: deleteError } = await supabase.from('staff_members').delete().eq('id', staffId)

    if (deleteError) {
      setBusyId(null)
      setError(deleteError.message)
      return
    }

    setBusyId(null)
    setMessage('Funcionario removido da equipe.')
    refreshPage()
  }

  async function handleResendInvite(member: StaffMember) {
    setBusyId(member.id)
    setMessage(null)
    setError(null)

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
      setError(result.error ?? 'Nao foi possivel reenviar o convite.')
      return
    }

    setBusyId(null)
    setMessage('Convite reenviado com sucesso.')
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

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card className="border-0 bg-white ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle>Cadastrar funcionario</CardTitle>
            <CardDescription>
              Crie a equipe interna e defina exatamente o que cada pessoa pode acessar no painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form className="space-y-5" onSubmit={handleCreateStaff}>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
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

                <div className="space-y-2">
                  <Label htmlFor="staff-notes">Observacoes</Label>
                  <textarea
                    id="staff-notes"
                    value={form.notes}
                    onChange={(event) => updateForm('notes', event.target.value)}
                    placeholder="Observacoes internas sobre este colaborador."
                    className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Permissoes</Label>
                  <p className="mt-1 text-sm text-slate-500">Escolha os modulos que esse funcionario pode acessar.</p>
                </div>
                <div className="space-y-3">
                  {permissionOptions.map((permission) => {
                    const checked = form.permissions.includes(permission.key)
                    return (
                      <label
                        key={permission.key}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
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
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.sendInvite}
                  onChange={(event) => updateForm('sendInvite', event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Enviar convite por e-mail</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {inviteEnabled
                      ? 'Usa o Supabase Auth Admin para convidar o funcionario a acessar o painel.'
                      : 'Ative SUPABASE_SERVICE_ROLE_KEY para habilitar envio automatico de convites.'}
                  </p>
                </div>
              </label>

              <Button type="submit" size="lg" className="rounded-xl" disabled={isCreating}>
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
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle>Equipe cadastrada</CardTitle>
            <CardDescription>Atualize papel, status, permissoes e convites sem sair desta tela.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {staff.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                Nenhum funcionario cadastrado ainda.
              </div>
            ) : (
              staff.map((member) => {
                const isBusy = busyId === member.id
                return (
                  <div key={member.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">{member.full_name}</p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(member.status)}`}
                          >
                            {getStatusLabel(member.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {member.permissions.map((permission) => (
                            <span
                              key={`${member.id}-${permission}`}
                              className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[180px_180px]">
                        <select
                          value={member.role}
                          disabled={isBusy}
                          onChange={(event) =>
                            updateStaffMember(member.id, { role: event.target.value as StaffRole })
                          }
                          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                          {staffRoles.map((role) => (
                            <option key={role} value={role}>
                              {getRoleLabel(role)}
                            </option>
                          ))}
                        </select>
                        <select
                          value={member.status}
                          disabled={isBusy}
                          onChange={(event) =>
                            updateStaffMember(member.id, { status: event.target.value as StaffStatus })
                          }
                          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                          {staffStatuses.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {permissionOptions.map((permission) => {
                        const checked = member.permissions.includes(permission.key)
                        return (
                          <label
                            key={`${member.id}-${permission.key}`}
                            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
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

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
