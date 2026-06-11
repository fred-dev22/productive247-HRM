import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Employee } from '../types'
import { getInitials } from '../utils/helpers'
import { useAuthStore } from './auth'

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

// initials / avatarBg / avatarText sont dérivés automatiquement du nom
// et de la palette — jamais saisis à la main.
type SeedEmployee = Omit<Employee, 'initials' | 'avatarBg' | 'avatarText'>

const SEED: SeedEmployee[] = [
  {
    id: 'emp-001', code: 'EMP001',
    name: 'Gary Ellis', firstName: 'Gary', lastName: 'Ellis',
    email: 'gary.ellis@galana.com',
    entityId: 'e1', entityName: 'Direction Générale',
    jobTitle: 'Directeur Général', role: 'hr_director',
    contractType: 'CDI', hireDate: '2018-01-02', status: 'active',
    hasSystemAccess: true, category: 'CAT-A',
  },
  {
    id: 'emp-002', code: 'EMP002',
    name: 'Sonia Boodhun', firstName: 'Sonia', lastName: 'Boodhun',
    email: 'sonia.boodhun@galana.com',
    entityId: 'e2', entityName: 'Direction RH',
    jobTitle: 'Directrice RH', role: 'hr_admin',
    contractType: 'CDI', hireDate: '2019-03-15', status: 'active',
    hasSystemAccess: true, category: 'CAT-A',
  },
  {
    id: 'emp-003', code: 'EMP003',
    name: 'Ravi Nundlall', firstName: 'Ravi', lastName: 'Nundlall',
    email: 'ravi.nundlall@galana.com',
    entityId: 'e3', entityName: 'Service Admin. Personnel',
    jobTitle: 'Responsable Administration', role: 'validator',
    contractType: 'CDI', hireDate: '2020-06-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-B',
  },
  {
    id: 'emp-004', code: 'EMP004',
    name: 'Priya Ramlugun', firstName: 'Priya', lastName: 'Ramlugun',
    email: 'priya.ramlugun@galana.com',
    entityId: 'e4', entityName: 'Service Formation',
    jobTitle: 'Responsable Formation', role: 'validator',
    contractType: 'CDI', hireDate: '2020-09-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-B',
  },
  {
    id: 'emp-005', code: 'EMP005',
    name: 'Ravi Dhondoo', firstName: 'Ravi', lastName: 'Dhondoo',
    email: 'ravi.dhondoo@galana.com',
    entityId: 'e5', entityName: 'Direction Administrative & Financière',
    jobTitle: 'Directeur Administratif & Financier', role: 'hr_admin',
    contractType: 'CDI', hireDate: '2018-04-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-A',
  },
  {
    id: 'emp-006', code: 'EMP006',
    name: 'Jean-Claude Rakotomalala', firstName: 'Jean-Claude', lastName: 'Rakotomalala',
    email: 'jc.rakotomalala@galana.com',
    entityId: 'e6', entityName: 'Service Comptabilité',
    jobTitle: 'Chef Comptable', role: 'validator',
    contractType: 'CDI', hireDate: '2019-07-15', status: 'active',
    hasSystemAccess: true, category: 'CAT-B',
  },
  {
    id: 'emp-007', code: 'EMP007',
    name: 'Hery Andrianaivo', firstName: 'Hery', lastName: 'Andrianaivo',
    email: 'hery.andrianaivo@galana.com',
    entityId: 'e7', entityName: 'Service Contrôle de Gestion',
    jobTitle: 'Contrôleur de Gestion', role: 'validator',
    contractType: 'CDI', hireDate: '2021-01-10', status: 'active',
    hasSystemAccess: true, category: 'CAT-B',
  },
  {
    id: 'emp-008', code: 'EMP008',
    name: 'Kumar Gunness', firstName: 'Kumar', lastName: 'Gunness',
    email: 'kumar.gunness@galana.com',
    entityId: 'e8', entityName: 'Direction des Opérations',
    jobTitle: 'Directeur des Opérations', role: 'validator',
    contractType: 'CDI', hireDate: '2017-11-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-A',
  },
  {
    id: 'emp-009', code: 'EMP009',
    name: 'Morad Cassam', firstName: 'Morad', lastName: 'Cassam',
    email: 'morad.cassam@galana.com',
    entityId: 'e9', entityName: 'Service Terminal Pétrolier',
    jobTitle: 'Responsable Terminal', role: 'validator',
    contractType: 'CDI', hireDate: '2019-02-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-B',
  },
  {
    id: 'emp-010', code: 'EMP010',
    name: 'Thierry Randriamanga', firstName: 'Thierry', lastName: 'Randriamanga',
    email: 'thierry.randriamanga@galana.com',
    entityId: 'e10', entityName: 'Service Raffinerie',
    jobTitle: 'Responsable Raffinerie', role: 'validator',
    contractType: 'CDI', hireDate: '2018-06-15', status: 'active',
    hasSystemAccess: true, category: 'CAT-B',
  },
  {
    id: 'emp-011', code: 'EMP011',
    name: 'Fiona Mungroo', firstName: 'Fiona', lastName: 'Mungroo',
    email: 'fiona.mungroo@galana.com',
    entityId: 'e11', entityName: 'Service Logistique & Transport',
    jobTitle: 'Responsable Logistique', role: 'validator',
    contractType: 'CDI', hireDate: '2020-03-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-B',
  },
  {
    id: 'emp-012', code: 'EMP012',
    name: 'Nadia Oozeer', firstName: 'Nadia', lastName: 'Oozeer',
    email: 'nadia.oozeer@galana.com',
    entityId: 'e12', entityName: 'Direction Commerciale',
    jobTitle: 'Directrice Commerciale', role: 'validator',
    contractType: 'CDI', hireDate: '2019-05-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-A',
  },
  {
    id: 'emp-013', code: 'EMP013',
    name: 'Ashvin Pertab', firstName: 'Ashvin', lastName: 'Pertab',
    email: 'ashvin.pertab@galana.com',
    entityId: 'e13', entityName: 'Service Stations-Service',
    jobTitle: 'Responsable Stations', role: 'validator',
    contractType: 'CDI', hireDate: '2021-06-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-B',
  },
  {
    id: 'emp-014', code: 'EMP014',
    name: 'Patrick Boulle', firstName: 'Patrick', lastName: 'Boulle',
    email: 'patrick.boulle@galana.com',
    entityId: 'e14', entityName: 'Direction Technique & HSE',
    jobTitle: 'Directeur Technique & HSE', role: 'validator',
    contractType: 'CDI', hireDate: '2018-09-01', status: 'active',
    hasSystemAccess: true, category: 'CAT-A',
  },
  {
    id: 'emp-015', code: 'EMP015',
    name: 'Marie-France Leclézio', firstName: 'Marie-France', lastName: 'Leclézio',
    email: 'mf.leclezio@galana.com',
    entityId: 'e15', entityName: 'Direction Juridique & Conformité',
    jobTitle: 'Directrice Juridique', role: 'hr_admin',
    contractType: 'CDI', hireDate: '2020-01-15', status: 'active',
    hasSystemAccess: true, category: 'CAT-A',
  },
]

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref<Employee[]>(SEED.map((e, i) => ({
    ...e,
    initials:   getInitials(e.name),
    avatarBg:   p(i).bg,
    avatarText: p(i).text,
  })))

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

  // L'employé correspondant à l'utilisateur connecté (matché par nom ou email)
  const currentUserEmployee = computed(() => {
    const user = useAuthStore().user
    if (!user) return undefined
    return employees.value.find(e =>
      e.name === user.name || (!!user.email && e.email === user.email)
    )
  })

  // L'utilisateur RH connecté est lui-même un employé du système.
  // S'il n'existe pas encore dans la liste, on le crée automatiquement.
  function ensureDefaultEmployee() {
    const auth = useAuthStore()
    const user = auth.user
    if (!user) return
    if (currentUserEmployee.value) return
    const name = user.name ?? 'Admin RH'
    const pi   = employees.value.length % PALETTE.length
    const defaultEmployee: Employee = {
      id:         'emp-default',
      code:       nextCode.value,
      firstName:  name.split(' ')[0] ?? 'Admin',
      lastName:   name.split(' ').slice(1).join(' ') || 'RH',
      name,
      initials:   getInitials(name),
      avatarBg:   p(pi).bg,
      avatarText: p(pi).text,
      email:      user.email ?? '',
      entityId:   'e1',
      entityName: 'Direction Générale',
      jobTitle:   'Administrateur RH',
      role:       user.role ?? 'hr_admin',
      contractType: 'CDI',
      hireDate:   new Date().toISOString().split('T')[0]!,
      status:     'active',
      hasSystemAccess: true,
      category:   'CAT-A',
    }
    employees.value.unshift(defaultEmployee)
  }

  function createEmployee(payload: Omit<Employee, 'id' | 'code' | 'name' | 'initials' | 'avatarBg' | 'avatarText'>) {
    const pi = employees.value.length % PALETTE.length
    const name = `${payload.firstName} ${payload.lastName}`
    const emp: Employee = {
      ...payload,
      id:         `emp-${Date.now()}`,
      code:       nextCode.value,
      name,
      initials:   getInitials(name),
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
        updated.initials = getInitials(updated.name)
      }
      employees.value[idx] = updated
    }
  }

  return {
    employees, activeEmployees, trialEmployees, validatorEmployees, nextCode,
    currentUserEmployee,
    getById, getByEntityId, ensureDefaultEmployee, createEmployee, updateEmployee,
  }
})
