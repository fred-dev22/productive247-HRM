import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'

// Aligned on the backend LeaveType model (productive247-hrm-backend). `icon`
// has no backend column — it's a purely client-side display concept, kept
// via a static Code -> icon lookup so existing UI keeps working.
export interface LeaveTypeConfig {
  id:                string
  name:              string
  code:              string
  workflowType:      'Standard' | 'Medical'
  monthlyAccrual?:   boolean
  daysPerYear:       number
  daysPerMonth?:     number
  documentRequired:  boolean
  carryOverAllowed?: boolean
  carryOverCap?:     number
  noticeDays:        number
  color:             string
  isActive:          boolean
  isSystem:          boolean
  icon:              string
}

interface BackendLeaveType {
  Id: string
  Code: string
  Name: string
  WorkflowType: 'Standard' | 'Medical'
  MonthlyAccrual: boolean
  DaysPerYear: number
  DaysPerMonth: number | null
  DocumentRequired: boolean
  CarryOverAllowed: boolean
  CarryOverCap: number
  MinNoticeDays: number
  Color: string
  IsActive: boolean
  IsSystem: boolean
}

const ICON_BY_CODE: Record<string, string> = {
  ANNUAL: 'ti-calendar',
  SICK: 'ti-stethoscope',
  MATERNITY: 'ti-heart',
  RECOVERY: 'ti-clock-hour-3',
  PARENTAL: 'ti-users',
  EXCEPTIONAL: 'ti-star',
  REMOTE: 'ti-home-2',
}
const DEFAULT_ICON = 'ti-calendar'

function mapLeaveType(raw: BackendLeaveType): LeaveTypeConfig {
  return {
    id: raw.Id,
    name: raw.Name,
    code: raw.Code,
    workflowType: raw.WorkflowType,
    monthlyAccrual: raw.MonthlyAccrual,
    daysPerYear: Number(raw.DaysPerYear),
    daysPerMonth: raw.DaysPerMonth != null ? Number(raw.DaysPerMonth) : undefined,
    documentRequired: raw.DocumentRequired,
    carryOverAllowed: raw.CarryOverAllowed,
    carryOverCap: raw.CarryOverCap,
    noticeDays: raw.MinNoticeDays,
    color: raw.Color,
    isActive: raw.IsActive,
    isSystem: raw.IsSystem,
    icon: ICON_BY_CODE[raw.Code] ?? DEFAULT_ICON,
  }
}

function toBackendPayload(payload: Partial<LeaveTypeConfig>) {
  const body: Record<string, unknown> = {}
  if (payload.code !== undefined) body.Code = payload.code
  if (payload.name !== undefined) body.Name = payload.name
  if (payload.workflowType !== undefined) body.WorkflowType = payload.workflowType
  if (payload.monthlyAccrual !== undefined) body.MonthlyAccrual = payload.monthlyAccrual
  if (payload.daysPerYear !== undefined) body.DaysPerYear = payload.daysPerYear
  if (payload.daysPerMonth !== undefined) body.DaysPerMonth = payload.daysPerMonth
  if (payload.documentRequired !== undefined) body.DocumentRequired = payload.documentRequired
  if (payload.carryOverAllowed !== undefined) body.CarryOverAllowed = payload.carryOverAllowed
  if (payload.carryOverCap !== undefined) body.CarryOverCap = payload.carryOverCap
  if (payload.noticeDays !== undefined) body.MinNoticeDays = payload.noticeDays
  if (payload.color !== undefined) body.Color = payload.color
  if (payload.isActive !== undefined) body.IsActive = payload.isActive
  if (payload.isSystem !== undefined) body.IsSystem = payload.isSystem
  return body
}

export const useLeaveTypesStore = defineStore('leaveTypes', () => {
  const leaveTypes = ref<LeaveTypeConfig[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeTypes = computed(() => leaveTypes.value.filter(lt => lt.isActive))

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendLeaveType[]>('/leave-types')
      leaveTypes.value = data.map(mapLeaveType)
    } catch (err) {
      error.value = 'Impossible de charger les types de congé'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchActive() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendLeaveType[]>('/leave-types/active')
      return data.map(mapLeaveType)
    } catch (err) {
      error.value = 'Impossible de charger les types de congé actifs'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addLeaveType(payload: Omit<LeaveTypeConfig, 'id' | 'icon'>) {
    error.value = null
    try {
      const { data } = await api.post<BackendLeaveType>('/leave-types', toBackendPayload(payload))
      const mapped = mapLeaveType(data)
      leaveTypes.value.push(mapped)
      return mapped
    } catch (err) {
      error.value = 'Impossible de créer le type de congé'
      throw err
    }
  }

  async function updateLeaveType(id: string, payload: Partial<LeaveTypeConfig>) {
    error.value = null
    try {
      const { data } = await api.patch<BackendLeaveType>(`/leave-types/${id}`, toBackendPayload(payload))
      const mapped = mapLeaveType(data)
      const idx = leaveTypes.value.findIndex(lt => lt.id === id)
      if (idx !== -1) leaveTypes.value[idx] = mapped
      return mapped
    } catch (err) {
      error.value = 'Impossible de mettre à jour le type de congé'
      throw err
    }
  }

  async function toggleLeaveType(id: string) {
    error.value = null
    try {
      const { data } = await api.patch<BackendLeaveType>(`/leave-types/${id}/toggle`)
      const mapped = mapLeaveType(data)
      const idx = leaveTypes.value.findIndex(lt => lt.id === id)
      if (idx !== -1) leaveTypes.value[idx] = mapped
      return mapped
    } catch (err) {
      error.value = "Impossible de changer le statut du type de congé"
      throw err
    }
  }

  async function deleteLeaveType(id: string) {
    error.value = null
    try {
      await api.delete(`/leave-types/${id}`)
      leaveTypes.value = leaveTypes.value.filter(lt => lt.id !== id)
    } catch (err) {
      // Le backend renvoie 403 pour les types systeme — message deja clair
      // cote API, on le relaie tel quel plutot que de le generaliser.
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      error.value = message ?? 'Impossible de supprimer le type de congé'
      throw err
    }
  }

  return { leaveTypes, loading, error, activeTypes, fetchAll, fetchActive, addLeaveType, updateLeaveType, toggleLeaveType, deleteLeaveType }
})
