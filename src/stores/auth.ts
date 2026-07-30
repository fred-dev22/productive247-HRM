import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser, UserRole } from '../types'
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api'
import { decodeJwt, isTokenExpired } from '../lib/jwt'

// Backend EmployeeCategory.Name (French, librement modifiable/ajoutable par
// un Directeur RH — voir decision du 29/07, "role et categorie c'est la meme
// chose") -> frontend UserRole (snake_case), pour l'affichage uniquement.
// Approximatif dès qu'une catégorie personnalisée est créée ; sans
// conséquence, ça ne sert qu'à choisir une icône/libellé, jamais à décider
// des droits (voir hasPermission) ni de l'espace applicatif (voir isHRSpace
// ci-dessous, qui ne dépend plus du nom de la catégorie).
const CATEGORY_NAME_TO_USER_ROLE: Record<string, UserRole> = {
  'Employé': 'employee',
  'Validateur': 'validator',
  'Cadre supérieur': 'validator',
  'Manager': 'validator',
  'Technicien': 'employee',
  'Admin RH': 'hr_admin',
  'Directeur RH': 'hr_director',
}

// Espace applicatif (routage /hr vs /employee) — décidé par une permission
// réelle, jamais par le NOM de la catégorie : contrairement à l'ancien Role
// (4 rôles système protégés, IsSystem=true), une EmployeeCategory est
// librement renommable/supprimable par un Directeur RH (voir decision du
// 29/07) — un matching par nom casserait silencieusement le routage au
// premier renommage. EMPLOYE_VOIR_TOUT sert de marqueur "fonction RH" :
// seules les catégories Admin RH / Directeur RH l'accordent par défaut.
const HR_SPACE_PERMISSION = 'EMPLOYE_VOIR_TOUT'

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
  categoryName: string
  permissions: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const user        = ref<AuthUser | null>(null)
  const isLoggedIn  = ref(false)
  const isRestoring = ref(false)
  const permissions = ref<string[]>([])
  const categoryName = ref<string | null>(null)
  const mustChangePassword = ref(false)

  // ── Getters ──────────────────────────────────────────────────
  const role         = computed<UserRole | null>(() => user.value?.role ?? null)
  const isValidator  = computed(() => user.value?.role === 'validator')
  const isHRAdmin    = computed(() => user.value?.role === 'hr_admin')
  const isHRDirector = computed(() => user.value?.role === 'hr_director')
  // Espace applicatif uniquement — ne pas s'en servir pour gater une
  // fonctionnalité précise, voir hasPermission() ci-dessous pour ça.
  const isHRSpace       = computed(() => hasPermission(HR_SPACE_PERMISSION))
  const isEmployeeSpace = computed(() => !isHRSpace.value)

  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }
  function hasAnyPermission(codes: string[]): boolean {
    return codes.some((code) => permissions.value.includes(code))
  }

  async function buildAuthUser(employeeId: string, categoryNameValue: string): Promise<AuthUser> {
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
      role:       CATEGORY_NAME_TO_USER_ROLE[categoryNameValue] ?? 'employee',
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
    categoryName.value = payload.categoryName
    mustChangePassword.value = payload.mustChangePassword
    await fetchPermissions(payload.sub)
    user.value = await buildAuthUser(payload.employeeId, payload.categoryName)
    isLoggedIn.value = true
  }

  // PATCH /auth/change-password renvoie un nouveau token (mustChangePassword
  // à false) — le vieux token en localStorage garderait sinon l'ancien flag
  // jusqu'à expiration.
  async function changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.patch<{ accessToken: string }>('/auth/change-password', {
      currentPassword, newPassword,
    })
    setStoredToken(data.accessToken)
    mustChangePassword.value = false
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
      categoryName.value = payload.categoryName
      mustChangePassword.value = payload.mustChangePassword
      await fetchPermissions(payload.sub)
      user.value = await buildAuthUser(payload.employeeId, payload.categoryName)
      isLoggedIn.value = true
    } catch {
      // Token valid but the employee/session/permissions data couldn't be
      // loaded (deleted employee, deactivated account, backend unreachable,
      // etc.) — treat as logged out.
      clearStoredToken()
      user.value = null
      categoryName.value = null
      permissions.value = []
      isLoggedIn.value = false
    } finally {
      isRestoring.value = false
    }
  }

  function logout() {
    user.value       = null
    categoryName.value = null
    permissions.value = []
    isLoggedIn.value = false
    mustChangePassword.value = false
    clearStoredToken()
  }

  return {
    user, isLoggedIn, isRestoring, role, categoryName, permissions, mustChangePassword,
    isValidator, isHRAdmin, isHRDirector,
    isHRSpace, isEmployeeSpace,
    hasPermission, hasAnyPermission,
    login, logout, restoreSession, changePassword,
  }
})
