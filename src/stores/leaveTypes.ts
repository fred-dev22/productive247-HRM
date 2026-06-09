import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface LeaveTypeConfig {
  id:               string
  name:             string
  code:             string
  daysPerYear:      number
  daysPerMonth?:    number
  noticeDays:       number
  requiresDocument: boolean
  workflow:         'standard' | 'medical'
  isActive:         boolean
  isSystem:         boolean
  color:            string
  icon:             string
}

let ltCounter = 10

export const useLeaveTypesStore = defineStore('leaveTypes', () => {
  const leaveTypes = ref<LeaveTypeConfig[]>([
    { id:'lt1', name:'Congé annuel',              code:'ANNUAL',      daysPerYear:24, daysPerMonth:2, noticeDays:7,  requiresDocument:false, workflow:'standard', isActive:true, isSystem:true,  color:'#006B3C', icon:'ti-calendar' },
    { id:'lt2', name:'Congé maladie',             code:'SICK',        daysPerYear:8,                  noticeDays:0,  requiresDocument:true,  workflow:'medical',  isActive:true, isSystem:true,  color:'#C8102E', icon:'ti-stethoscope' },
    { id:'lt3', name:'Congé maternité',           code:'MATERNITY',   daysPerYear:90,                 noticeDays:30, requiresDocument:true,  workflow:'medical',  isActive:true, isSystem:true,  color:'#993556', icon:'ti-heart' },
    { id:'lt4', name:'Récupération',              code:'RECOVERY',    daysPerYear:0,                  noticeDays:1,  requiresDocument:false, workflow:'standard', isActive:true, isSystem:true,  color:'#185FA5', icon:'ti-clock-hour-3' },
    { id:'lt5', name:'Assistance parentale',      code:'PARENTAL',    daysPerYear:5,                  noticeDays:2,  requiresDocument:true,  workflow:'standard', isActive:true, isSystem:false, color:'#854F0B', icon:'ti-users' },
    { id:'lt6', name:'Permission exceptionnelle', code:'EXCEPTIONAL',  daysPerYear:5,                  noticeDays:1,  requiresDocument:false, workflow:'standard', isActive:true, isSystem:false, color:'#8A5A0A', icon:'ti-star' },
    { id:'lt7', name:'Télétravail',               code:'REMOTE',      daysPerYear:0,                  noticeDays:1,  requiresDocument:false, workflow:'standard', isActive:true, isSystem:false, color:'#2D7A3F', icon:'ti-home-2' },
  ])

  const activeTypes = computed(() => leaveTypes.value.filter(lt => lt.isActive))

  function addLeaveType(payload: Omit<LeaveTypeConfig, 'id'>) {
    leaveTypes.value.push({ ...payload, id: `lt${++ltCounter}` })
  }

  function updateLeaveType(id: string, payload: Partial<LeaveTypeConfig>) {
    const idx = leaveTypes.value.findIndex(lt => lt.id === id)
    if (idx !== -1) {
      leaveTypes.value[idx] = { ...leaveTypes.value[idx]!, ...payload }
    }
  }

  function toggleLeaveType(id: string) {
    const lt = leaveTypes.value.find(lt => lt.id === id)
    if (lt) lt.isActive = !lt.isActive
  }

  function deleteLeaveType(id: string) {
    const lt = leaveTypes.value.find(lt => lt.id === id)
    if (lt && !lt.isSystem) {
      leaveTypes.value = leaveTypes.value.filter(lt => lt.id !== id)
    }
  }

  return { leaveTypes, activeTypes, addLeaveType, updateLeaveType, toggleLeaveType, deleteLeaveType }
})
