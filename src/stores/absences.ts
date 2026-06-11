import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LeaveRequest, LeaveStatus, LeaveType, ValidationStep } from '../types'

function calculateWorkingDays(start: string, end: string): number {
  const s   = new Date(start)
  const e   = new Date(end)
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function step(
  level: ValidationStep['level'],
  actorName: string,
  actorInitials: string,
  action: ValidationStep['action'],
  date: string,
  comment?: string,
): ValidationStep {
  return { level, actorName, actorInitials, action, date, comment }
}

let nextId = 11

export const useAbsenceStore = defineStore('absences', () => {

  const allLeaves = ref<LeaveRequest[]>([
    {
      id: 1, employeeName: 'Priya Ramlugun', employeeInitials: 'PR',
      avatarColor: '#B5D4F4', avatarTextColor: '#0C447C',
      type: 'Congé annuel', startDate: '2026-07-10', endDate: '2026-07-17',
      workingDays: 6, status: 'pending', submittedAt: '2026-06-20',
      validationHistory: [
        step('employee', 'Priya Ramlugun', 'PR', 'submitted', '2026-06-20T09:00:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'pending', ''),
      ],
    },
    {
      id: 2, employeeName: 'Hery Andrianaivo', employeeInitials: 'HA',
      avatarColor: '#C0DD97', avatarTextColor: '#3B6D11',
      type: 'Congé maladie', startDate: '2026-07-02', endDate: '2026-07-05',
      workingDays: 4, status: 'pending', submittedAt: '2026-07-01',
      validationHistory: [
        step('employee', 'Hery Andrianaivo', 'HA', 'submitted', '2026-07-01T08:30:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'pending', ''),
      ],
    },
    {
      id: 3, employeeName: 'Fiona Mungroo', employeeInitials: 'FM',
      avatarColor: '#F4C0D1', avatarTextColor: '#72243E',
      type: 'Récupération', startDate: '2026-07-08', endDate: '2026-07-08',
      workingDays: 1, status: 'approved', submittedAt: '2026-06-25',
      validationHistory: [
        step('employee', 'Fiona Mungroo', 'FM', 'submitted', '2026-06-25T10:00:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'approved', '2026-06-25T14:15:00', 'Accordé'),
      ],
    },
    {
      id: 4, employeeName: 'Jean-Claude Rakotomalala', employeeInitials: 'JR',
      avatarColor: '#FAC775', avatarTextColor: '#633806',
      type: 'Télétravail', startDate: '2026-07-07', endDate: '2026-07-11',
      workingDays: 5, status: 'pending', submittedAt: '2026-06-28',
      validationHistory: [
        step('employee', 'Jean-Claude Rakotomalala', 'JR', 'submitted', '2026-06-28T09:15:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'pending', ''),
      ],
    },
    {
      id: 5, employeeName: 'Nadia Oozeer', employeeInitials: 'NO',
      avatarColor: '#AFA9EC', avatarTextColor: '#3C3489',
      type: 'Congé maternité', startDate: '2026-07-01', endDate: '2026-09-30',
      workingDays: 65, status: 'approved', submittedAt: '2026-05-15',
      validationHistory: [
        step('employee', 'Nadia Oozeer', 'NO', 'submitted', '2026-05-15T10:30:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'approved', '2026-05-15T14:15:00', 'Bon courage'),
        step('rh', 'Gary Ellis', 'GE', 'approved', '2026-05-16T09:00:00', 'Validé RH'),
      ],
    },
    {
      id: 6, employeeName: 'Ashvin Pertab', employeeInitials: 'AP',
      avatarColor: '#B5D4F4', avatarTextColor: '#0C447C',
      type: 'Congé annuel', startDate: '2026-08-04', endDate: '2026-08-15',
      workingDays: 10, status: 'pending', submittedAt: '2026-06-30',
      validationHistory: [
        step('employee', 'Ashvin Pertab', 'AP', 'submitted', '2026-06-30T11:00:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'pending', ''),
      ],
    },
    {
      id: 7, employeeName: 'Marie-France Leclézio', employeeInitials: 'ML',
      avatarColor: '#C0DD97', avatarTextColor: '#3B6D11',
      type: 'Congé maladie', startDate: '2026-06-15', endDate: '2026-06-17',
      workingDays: 3, status: 'rejected', rejectionReason: 'Certificat médical manquant',
      submittedAt: '2026-06-14',
      validationHistory: [
        step('employee', 'Marie-France Leclézio', 'ML', 'submitted', '2026-06-14T08:00:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'rejected', '2026-06-14T16:00:00', 'Certificat médical manquant'),
      ],
    },
    {
      id: 8, employeeName: 'Thierry Randriamanga', employeeInitials: 'TR',
      avatarColor: '#FAC775', avatarTextColor: '#633806',
      type: 'Récupération', startDate: '2026-06-22', endDate: '2026-06-22',
      workingDays: 1, status: 'approved', submittedAt: '2026-06-18',
      validationHistory: [
        step('employee', 'Thierry Randriamanga', 'TR', 'submitted', '2026-06-18T09:30:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'approved', '2026-06-18T11:00:00'),
      ],
    },
    {
      id: 9, employeeName: 'Morad Cassam', employeeInitials: 'MC',
      avatarColor: '#F4C0D1', avatarTextColor: '#72243E',
      type: 'Télétravail', startDate: '2026-07-14', endDate: '2026-07-18',
      workingDays: 5, status: 'cancelled', submittedAt: '2026-06-29',
      validationHistory: [
        step('employee', 'Morad Cassam', 'MC', 'submitted', '2026-06-29T10:00:00'),
        step('system', 'Système', 'SY', 'rejected', '2026-07-01T00:00:00', 'Annulé par l\'employé'),
      ],
    },
    {
      id: 10, employeeName: 'Kumar Gunness', employeeInitials: 'KG',
      avatarColor: '#AFA9EC', avatarTextColor: '#3C3489',
      type: 'Congé annuel', startDate: '2026-09-01', endDate: '2026-09-12',
      workingDays: 10, status: 'draft', submittedAt: '2026-06-01',
      validationHistory: [],
    },
  ])

  const myLeaves = ref<LeaveRequest[]>([
    {
      id: 101, employeeName: 'Ravi Nundlall', employeeInitials: 'RN',
      avatarColor: '#FAC775', avatarTextColor: '#633806',
      type: 'Congé annuel', startDate: '2026-07-10', endDate: '2026-07-17',
      workingDays: 6, status: 'pending', submittedAt: '2026-06-20',
      validationHistory: [
        step('employee', 'Ravi Nundlall', 'RN', 'submitted', '2026-06-20T09:00:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'pending', ''),
      ],
    },
    {
      id: 102, employeeName: 'Ravi Nundlall', employeeInitials: 'RN',
      avatarColor: '#FAC775', avatarTextColor: '#633806',
      type: 'Récupération', startDate: '2026-06-22', endDate: '2026-06-22',
      workingDays: 1, status: 'approved', submittedAt: '2026-06-18',
      validationHistory: [
        step('employee', 'Ravi Nundlall', 'RN', 'submitted', '2026-06-18T09:00:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'approved', '2026-06-18T14:00:00', 'OK'),
      ],
    },
    {
      id: 103, employeeName: 'Ravi Nundlall', employeeInitials: 'RN',
      avatarColor: '#FAC775', avatarTextColor: '#633806',
      type: 'Congé maladie', startDate: '2026-05-05', endDate: '2026-05-07',
      workingDays: 3, status: 'approved', submittedAt: '2026-05-04',
      validationHistory: [
        step('employee', 'Ravi Nundlall', 'RN', 'submitted', '2026-05-04T07:30:00'),
        step('n1', 'Sonia Boodhun', 'SB', 'approved', '2026-05-04T10:00:00'),
      ],
    },
  ])

  const pendingLeaves   = computed(() => allLeaves.value.filter(l => l.status === 'pending'))
  const myPendingLeaves = computed(() => myLeaves.value.filter(l => l.status === 'pending'))

  // ── Employee balances mock ─────────────────────────────────────
  const employeeBalances = computed(() => [
    { employeeId: 'emp-004', employeeName: 'Priya Ramlugun',    entityName: 'Service Formation & Développement', balances: { 'Congé annuel': { used: 5, total: 24, remaining: 19 }, 'Congé maladie': { used: 2, total: 30, remaining: 28 }, 'Récupération': { used: 1, total: 10, remaining: 9 }, 'Télétravail': { used: 8, total: 20, remaining: 12 }, 'Congé maternité': { used: 0, total: 98, remaining: 98 }, 'Permission exceptionnelle': { used: 0, total: 5, remaining: 5 } } },
    { employeeId: 'emp-007', employeeName: 'Hery Andrianaivo',       entityName: 'Service Contrôle de Gestion', balances: { 'Congé annuel': { used: 10, total: 24, remaining: 14 }, 'Congé maladie': { used: 5, total: 30, remaining: 25 }, 'Récupération': { used: 3, total: 10, remaining: 7 }, 'Télétravail': { used: 18, total: 20, remaining: 2 }, 'Congé maternité': { used: 0, total: 0, remaining: 0 }, 'Permission exceptionnelle': { used: 1, total: 5, remaining: 4 } } },
    { employeeId: 'emp-011', employeeName: 'Fiona Mungroo',          entityName: 'Service Logistique & Transport', balances: { 'Congé annuel': { used: 20, total: 24, remaining: 4 }, 'Congé maladie': { used: 0, total: 30, remaining: 30 }, 'Récupération': { used: 2, total: 10, remaining: 8 }, 'Télétravail': { used: 10, total: 20, remaining: 10 }, 'Congé maternité': { used: 0, total: 98, remaining: 98 }, 'Permission exceptionnelle': { used: 2, total: 5, remaining: 3 } } },
    { employeeId: 'emp-006', employeeName: 'Jean-Claude Rakotomalala', entityName: 'Service Comptabilité', balances: { 'Congé annuel': { used: 0, total: 24, remaining: 24 }, 'Congé maladie': { used: 0, total: 30, remaining: 30 }, 'Récupération': { used: 5, total: 10, remaining: 5 }, 'Télétravail': { used: 2, total: 20, remaining: 18 }, 'Congé maternité': { used: 0, total: 0, remaining: 0 }, 'Permission exceptionnelle': { used: 0, total: 5, remaining: 5 } } },
    { employeeId: 'emp-012', employeeName: 'Nadia Oozeer',         entityName: 'Direction Commerciale', balances: { 'Congé annuel': { used: 24, total: 24, remaining: 0 }, 'Congé maladie': { used: 0, total: 30, remaining: 30 }, 'Récupération': { used: 0, total: 10, remaining: 10 }, 'Télétravail': { used: 0, total: 20, remaining: 20 }, 'Congé maternité': { used: 98, total: 98, remaining: 0 }, 'Permission exceptionnelle': { used: 0, total: 5, remaining: 5 } } },
    { employeeId: 'emp-013', employeeName: 'Ashvin Pertab',      entityName: 'Service Stations-Service', balances: { 'Congé annuel': { used: 8, total: 24, remaining: 16 }, 'Congé maladie': { used: 3, total: 30, remaining: 27 }, 'Récupération': { used: 4, total: 10, remaining: 6 }, 'Télétravail': { used: 5, total: 20, remaining: 15 }, 'Congé maternité': { used: 0, total: 0, remaining: 0 }, 'Permission exceptionnelle': { used: 1, total: 5, remaining: 4 } } },
    { employeeId: 'emp-015', employeeName: 'Marie-France Leclézio',           entityName: 'Direction Juridique & Conformité', balances: { 'Congé annuel': { used: 12, total: 24, remaining: 12 }, 'Congé maladie': { used: 8, total: 30, remaining: 22 }, 'Récupération': { used: 0, total: 10, remaining: 10 }, 'Télétravail': { used: 15, total: 20, remaining: 5 }, 'Congé maternité': { used: 0, total: 98, remaining: 98 }, 'Permission exceptionnelle': { used: 3, total: 5, remaining: 2 } } },
    { employeeId: 'emp-010', employeeName: 'Thierry Randriamanga',         entityName: 'Service Raffinerie', balances: { 'Congé annuel': { used: 18, total: 24, remaining: 6 }, 'Congé maladie': { used: 1, total: 30, remaining: 29 }, 'Récupération': { used: 7, total: 10, remaining: 3 }, 'Télétravail': { used: 19, total: 20, remaining: 1 }, 'Congé maternité': { used: 0, total: 0, remaining: 0 }, 'Permission exceptionnelle': { used: 0, total: 5, remaining: 5 } } },
  ])

  function leavesByStatus(status: LeaveStatus) {
    return allLeaves.value.filter(l => l.status === status)
  }
  function leavesByType(type: LeaveType) {
    return allLeaves.value.filter(l => l.type === type)
  }

  function submitLeave(payload: { type: LeaveType; startDate: string; endDate: string; reason?: string }): LeaveRequest {
    const now = new Date().toISOString()
    const leave: LeaveRequest = {
      id: nextId++,
      employeeName: 'Ravi Nundlall', employeeInitials: 'RN',
      avatarColor: '#FAC775', avatarTextColor: '#633806',
      type: payload.type, startDate: payload.startDate, endDate: payload.endDate,
      workingDays: calculateWorkingDays(payload.startDate, payload.endDate),
      reason: payload.reason, status: 'pending',
      submittedAt: now.slice(0, 10),
      validationHistory: [
        step('employee', 'Ravi Nundlall', 'RN', 'submitted', now),
        step('n1', 'Sonia Boodhun', 'SB', 'pending', ''),
      ],
    }
    myLeaves.value.unshift(leave)
    allLeaves.value.unshift(leave)
    return leave
  }

  function saveDraft(payload: { type: LeaveType; startDate: string; endDate: string; reason?: string }) {
    const leave: LeaveRequest = {
      id: nextId++,
      employeeName: 'Ravi Nundlall', employeeInitials: 'RN',
      avatarColor: '#FAC775', avatarTextColor: '#633806',
      type: payload.type, startDate: payload.startDate, endDate: payload.endDate,
      workingDays: calculateWorkingDays(payload.startDate, payload.endDate),
      reason: payload.reason, status: 'draft',
      submittedAt: new Date().toISOString().slice(0, 10),
      validationHistory: [],
    }
    myLeaves.value.unshift(leave)
    allLeaves.value.unshift(leave)
  }

  function approveLeave(id: number, comment?: string) {
    const now  = new Date().toISOString()
    const vstep = step('n1', 'Sonia Boodhun', 'SB', 'approved', now, comment)
    const l = allLeaves.value.find(l => l.id === id)
    if (l) { l.status = 'approved'; l.validationHistory = [...(l.validationHistory ?? []).filter(s => s.action !== 'pending'), vstep] }
    const m = myLeaves.value.find(l => l.id === id)
    if (m) { m.status = 'approved'; m.validationHistory = [...(m.validationHistory ?? []).filter(s => s.action !== 'pending'), vstep] }
  }

  function rejectLeave(id: number, reason: string) {
    const now  = new Date().toISOString()
    const vstep = step('n1', 'Sonia Boodhun', 'SB', 'rejected', now, reason)
    const l = allLeaves.value.find(l => l.id === id)
    if (l) { l.status = 'rejected'; l.rejectionReason = reason; l.validationHistory = [...(l.validationHistory ?? []).filter(s => s.action !== 'pending'), vstep] }
    const m = myLeaves.value.find(l => l.id === id)
    if (m) { m.status = 'rejected'; m.rejectionReason = reason; m.validationHistory = [...(m.validationHistory ?? []).filter(s => s.action !== 'pending'), vstep] }
  }

  function returnLeave(id: number, comment: string) {
    const now  = new Date().toISOString()
    const vstep = step('n1', 'Sonia Boodhun', 'SB', 'returned', now, comment)
    const l = allLeaves.value.find(l => l.id === id)
    if (l) { l.status = 'returned'; l.returnComment = comment; l.validationHistory = [...(l.validationHistory ?? []).filter(s => s.action !== 'pending'), vstep] }
    const m = myLeaves.value.find(l => l.id === id)
    if (m) { m.status = 'returned'; m.returnComment = comment; m.validationHistory = [...(m.validationHistory ?? []).filter(s => s.action !== 'pending'), vstep] }
  }

  function markRegistered(id: number) {
    const l = allLeaves.value.find(l => l.id === id); if (l) l.status = 'registered'
    const m = myLeaves.value.find(l => l.id === id);  if (m) m.status = 'registered'
  }
  function markDone(id: number) {
    const l = allLeaves.value.find(l => l.id === id); if (l) l.status = 'done'
    const m = myLeaves.value.find(l => l.id === id);  if (m) m.status = 'done'
  }
  function markRegularized(id: number) {
    const l = allLeaves.value.find(l => l.id === id); if (l) l.status = 'regularized'
    const m = myLeaves.value.find(l => l.id === id);  if (m) m.status = 'regularized'
  }

  function cancelLeave(id: number) {
    const l = allLeaves.value.find(l => l.id === id); if (l) l.status = 'cancelled'
    const m = myLeaves.value.find(l => l.id === id);  if (m) m.status = 'cancelled'
  }

  function submitDraft(id: number) {
    const now = new Date().toISOString()
    const l = allLeaves.value.find(l => l.id === id)
    if (l && l.status === 'draft') {
      l.status = 'pending'
      l.validationHistory = [
        step('employee', l.employeeName, l.employeeInitials, 'submitted', now),
        step('n1', 'Sonia Boodhun', 'SB', 'pending', ''),
      ]
    }
    const m = myLeaves.value.find(l => l.id === id)
    if (m && m.status === 'draft') { m.status = 'pending'; m.validationHistory = l?.validationHistory ?? [] }
  }

  function deleteLeave(id: number) {
    allLeaves.value = allLeaves.value.filter(l => l.id !== id)
    myLeaves.value  = myLeaves.value.filter(l => l.id !== id)
  }

  return {
    allLeaves, myLeaves, pendingLeaves, myPendingLeaves,
    employeeBalances,
    leavesByStatus, leavesByType,
    submitLeave, saveDraft,
    approveLeave, rejectLeave, returnLeave,
    markRegistered, markDone, markRegularized,
    cancelLeave, submitDraft, deleteLeave,
    calculateWorkingDays,
  }
})
