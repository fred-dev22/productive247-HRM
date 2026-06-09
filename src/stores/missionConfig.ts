import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface EmpCategory {
  id:           string
  code:         string
  label:        string
  description?: string
}

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
  const categories = ref<EmpCategory[]>([
    { id:'cat1', code:'CAT-A', label:'Cadre supérieur',       description:"Direction et encadrement supérieur" },
    { id:'cat2', code:'CAT-B', label:'Cadre',                 description:"Personnel d'encadrement" },
    { id:'cat3', code:'CAT-C', label:"Agent de maîtrise",     description:"Personnel technique qualifié" },
    { id:'cat4', code:'CAT-D', label:"Employé d'exécution",   description:"Personnel d'exécution" },
  ])

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

  function addCategory(payload: Omit<EmpCategory, 'id'>) {
    categories.value.push({ ...payload, id: `cat${Date.now()}` })
  }

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
    categories, feeTypes,
    addCategory, addFeeType, updateFeeType, updateFeeRule, deleteFeeType,
    getRulesForCategory,
  }
})
