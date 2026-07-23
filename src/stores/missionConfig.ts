import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../lib/api'

// Aligned on the backend EmployeeCategory model — no `description` column
// exists server-side (it never persisted anyway), so it's been dropped
// rather than kept as a silently-lost UI field.
export interface EmpCategory {
  id:       string
  code:     string
  name:     string
  isActive: boolean
}

interface BackendEmployeeCategory {
  Id: string
  Code: string
  Name: string
  IsActive: boolean
}

function mapCategory(raw: BackendEmployeeCategory): EmpCategory {
  return { id: raw.Id, code: raw.Code, name: raw.Name, isActive: raw.IsActive }
}

// ── feeTypes / MissionFeeType (ExpenseType + ExpenseConfig cote backend) ──
// Hors perimetre de cette passe — reste mock, non branche a l'API.
export interface FeeRule {
  categoryId: string
  amount:     number
  currency:   string
}

export interface MissionFeeType {
  id:             string
  name:           string
  code:           string
  unit:           'per_day' | 'flat' | 'real'
  requiresReceipt: boolean
  rules:          FeeRule[]
  isActive:       boolean
}

let ftCounter = 10

export const useMissionConfigStore = defineStore('missionConfig', () => {
  const categories = ref<EmpCategory[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  const feeTypes = ref<MissionFeeType[]>([
    {
      id:'ft1', name:'Perdiem', code:'PERDIEM', unit:'per_day', requiresReceipt:false, isActive:true,
      rules:[
        { categoryId:'cat1', amount:75000,  currency:'MGA' },
        { categoryId:'cat2', amount:50000,  currency:'MGA' },
        { categoryId:'cat3', amount:35000,  currency:'MGA' },
        { categoryId:'cat4', amount:25000,  currency:'MGA' },
      ],
    },
    {
      id:'ft2', name:'Transport', code:'TRANSPORT', unit:'flat', requiresReceipt:true, isActive:true,
      rules:[
        { categoryId:'cat1', amount:0,      currency:'MGA' },
        { categoryId:'cat2', amount:50000,  currency:'MGA' },
        { categoryId:'cat3', amount:40000,  currency:'MGA' },
        { categoryId:'cat4', amount:30000,  currency:'MGA' },
      ],
    },
    {
      id:'ft3', name:'Hébergement', code:'HOTEL', unit:'per_day', requiresReceipt:true, isActive:true,
      rules:[
        { categoryId:'cat1', amount:0,       currency:'MGA' },
        { categoryId:'cat2', amount:100000,  currency:'MGA' },
        { categoryId:'cat3', amount:75000,   currency:'MGA' },
        { categoryId:'cat4', amount:50000,   currency:'MGA' },
      ],
    },
  ])

  // ── EmployeeCategory — API reelle ────────────────────────────
  async function fetchCategories() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendEmployeeCategory[]>('/employee-categories')
      categories.value = data.map(mapCategory)
    } catch (err) {
      error.value = 'Impossible de charger les catégories d\'employés'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addCategory(payload: Omit<EmpCategory, 'id' | 'isActive'> & { isActive?: boolean }) {
    error.value = null
    try {
      const { data } = await api.post<BackendEmployeeCategory>('/employee-categories', {
        Code: payload.code,
        Name: payload.name,
        IsActive: payload.isActive ?? true,
      })
      const mapped = mapCategory(data)
      categories.value.push(mapped)
      return mapped
    } catch (err) {
      error.value = 'Impossible de créer la catégorie'
      throw err
    }
  }

  async function updateCategory(id: string, payload: Partial<EmpCategory>) {
    error.value = null
    try {
      const body: Record<string, unknown> = {}
      if (payload.code !== undefined) body.Code = payload.code
      if (payload.name !== undefined) body.Name = payload.name
      if (payload.isActive !== undefined) body.IsActive = payload.isActive
      const { data } = await api.patch<BackendEmployeeCategory>(`/employee-categories/${id}`, body)
      const mapped = mapCategory(data)
      const idx = categories.value.findIndex(c => c.id === id)
      if (idx !== -1) categories.value[idx] = mapped
      return mapped
    } catch (err) {
      error.value = 'Impossible de mettre à jour la catégorie'
      throw err
    }
  }

  async function deleteCategory(id: string) {
    error.value = null
    try {
      await api.delete(`/employee-categories/${id}`)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (err) {
      error.value = 'Impossible de supprimer la catégorie'
      throw err
    }
  }

  // ── MissionFeeType — mock, hors perimetre de cette passe ─────
  function addFeeType(payload: Omit<MissionFeeType, 'id'>) {
    feeTypes.value.push({ ...payload, id: `ft${++ftCounter}` })
  }

  function updateFeeType(id: string, payload: Partial<MissionFeeType>) {
    const idx = feeTypes.value.findIndex(ft => ft.id === id)
    if (idx !== -1) feeTypes.value[idx] = { ...feeTypes.value[idx]!, ...payload }
  }

  function updateFeeRule(feeTypeId: string, categoryId: string, amount: number) {
    const ft = feeTypes.value.find(ft => ft.id === feeTypeId)
    if (!ft) return
    const rule = ft.rules.find(r => r.categoryId === categoryId)
    if (rule) rule.amount = amount
    else ft.rules.push({ categoryId, amount, currency: 'MGA' })
  }

  function deleteFeeType(id: string) {
    feeTypes.value = feeTypes.value.filter(ft => ft.id !== id)
  }

  function getRulesForCategory(categoryId: string): Array<{ feeType: MissionFeeType; rule: FeeRule }> {
    return feeTypes.value
      .filter(ft => ft.isActive)
      .map(ft => {
        const rule = ft.rules.find(r => r.categoryId === categoryId)
        return rule ? { feeType: ft, rule } : null
      })
      .filter((r): r is { feeType: MissionFeeType; rule: FeeRule } => r !== null)
  }

  return {
    categories, feeTypes, loading, error,
    fetchCategories, addCategory, updateCategory, deleteCategory,
    addFeeType, updateFeeType, updateFeeRule, deleteFeeType,
    getRulesForCategory,
  }
})
