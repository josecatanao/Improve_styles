import { type StaffPermission } from '@/lib/staff-shared'

const PERMISSION_DENIED_MESSAGES: Record<StaffPermission, string> = {
  'dashboard:view': 'Voce nao tem permissao para acessar o dashboard.',
  'products:view': 'Voce nao tem permissao para visualizar produtos.',
  'products:manage': 'Voce nao tem permissao para gerenciar produtos.',
  'team:manage': 'Voce nao tem permissao para gerenciar a equipe.',
  'settings:manage': 'Voce nao tem permissao para alterar configuracoes.',
}

export function getPermissionDeniedMessage(permission: StaffPermission): string {
  return PERMISSION_DENIED_MESSAGES[permission] ?? 'Voce nao tem permissao para realizar esta acao.'
}

export function hasPermission(
  userPermissions: StaffPermission[],
  required: StaffPermission
): boolean {
  return userPermissions.includes(required)
}

const RLS_ERROR_PATTERNS = [
  /row-level security policy/i,
  /violates row-level/i,
  /policy.*for table/i,
  /USING expression/i,
]

export function translateError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message ?? ''

    for (const pattern of RLS_ERROR_PATTERNS) {
      if (pattern.test(message)) {
        return 'Voce nao tem permissao para realizar esta operacao. ' +
          'Seu perfil de acesso nao permite modificar esses dados.'
      }
    }

    return message
  }

  return fallback
}
