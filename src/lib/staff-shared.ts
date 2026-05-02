export const staffRoles = ['admin', 'manager', 'editor', 'viewer'] as const
export type StaffRole = (typeof staffRoles)[number]

export const staffStatuses = ['invited', 'active', 'inactive'] as const
export type StaffStatus = (typeof staffStatuses)[number]

export const permissionOptions = [
  { key: 'dashboard:view', label: 'Dashboard', description: 'Acompanhar indicadores gerais do painel.' },
  { key: 'products:view', label: 'Estoque', description: 'Visualizar produtos, estoque e status.' },
  { key: 'products:manage', label: 'Editar produtos', description: 'Cadastrar, editar e apagar produtos.' },
  { key: 'team:manage', label: 'Gerenciar equipe', description: 'Cadastrar funcionarios e editar permissoes.' },
  { key: 'settings:manage', label: 'Configuracoes', description: 'Alterar configuracoes administrativas.' },
] as const

export type StaffPermission = (typeof permissionOptions)[number]['key']

export type StaffMember = {
  id: string
  owner_id: string
  auth_user_id: string | null
  full_name: string
  email: string
  role: StaffRole
  permissions: StaffPermission[]
  status: StaffStatus
  notes: string | null
  invited_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type StaffSummary = {
  total: number
  invited: number
  active: number
  inactive: number
  admins: number
}

export function getRoleLabel(role: StaffRole) {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'manager':
      return 'Gerente'
    case 'editor':
      return 'Editor'
    default:
      return 'Visualizador'
  }
}

export function getStatusLabel(status: StaffStatus) {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'inactive':
      return 'Inativo'
    default:
      return 'Convidado'
  }
}

export function getStatusClasses(status: StaffStatus) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700'
    case 'inactive':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-amber-50 text-amber-700'
  }
}
