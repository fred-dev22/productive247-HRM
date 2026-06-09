import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  MissionOrder, MissionStatus, EmployeeCategory,
  TransportMode, MissionAllowance, ValidationStep,
} from '../types'

const ALLOWANCES: MissionAllowance[] = [
  { category: 'cat_a', hotelPerDay: 150000, transportFlat: 50000, mealPerDay: 30000, currency: 'MGA' },
  { category: 'cat_b', hotelPerDay: 100000, transportFlat: 40000, mealPerDay: 25000, currency: 'MGA' },
  { category: 'cat_c', hotelPerDay:  75000, transportFlat: 30000, mealPerDay: 20000, currency: 'MGA' },
  { category: 'cat_d', hotelPerDay:  50000, transportFlat: 20000, mealPerDay: 15000, currency: 'MGA' },
]

function computeDays(departure: string, returnD: string): number {
  const d = new Date(departure)
  const r = new Date(returnD)
  const diff = Math.ceil((r.getTime() - d.getTime()) / 86400000)
  return Math.max(1, diff)
}

function buildMission(
  id: string, code: string,
  employeeId: string, employeeName: string, employeeInitials: string,
  category: EmployeeCategory,
  destination: string, purpose: string,
  departure: string, returnD: string,
  transport: TransportMode, transportReturn: TransportMode,
  status: MissionStatus, createdAt: string,
  history: ValidationStep[], description?: string, submittedAt?: string, advance = 0,
): MissionOrder {
  const allowance = ALLOWANCES.find(a => a.category === category)!
  const days      = computeDays(departure, returnD)
  const hotel     = allowance.hotelPerDay * days
  const meal      = allowance.mealPerDay  * days
  const transport2 = allowance.transportFlat
  return {
    id, code, employeeId, employeeName, employeeInitials, employeeCategory: category,
    destination, purpose, departureDate: departure, returnDate: returnD,
    transportMode: transport, transportModeReturn: transportReturn,
    description, numberOfDays: days,
    hotelAllowance: hotel, transportAllowance: transport2, mealAllowance: meal,
    totalMission: hotel + transport2 + meal,
    advanceRequested: advance, status,
    validationHistory: history,
    createdAt, submittedAt,
  }
}

let _idSeq = 5

export const useMissionStore = defineStore('missions', () => {

  const missions = ref<MissionOrder[]>([
    buildMission(
      'mis-1', 'OM-2026-001', 'emp-1', 'Aminata Diallo', 'AD', 'cat_b',
      'Antananarivo', 'Réunion de coordination interservices',
      '2026-07-14T08:00', '2026-07-16T18:00', 'plane', 'plane',
      'approved', '2026-06-10T09:00:00',
      [
        { level: 'employee', actorName: 'Aminata Diallo', actorInitials: 'AD', action: 'submitted', date: '2026-06-10T09:00:00' },
        { level: 'n1', actorName: 'Sonia Boodhun', actorInitials: 'SB', action: 'approved', date: '2026-06-11T10:00:00', comment: 'Validé, bon voyage' },
      ],
      'Déplacement pour réunion DG', '2026-06-10T09:00:00', 50000,
    ),
    buildMission(
      'mis-2', 'OM-2026-002', 'emp-4', 'Jean-Pierre Mvondo', 'JP', 'cat_a',
      'Toamasina', 'Audit comptable site de Toamasina',
      '2026-07-20T06:00', '2026-07-23T20:00', 'company_car', 'company_car',
      'pending', '2026-06-28T11:00:00',
      [
        { level: 'employee', actorName: 'Jean-Pierre Mvondo', actorInitials: 'JP', action: 'submitted', date: '2026-06-28T11:00:00' },
        { level: 'n1', actorName: 'Sonia Boodhun', actorInitials: 'SB', action: 'pending', date: '' },
      ],
      undefined, '2026-06-28T11:00:00',
    ),
    buildMission(
      'mis-3', 'OM-2026-003', 'emp-6', 'Ibrahim Touré', 'IT', 'cat_c',
      'Mahajanga', 'Prospection client région Nord',
      '2026-08-04T07:00', '2026-08-06T19:00', 'personal_car', 'personal_car',
      'draft', '2026-07-01T14:00:00',
      [],
    ),
    buildMission(
      'mis-4', 'OM-2026-004', 'emp-2', 'Kofi Mensah', 'KM', 'cat_b',
      'Fianarantsoa', 'Formation managers filiale Sud',
      '2026-07-28T08:00', '2026-07-30T18:00', 'plane', 'plane',
      'rejected', '2026-06-20T10:00:00',
      [
        { level: 'employee', actorName: 'Kofi Mensah', actorInitials: 'KM', action: 'submitted', date: '2026-06-20T10:00:00' },
        { level: 'n1', actorName: 'Sonia Boodhun', actorInitials: 'SB', action: 'rejected', date: '2026-06-21T09:00:00', comment: 'Budget dépassé ce trimestre' },
      ],
      undefined, '2026-06-20T10:00:00',
    ),
  ])

  const pendingMissions = computed(() => missions.value.filter(m => m.status === 'pending'))

  function getAllowance(category: EmployeeCategory): MissionAllowance {
    return ALLOWANCES.find(a => a.category === category) ?? ALLOWANCES[3]!
  }

  function myMissions(employeeId: string) {
    return missions.value.filter(m => m.employeeId === employeeId)
  }

  function createMission(payload: {
    employeeId: string; employeeName: string; employeeInitials: string
    employeeCategory: EmployeeCategory
    destination: string; purpose: string
    departureDate: string; returnDate: string
    transportMode: TransportMode; transportModeReturn: TransportMode
    description?: string; advanceRequested?: number
  }): MissionOrder {
    const id    = `mis-${++_idSeq}`
    const year  = new Date().getFullYear()
    const code  = `OM-${year}-${String(_idSeq).padStart(3, '0')}`
    const allow = getAllowance(payload.employeeCategory)
    const days  = computeDays(payload.departureDate, payload.returnDate)
    const hotel = allow.hotelPerDay * days
    const meal  = allow.mealPerDay  * days
    const total = hotel + allow.transportFlat + meal
    const mission: MissionOrder = {
      id, code,
      employeeId: payload.employeeId,
      employeeName: payload.employeeName,
      employeeInitials: payload.employeeInitials,
      employeeCategory: payload.employeeCategory,
      destination: payload.destination,
      purpose: payload.purpose,
      departureDate: payload.departureDate,
      returnDate:    payload.returnDate,
      transportMode:       payload.transportMode,
      transportModeReturn: payload.transportModeReturn,
      description:    payload.description,
      numberOfDays:   days,
      hotelAllowance: hotel,
      transportAllowance: allow.transportFlat,
      mealAllowance:  meal,
      totalMission:   total,
      advanceRequested: payload.advanceRequested ?? 0,
      status: 'draft',
      validationHistory: [],
      createdAt: new Date().toISOString(),
    }
    missions.value.unshift(mission)
    return mission
  }

  function submitMission(id: string) {
    const m = missions.value.find(m => m.id === id)
    if (!m || m.status !== 'draft') return
    m.status = 'pending'
    m.submittedAt = new Date().toISOString()
    m.validationHistory = [
      { level: 'employee', actorName: m.employeeName, actorInitials: m.employeeInitials, action: 'submitted', date: m.submittedAt },
      { level: 'n1', actorName: 'Sonia Boodhun', actorInitials: 'SB', action: 'pending', date: '' },
    ]
  }

  function approveMission(id: string, comment?: string) {
    const m = missions.value.find(m => m.id === id)
    if (!m) return
    const vstep: ValidationStep = { level: 'n1', actorName: 'Sonia Boodhun', actorInitials: 'SB', action: 'approved', date: new Date().toISOString(), comment }
    m.status = 'approved'
    m.validationHistory = [...m.validationHistory.filter(s => s.action !== 'pending'), vstep]
  }

  function rejectMission(id: string, reason: string) {
    const m = missions.value.find(m => m.id === id)
    if (!m) return
    const vstep: ValidationStep = { level: 'n1', actorName: 'Sonia Boodhun', actorInitials: 'SB', action: 'rejected', date: new Date().toISOString(), comment: reason }
    m.status = 'rejected'
    m.validationHistory = [...m.validationHistory.filter(s => s.action !== 'pending'), vstep]
  }

  function returnMission(id: string, comment: string) {
    const m = missions.value.find(m => m.id === id)
    if (!m) return
    const vstep: ValidationStep = { level: 'n1', actorName: 'Sonia Boodhun', actorInitials: 'SB', action: 'returned', date: new Date().toISOString(), comment }
    m.status = 'returned'
    m.validationHistory = [...m.validationHistory.filter(s => s.action !== 'pending'), vstep]
  }

  function cancelMission(id: string) {
    const m = missions.value.find(m => m.id === id)
    if (m) m.status = 'cancelled'
  }

  function updateMission(id: string, payload: Partial<Omit<MissionOrder, 'id' | 'code' | 'status' | 'validationHistory' | 'createdAt'>>) {
    const m = missions.value.find(m => m.id === id)
    if (!m) return
    Object.assign(m, payload)
    if (payload.departureDate || payload.returnDate || payload.employeeCategory) {
      const allow = getAllowance(m.employeeCategory)
      m.numberOfDays     = computeDays(m.departureDate, m.returnDate)
      m.hotelAllowance   = allow.hotelPerDay * m.numberOfDays
      m.mealAllowance    = allow.mealPerDay  * m.numberOfDays
      m.transportAllowance = allow.transportFlat
      m.totalMission     = m.hotelAllowance + m.transportAllowance + m.mealAllowance
    }
  }

  return {
    missions, pendingMissions,
    getAllowance, myMissions, ALLOWANCES,
    createMission, submitMission,
    approveMission, rejectMission, returnMission, cancelMission, updateMission,
  }
})
