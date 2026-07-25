import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, getApiErrorMessage } from '../lib/api'
import { withToast } from '../lib/withToast'

export interface Role {
  id: string
  name: string
  description?: string
  isSystem: boolean
}

interface BackendRole {
  Id: string
  Name: string
  Description: string | null
  IsSystem: boolean
}

function mapRole(raw: BackendRole): Role {
  return { id: raw.Id, name: raw.Name, description: raw.Description ?? undefined, isSystem: raw.IsSystem }
}

export interface CreateUserAccountPayload {
  employeeId: string
  username: string
  email: string
  password: string
  roleId: string
}

export const useUserStore = defineStore('users', () => {
  const roles = ref<Role[]>([])
  const error = ref<string | null>(null)

  async function fetchRoles() {
    error.value = null
    try {
      const { data } = await api.get<BackendRole[]>('/roles')
      roles.value = data.map(mapRole)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger les rôles')
      throw err
    }
  }

  async function createUserAccount(payload: CreateUserAccountPayload) {
    error.value = null
    return withToast('Création du compte en cours…', async () => {
      try {
        const { data } = await api.post('/users', {
          Username: payload.username,
          Email: payload.email,
          Password: payload.password,
          EmployeeId: payload.employeeId,
          RoleId: payload.roleId,
          IsActive: true,
        })
        return data
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de créer le compte utilisateur')
        throw err
      }
    }, () => error.value ?? 'Impossible de créer le compte utilisateur')
  }

  return { roles, error, fetchRoles, createUserAccount }
})
