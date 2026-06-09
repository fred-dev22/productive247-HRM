import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExpenseReport, ExpenseLine, ExpenseStatus, ValidationStep } from '../types'

function step(
  level: ValidationStep['level'],
  actorName: string, actorInitials: string,
  action: ValidationStep['action'],
  date: string, comment?: string,
): ValidationStep {
  return { level, actorName, actorInitials, action, date, comment }
}

let reportCounter = 3

export const useExpenseStore = defineStore('expenses', () => {
  const reports = ref<ExpenseReport[]>([
    {
      id: 'nf-001', code: 'NF-2026-001',
      employeeId: 'emp-006', employeeName: 'Jean-Claude Rakotomalala', employeeInitials: 'JC',
      title: 'Mission Antananarivo – Mai 2026',
      lines: [
        { id: 'l1', date: '2026-05-10', category: 'transport',    description: 'Billet avion MRU-TNR', amount: 450000, currency: 'MGA', receipt: true },
        { id: 'l2', date: '2026-05-10', category: 'hebergement',  description: 'Hôtel Carlton 2 nuits',amount: 280000, currency: 'MGA', receipt: true },
        { id: 'l3', date: '2026-05-11', category: 'repas',        description: 'Déjeuner client',      amount:  45000, currency: 'MGA', receipt: true },
        { id: 'l4', date: '2026-05-12', category: 'transport',    description: 'Taxi aéroport',         amount:  25000, currency: 'MGA', receipt: false },
      ],
      totalAmount: 800000, currency: 'MGA', status: 'pending',
      submittedAt: '2026-05-15', createdAt: '2026-05-14',
      validationHistory: [
        step('employee', 'Jean-Claude Rakotomalala', 'JC', 'submitted', '2026-05-15T09:00:00'),
        step('n1', 'Ravi Dhondoo', 'RD', 'pending', ''),
      ],
    },
    {
      id: 'nf-002', code: 'NF-2026-002',
      employeeId: 'emp-009', employeeName: 'Morad Cassam', employeeInitials: 'MC',
      title: 'Déplacement site terminal – Juin 2026',
      lines: [
        { id: 'l5', date: '2026-06-01', category: 'carburant',    description: 'Essence véhicule personnel', amount: 12000, currency: 'MGA', receipt: true },
        { id: 'l6', date: '2026-06-01', category: 'repas',        description: 'Repas sur site',             amount:  8000, currency: 'MGA', receipt: false },
      ],
      totalAmount: 20000, currency: 'MGA', status: 'approved',
      submittedAt: '2026-06-02', createdAt: '2026-06-01',
      validationHistory: [
        step('employee', 'Morad Cassam', 'MC', 'submitted', '2026-06-02T08:00:00'),
        step('n1', 'Kumar Gunness', 'KG', 'approved', '2026-06-03T10:00:00', 'OK'),
      ],
    },
    {
      id: 'nf-003', code: 'NF-2026-003',
      employeeId: 'emp-011', employeeName: 'Fiona Mungroo', employeeInitials: 'FM',
      title: 'Frais logistique – Mars 2026',
      lines: [
        { id: 'l7', date: '2026-03-15', category: 'fournitures',  description: 'Matériel de bureau',        amount: 35000, currency: 'MGA', receipt: true },
        { id: 'l8', date: '2026-03-18', category: 'communication', description: 'Appels client',           amount:  5000, currency: 'MGA', receipt: false },
      ],
      totalAmount: 40000, currency: 'MGA', status: 'draft',
      createdAt: '2026-03-20',
      validationHistory: [],
    },
  ])

  const pendingReports = computed(() => reports.value.filter(r => r.status === 'pending'))

  function getById(id: string) { return reports.value.find(r => r.id === id) }

  function myReports(employeeId: string) {
    return reports.value.filter(r => r.employeeId === employeeId)
  }

  function createReport(payload: Omit<ExpenseReport, 'id' | 'code' | 'status' | 'createdAt' | 'validationHistory'>) {
    const id   = `nf-${String(++reportCounter).padStart(3, '0')}`
    const code = `NF-${new Date().getFullYear()}-${String(reportCounter).padStart(3, '0')}`
    const r: ExpenseReport = {
      ...payload,
      id, code,
      status: 'draft',
      createdAt: new Date().toISOString().slice(0, 10),
      validationHistory: [],
    }
    reports.value.push(r)
    return r
  }

  function submitReport(id: string) {
    const r = reports.value.find(r => r.id === id)
    if (r && r.status === 'draft') {
      r.status      = 'pending'
      r.submittedAt = new Date().toISOString().slice(0, 10)
    }
  }

  function approveReport(id: string) {
    const r = reports.value.find(r => r.id === id)
    if (r) r.status = 'approved'
  }

  function rejectReport(id: string, reason: string) {
    const r = reports.value.find(r => r.id === id)
    if (r) { r.status = 'rejected'; r.rejectionReason = reason }
  }

  function updateLines(id: string, lines: ExpenseLine[]) {
    const r = reports.value.find(r => r.id === id)
    if (r) {
      r.lines       = lines
      r.totalAmount = lines.reduce((s, l) => s + l.amount, 0)
    }
  }

  return {
    reports, pendingReports,
    getById, myReports,
    createReport, submitReport, approveReport, rejectReport, updateLines,
  }
})
