import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Employee } from '../types'

const PALETTE = [
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#C0DD97', text: '#3B6D11' },
  { bg: '#F4C0D1', text: '#72243E' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#AFA9EC', text: '#3C3489' },
  { bg: '#B8E8D8', text: '#1A6B4B' },
  { bg: '#FAD9B0', text: '#7A3B09' },
]

function p(i: number) { return PALETTE[i % PALETTE.length]! }

export const useEmployeeStore = defineStore('employees', () => {
  // Les employés seront créés par le RH (onboarding ou page Employés)
  const employees = ref<Employee[]>([])

  const activeEmployees   = computed(() => employees.value.filter(e => e.status === 'active'))
  const trialEmployees    = computed(() => employees.value.filter(e => e.status === 'trial'))
  const validatorEmployees = computed(() => employees.value.filter(e => e.role === 'validator' || e.role === 'hr_admin' || e.role === 'hr_director'))

  const nextCode = computed(() => {
    const max = employees.value.reduce((m, e) => {
      const n = parseInt(e.code.replace('EMP', '')) || 0
      return n > m ? n : m
    }, 0)
    return `EMP${String(max + 1).padStart(3, '0')}`
  })

  function getById(id: string): Employee | undefined {
    return employees.value.find(e => e.id === id)
  }

  function getByEntityId(entityId: string): Employee[] {
    return employees.value.filter(e => e.entityId === entityId)
  }

  function createEmployee(payload: Omit<Employee, 'id' | 'code' | 'name' | 'initials' | 'avatarBg' | 'avatarText'>) {
    const pi = employees.value.length % PALETTE.length
    const emp: Employee = {
      ...payload,
      id:         `emp-${Date.now()}`,
      code:       nextCode.value,
      name:       `${payload.firstName} ${payload.lastName}`,
      initials:   (payload.firstName.charAt(0) + payload.lastName.charAt(0)).toUpperCase(),
      avatarBg:   p(pi).bg,
      avatarText: p(pi).text,
    }
    employees.value.push(emp)
    return emp
  }

  function updateEmployee(id: string, payload: Partial<Employee>) {
    const idx = employees.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      const emp = employees.value[idx]!
      const updated: Employee = { ...emp, ...payload }
      if (payload.firstName || payload.lastName) {
        updated.name     = `${updated.firstName} ${updated.lastName}`
        updated.initials = (updated.firstName.charAt(0) + updated.lastName.charAt(0)).toUpperCase()
      }
      employees.value[idx] = updated
    }
  }

  return {
    employees, activeEmployees, trialEmployees, validatorEmployees, nextCode,
    getById, getByEntityId, createEmployee, updateEmployee,
  }
})
