import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types'

function calculateWorkingDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

let nextId = 11

export const useAbsenceStore = defineStore('absences', () => {
  const allLeaves = ref<LeaveRequest[]>([
    { id: 1,  employeeName: 'Aminata Diallo',     employeeInitials: 'AD', avatarColor: '#B5D4F4', avatarTextColor: '#0C447C', type: 'Congé annuel',    startDate: '2026-07-10', endDate: '2026-07-17', workingDays: 6,  status: 'pending',   submittedAt: '2026-06-20' },
    { id: 2,  employeeName: 'Kofi Mensah',         employeeInitials: 'KM', avatarColor: '#C0DD97', avatarTextColor: '#3B6D11', type: 'Congé maladie',   startDate: '2026-07-02', endDate: '2026-07-05', workingDays: 4,  status: 'pending',   submittedAt: '2026-07-01' },
    { id: 3,  employeeName: 'Fatou Sow',            employeeInitials: 'FS', avatarColor: '#F4C0D1', avatarTextColor: '#72243E', type: 'Récupération',    startDate: '2026-07-08', endDate: '2026-07-08', workingDays: 1,  status: 'approved',  submittedAt: '2026-06-25' },
    { id: 4,  employeeName: 'Jean-Pierre Mvondo',   employeeInitials: 'JP', avatarColor: '#FAC775', avatarTextColor: '#633806', type: 'Télétravail',     startDate: '2026-07-07', endDate: '2026-07-11', workingDays: 5,  status: 'pending',   submittedAt: '2026-06-28' },
    { id: 5,  employeeName: 'Rose Nkeng',           employeeInitials: 'RN', avatarColor: '#AFA9EC', avatarTextColor: '#3C3489', type: 'Congé maternité', startDate: '2026-07-01', endDate: '2026-09-30', workingDays: 65, status: 'approved',  submittedAt: '2026-05-15' },
    { id: 6,  employeeName: 'Ibrahim Touré',        employeeInitials: 'IT', avatarColor: '#B5D4F4', avatarTextColor: '#0C447C', type: 'Congé annuel',    startDate: '2026-08-04', endDate: '2026-08-15', workingDays: 10, status: 'pending',   submittedAt: '2026-06-30' },
    { id: 7,  employeeName: 'Nadia Eze',            employeeInitials: 'NE', avatarColor: '#C0DD97', avatarTextColor: '#3B6D11', type: 'Congé maladie',   startDate: '2026-06-15', endDate: '2026-06-17', workingDays: 3,  status: 'rejected',  rejectionReason: 'Certificat médical manquant', submittedAt: '2026-06-14' },
    { id: 8,  employeeName: 'Samuel Osei',          employeeInitials: 'SO', avatarColor: '#FAC775', avatarTextColor: '#633806', type: 'Récupération',    startDate: '2026-06-22', endDate: '2026-06-22', workingDays: 1,  status: 'approved',  submittedAt: '2026-06-18' },
    { id: 9,  employeeName: 'Mariama Bah',          employeeInitials: 'MB', avatarColor: '#F4C0D1', avatarTextColor: '#72243E', type: 'Télétravail',     startDate: '2026-07-14', endDate: '2026-07-18', workingDays: 5,  status: 'cancelled', submittedAt: '2026-06-29' },
    { id: 10, employeeName: 'Thierno Baldé',        employeeInitials: 'TB', avatarColor: '#AFA9EC', avatarTextColor: '#3C3489', type: 'Congé annuel',    startDate: '2026-09-01', endDate: '2026-09-12', workingDays: 10, status: 'draft',     submittedAt: '2026-06-01' },
  ])

  const myLeaves = ref<LeaveRequest[]>([
    { id: 101, employeeName: 'Ravi Nundlall', employeeInitials: 'RN', avatarColor: '#FAC775', avatarTextColor: '#633806', type: 'Congé annuel',  startDate: '2026-07-10', endDate: '2026-07-17', workingDays: 6, status: 'pending',  submittedAt: '2026-06-20' },
    { id: 102, employeeName: 'Ravi Nundlall', employeeInitials: 'RN', avatarColor: '#FAC775', avatarTextColor: '#633806', type: 'Récupération',  startDate: '2026-06-22', endDate: '2026-06-22', workingDays: 1, status: 'approved', submittedAt: '2026-06-18' },
    { id: 103, employeeName: 'Ravi Nundlall', employeeInitials: 'RN', avatarColor: '#FAC775', avatarTextColor: '#633806', type: 'Congé maladie', startDate: '2026-05-05', endDate: '2026-05-07', workingDays: 3, status: 'approved', submittedAt: '2026-05-04' },
  ])

  const pendingLeaves = computed(() => allLeaves.value.filter(l => l.status === 'pending'))
  const myPendingLeaves = computed(() => myLeaves.value.filter(l => l.status === 'pending'))

  function leavesByStatus(status: LeaveStatus) {
    return allLeaves.value.filter(l => l.status === status)
  }
  function leavesByType(type: LeaveType) {
    return allLeaves.value.filter(l => l.type === type)
  }

  function submitLeave(payload: { type: LeaveType; startDate: string; endDate: string; reason?: string }) {
    const leave: LeaveRequest = {
      id: nextId++,
      employeeName: 'Ravi Nundlall', employeeInitials: 'RN',
      avatarColor: '#FAC775', avatarTextColor: '#633806',
      type: payload.type, startDate: payload.startDate, endDate: payload.endDate,
      workingDays: calculateWorkingDays(payload.startDate, payload.endDate),
      reason: payload.reason, status: 'pending',
      submittedAt: new Date().toISOString().slice(0, 10),
    }
    myLeaves.value.unshift(leave)
    allLeaves.value.unshift(leave)
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
    }
    myLeaves.value.unshift(leave)
    allLeaves.value.unshift(leave)
  }

  function approveLeave(id: number) {
    const l = allLeaves.value.find(l => l.id === id); if (l) l.status = 'approved'
    const m = myLeaves.value.find(l => l.id === id);  if (m) m.status = 'approved'
  }

  function rejectLeave(id: number, reason: string) {
    const l = allLeaves.value.find(l => l.id === id); if (l) { l.status = 'rejected'; l.rejectionReason = reason }
    const m = myLeaves.value.find(l => l.id === id);  if (m) { m.status = 'rejected'; m.rejectionReason = reason }
  }

  function cancelLeave(id: number) {
    const l = allLeaves.value.find(l => l.id === id); if (l) l.status = 'cancelled'
    const m = myLeaves.value.find(l => l.id === id);  if (m) m.status = 'cancelled'
  }

  function submitDraft(id: number) {
    const l = allLeaves.value.find(l => l.id === id); if (l && l.status === 'draft') l.status = 'pending'
    const m = myLeaves.value.find(l => l.id === id);  if (m && m.status === 'draft') m.status = 'pending'
  }

  function deleteLeave(id: number) {
    allLeaves.value = allLeaves.value.filter(l => l.id !== id)
    myLeaves.value  = myLeaves.value.filter(l => l.id !== id)
  }

  return {
    allLeaves, myLeaves, pendingLeaves, myPendingLeaves,
    leavesByStatus, leavesByType,
    submitLeave, saveDraft, approveLeave, rejectLeave, cancelLeave,
    submitDraft, deleteLeave,
    calculateWorkingDays,
  }
})
