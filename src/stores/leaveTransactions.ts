import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, getApiErrorMessage } from '../lib/api'
import { withToast } from '../lib/withToast'
import type { LeaveBalance } from '../types'

export interface EmployeeLeaveBalances {
  employeeId:   string
  employeeName: string
  entityName:   string
  balances:     LeaveBalance[]
}

// Le backend renvoie deja les champs en camelCase (voir
// leave-transaction.service.ts:getBalances) — pas de mapping PascalCase ici,
// a la difference des autres stores.
export const useLeaveTransactionStore = defineStore('leaveTransactions', () => {
  const myBalances  = ref<LeaveBalance[]>([])
  const allBalances = ref<EmployeeLeaveBalances[]>([])
  const loading     = ref(false)
  const error       = ref<string | null>(null)

  async function fetchMyBalances() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<LeaveBalance[]>('/leave-transactions/balance/mine')
      myBalances.value = data
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger vos soldes de congés')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchBalancesFor(employeeId: string): Promise<LeaveBalance[]> {
    const { data } = await api.get<LeaveBalance[]>(`/leave-transactions/balance/${employeeId}`)
    return data
  }

  async function fetchAllBalances() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<EmployeeLeaveBalances[]>('/leave-transactions/balance/all')
      allBalances.value = data
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger les soldes de congés')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generateAccruals() {
    error.value = null
    return withToast('Génération des acquisitions en cours…', async () => {
      try {
        const { data } = await api.post<{ created: number; runAt: string }>('/leave-transactions/generate-accruals')
        return data
      } catch (err) {
        error.value = getApiErrorMessage(err, "Impossible de générer les acquisitions de congés")
        throw err
      }
    }, () => error.value ?? "Impossible de générer les acquisitions de congés")
  }

  return { myBalances, allBalances, loading, error, fetchMyBalances, fetchBalancesFor, fetchAllBalances, generateAccruals }
})
