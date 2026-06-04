import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser, UserRole } from '../types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const isLoggedIn = ref(false)

  // Getters
  const role = computed<UserRole | null>(() => user.value?.role ?? null)
  const isRH = computed(() => role.value === 'rh')
  const isEmployee = computed(() => role.value === 'employee')

  // Actions
  function login(selectedRole: UserRole, email: string) {
    // TODO: remplacer par un appel API réel + lecture du token JWT
    user.value = selectedRole === 'rh'
      ? { name: 'David Djouboui', initials: 'DD', role: 'rh',      email }
      : { name: 'Aminata Diallo', initials: 'AD', role: 'employee', email }
    isLoggedIn.value = true
  }

  function logout() {
    user.value = null
    isLoggedIn.value = false
  }

  return { user, isLoggedIn, role, isRH, isEmployee, login, logout }
})