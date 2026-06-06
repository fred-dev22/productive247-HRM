import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser, UserRole } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user      = ref<AuthUser | null>(null)
  const isLoggedIn = ref(false)

  // ── Getters ──────────────────────────────────────────────────
  const role         = computed<UserRole | null>(() => user.value?.role ?? null)
  const isEmployee   = computed(() => user.value?.role === 'employee')
  const isValidator  = computed(() => user.value?.role === 'validator')
  const isHRAdmin    = computed(() => user.value?.role === 'hr_admin')
  const isHRDirector = computed(() => user.value?.role === 'hr_director')
  const isHRSide     = computed(() =>
    user.value?.role === 'hr_admin' || user.value?.role === 'hr_director'
  )
  const isEmployeeSide = computed(() =>
    user.value?.role === 'employee' || user.value?.role === 'validator'
  )
  // Alias kept for backward compat
  const isRH = computed(() => isHRSide.value)

  // ── Actions ──────────────────────────────────────────────────
  function login(selectedRole: UserRole, email: string) {
    const users: Record<UserRole, AuthUser> = {
      employee: {
        id: 'emp-003',
        name: 'Ravi Nundlall',
        initials: 'RN',
        role: 'employee',
        email,
        entityId:   'e3',
        entityName: 'Service Administration du Personnel',
      },
      validator: {
        id: 'emp-002',
        name: 'Sonia Boodhun',
        initials: 'SB',
        role: 'validator',
        email,
        entityId:       'e2',
        entityName:     'Direction des Ressources Humaines',
        validatorLevel: 1,
      },
      hr_admin: {
        id: 'emp-001',
        name: 'David Djouboui',
        initials: 'DD',
        role: 'hr_admin',
        email,
        entityId:   'e1',
        entityName: 'Direction Générale',
      },
      hr_director: {
        id: 'emp-000',
        name: 'Gary Ellis',
        initials: 'GE',
        role: 'hr_director',
        email,
        entityId:   'e1',
        entityName: 'Direction Générale',
      },
    }
    user.value      = users[selectedRole]
    isLoggedIn.value = true
  }

  function logout() {
    user.value       = null
    isLoggedIn.value = false
  }

  return {
    user, isLoggedIn, role,
    isEmployee, isValidator, isHRAdmin, isHRDirector,
    isHRSide, isEmployeeSide,
    isRH,  // alias
    login, logout,
  }
})
