import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser, UserRole } from '../types'
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api'
import { decodeJwt, isTokenExpired } from '../lib/jwt'

// Backend Role.Name (French, admin-editable — see prisma/seed.ts) -> frontend
// UserRole (snake_case). Only the 4 seeded system roles map to a concrete
// UserRole; anything else (a custom role created later from Administration)
// falls back to 'employee' — the space it lands in is decided separately
// below (isHRSpace/isEmployeeSpace), not by this label.
const ROLE_NAME_TO_USER_ROLE: Record<string, UserRole> = {
  'Employé': 'employee',
  'Validateur': 'validator',
  'Admin RH': 'hr_admin',
  'Directeur RH': 'hr_director',
}

// Espace applicatif (routage /hr vs /employee) — décidé par le rôle, pas par
// les permissions individuelles (voir consigne : Directeur RH/Admin RH → hr,
// Validateur/Employé → employee).
const HR_SPACE_ROLES = new Set(['Directeur RH', 'Admin RH'])

interface BackendEmployee {
  Id: string
  FirstName: string
  LastName: string
  FullName: string
  Email: string
  OrganizationUnitId: string
}

interface BackendOrganizationUnit {
  Id: string
  Name: string
}

interface EffectivePermissionsResponse {
  roleName: string
  permissions: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const user        = ref<AuthUser | null>(null)
  const isLoggedIn  = ref(false)
  const isRestoring = ref(false)
  const permissions = ref<string[]>([])
  const roleName     = ref<string | null>(null)

  // ── Getters ──────────────────────────────────────────────────
  const role         = computed<UserRole | null>(() => user.value?.role ?? null)
  const isValidator  = computed(() => user.value?.role === 'validator')
  const isHRAdmin    = computed(() => user.value?.role === 'hr_admin')
  const isHRDirector = computed(() => user.value?.role === 'hr_director')
  // Espace applicatif uniquement — ne pas s'en servir pour gater une
  // fonctionnalité précise, voir hasPermission() ci-dessous pour ça.
  const isHRSpace       = computed(() => !!roleName.value && HR_SPACE_ROLES.has(roleName.value))
  const isEmployeeSpace = computed(() => !!roleName.value && !HR_SPACE_ROLES.has(roleName.value))

  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }
  function hasAnyPermission(codes: string[]): boolean {
    return codes.some((code) => permissions.value.includes(code))
  }

  async function buildAuthUser(employeeId: string, roleNameValue: string): Promise<AuthUser> {
    const { data: employee } = await api.get<BackendEmployee>(`/employees/${employeeId}`)

    let entityName: string | undefined
    try {
      const { data: unit } = await api.get<BackendOrganizationUnit>(
        `/organization-units/${employee.OrganizationUnitId}`,
      )
      entityName = unit.Name
    } catch {
      entityName = undefined
    }

    return {
      id:         employee.Id,
      name:       employee.FullName,
      initials:   (employee.FirstName.charAt(0) + employee.LastName.charAt(0)).toUpperCase(),
      role:       ROLE_NAME_TO_USER_ROLE[roleNameValue] ?? 'employee',
      email:      employee.Email,
      entityId:   employee.OrganizationUnitId,
      entityName,
    }
  }

  // Toujours relues depuis l'API (jamais figées dans le JWT) — voir backend
  // PermissionGuard : un changement de droit doit s'appliquer immédiatement.
  async function fetchPermissions(userId: string) {
    const { data } = await api.get<EffectivePermissionsResponse>(`/users/${userId}/permissions`)
    permissions.value = data.permissions
  }

  // ── Actions ──────────────────────────────────────────────────
  async function login(email: string, password: string) {
    const { data } = await api.post<{ accessToken: string }>('/auth/login', { email, password })
    setStoredToken(data.accessToken)
    const payload = decodeJwt(data.accessToken)
    roleName.value = payload.roleName
    user.value = await buildAuthUser(payload.employeeId, payload.roleName)
    await fetchPermissions(payload.sub)
    isLoggedIn.value = true
  }

  // Called once at app startup so a page refresh doesn't lose the session —
  // the JWT persists in localStorage, only the in-memory state is rebuilt.
  async function restoreSession() {
    const token = getStoredToken()
    if (!token) return

    const payload = decodeJwt(token)
    if (isTokenExpired(payload)) {
      clearStoredToken()
      return
    }

    isRestoring.value = true
    try {
      roleName.value = payload.roleName
      user.value = await buildAuthUser(payload.employeeId, payload.roleName)
      await fetchPermissions(payload.sub)
      isLoggedIn.value = true
    } catch {
      // Token valid but the employee/session/permissions data couldn't be
      // loaded (deleted employee, deactivated account, backend unreachable,
      // etc.) — treat as logged out.
      clearStoredToken()
      user.value = null
      roleName.value = null
      permissions.value = []
      isLoggedIn.value = false
    } finally {
      isRestoring.value = false
    }
  }

  function logout() {
    user.value       = null
    roleName.value   = null
    permissions.value = []
    isLoggedIn.value = false
    clearStoredToken()
  }

  return {
    user, isLoggedIn, isRestoring, role, roleName, permissions,
    isValidator, isHRAdmin, isHRDirector,
    isHRSpace, isEmployeeSpace,
    hasPermission, hasAnyPermission,
    login, logout, restoreSession,
  }
})
