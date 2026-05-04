'use client'

import { createContext, useCallback, useContext } from 'react'
import { type StaffPermission } from '@/lib/staff-shared'
import { getPermissionDeniedMessage, hasPermission } from '@/lib/permissions'
import { useToast } from '@/components/ui/feedback-provider'

type PermissionsContextValue = {
  permissions: StaffPermission[]
  can: (permission: StaffPermission) => boolean
  guard: (permission: StaffPermission) => boolean
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: [],
  can: () => false,
  guard: () => false,
})

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: StaffPermission[]
  children: React.ReactNode
}) {
  const showToast = useToast()

  const can = useCallback(
    (permission: StaffPermission) => hasPermission(permissions, permission),
    [permissions]
  )

  const guard = useCallback(
    (permission: StaffPermission): boolean => {
      if (hasPermission(permissions, permission)) {
        return true
      }

      showToast({
        variant: 'error',
        title: 'Acao nao permitida',
        description: getPermissionDeniedMessage(permission),
      })

      return false
    },
    [permissions, showToast]
  )

  return (
    <PermissionsContext.Provider value={{ permissions, can, guard }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext)
}
