import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { requirePermission } from '@/lib/permissions-server'
import type { StaffRole, StaffPermission } from '@/lib/staff-shared'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CreateStaffPayload = {
  fullName: string
  email: string
  password: string
  role: StaffRole
  permissions: StaffPermission[]
  notes: string | null
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return Response.json({ error: 'Usuario nao autenticado.' }, { status: 401 })
  }

  try {
    await requirePermission('team:manage')
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 403 })
  }

  const body = (await request.json()) as Partial<CreateStaffPayload>

  if (!body.fullName?.trim() || !body.email?.trim() || !body.password?.trim() || !body.role) {
    return Response.json({ error: 'Preencha todos os campos obrigatorios.' }, { status: 400 })
  }

  const email = body.email.trim().toLowerCase()
  if (!EMAIL_REGEX.test(email)) {
    return Response.json({ error: 'Formato de e-mail invalido.' }, { status: 400 })
  }

  const password = body.password.trim()
  if (password.length < 6) {
    return Response.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const { data: existingStaff } = await supabase
    .from('staff_members')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingStaff) {
    return Response.json({ error: 'Ja existe um funcionario cadastrado com este e-mail.' }, { status: 409 })
  }

  const adminClient = createAdminClient()

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      account_type: 'staff',
      full_name: body.fullName.trim(),
    },
  })

  if (createError) {
    if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
      return Response.json({ error: 'Ja existe um usuario com este e-mail.' }, { status: 409 })
    }
    return Response.json({ error: createError.message }, { status: 400 })
  }

  if (!newUser.user?.id) {
    return Response.json({ error: 'Falha ao criar usuario.' }, { status: 500 })
  }

  const { error: staffError } = await supabase
    .from('staff_members')
    .insert({
      owner_id: user.id,
      auth_user_id: newUser.user.id,
      full_name: body.fullName.trim(),
      email,
      role: body.role,
      permissions: body.permissions ?? [],
      notes: body.notes?.trim() || null,
      status: 'active',
    })

  if (staffError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return Response.json({ error: staffError.message }, { status: 400 })
  }

  return Response.json({ success: true, userId: newUser.user.id })
}
