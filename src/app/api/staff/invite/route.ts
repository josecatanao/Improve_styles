import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import type { StaffRole, StaffStatus } from '@/lib/staff-shared'

type InvitePayload = {
  staffId: string
  email: string
  fullName: string
  role: StaffRole
}

export async function POST(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return Response.json(
      { error: 'Configure SUPABASE_SERVICE_ROLE_KEY para enviar convites por e-mail.' },
      { status: 501 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return Response.json({ error: 'Usuario nao autenticado.' }, { status: 401 })
  }

  const body = (await request.json()) as Partial<InvitePayload>
  if (!body.staffId || !body.email || !body.fullName || !body.role) {
    return Response.json({ error: 'Dados incompletos para convite.' }, { status: 400 })
  }

  const { data: staffMember, error: staffError } = await supabase
    .from('staff_members')
    .select('id, owner_id, email')
    .eq('id', body.staffId)
    .single()

  if (staffError || !staffMember || staffMember.owner_id !== user.id) {
    return Response.json({ error: 'Funcionario invalido para convite.' }, { status: 403 })
  }

  const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const origin = request.headers.get('origin')
  const redirectTo = origin ? `${origin}/login` : undefined

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(body.email, {
    data: {
      full_name: body.fullName,
      staff_role: body.role,
    },
    redirectTo,
  })

  if (inviteError) {
    return Response.json({ error: inviteError.message }, { status: 400 })
  }

  const nextStatus: StaffStatus = 'invited'
  const { error: updateError } = await supabase
    .from('staff_members')
    .update({
      auth_user_id: inviteData.user?.id ?? null,
      invited_at: new Date().toISOString(),
      status: nextStatus,
    })
    .eq('id', body.staffId)

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 400 })
  }

  return Response.json({ success: true })
}
