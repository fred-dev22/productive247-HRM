import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CompanyCalendar, EmployeeSchedule, WorkingDays,
  Holiday, LeaveRule, LeaveType,
} from '../types'

let holidayCounter = 20

export const useCalendarStore = defineStore('calendar', () => {
  const calendar = ref<CompanyCalendar>({
    id: 'cal-001',
    workingDays: {
      monday:    { enabled: true,  start: '08:00', end: '17:30' },
      tuesday:   { enabled: true,  start: '08:00', end: '17:30' },
      wednesday: { enabled: true,  start: '08:00', end: '17:30' },
      thursday:  { enabled: true,  start: '08:00', end: '17:30' },
      friday:    { enabled: true,  start: '08:00', end: '17:30' },
      saturday:  { enabled: false, start: '08:00', end: '12:00' },
      sunday:    { enabled: false, start: '08:00', end: '12:00' },
    },
    breakStart: '12:00',
    breakEnd:   '14:00',
    holidays: [
      { id: 'h1',  name: "Jour de l'An",      date: '01-01',      type: 'annual',   isRecurring: true  },
      { id: 'h2',  name: 'Lundi de Pâques',   date: '2026-04-06', type: 'ponctual', isRecurring: false },
      { id: 'h3',  name: 'Fête du Travail',   date: '05-01',      type: 'annual',   isRecurring: true  },
      { id: 'h4',  name: 'Assomption',        date: '08-15',      type: 'annual',   isRecurring: true  },
      { id: 'h5',  name: 'Noël',              date: '12-25',      type: 'annual',   isRecurring: true  },
      { id: 'h13', name: 'Aïd el-Fitr 2026', date: '2026-03-30', type: 'ponctual', isRecurring: false },
      { id: 'h14', name: 'Aïd el-Adha 2026', date: '2026-06-06', type: 'ponctual', isRecurring: false },
    ],
    leaveRules: [
      { type: 'Congé annuel',              daysPerYear: 24, daysPerMonth: 2,  maxCarryOver: 5,  requiresDocument: false, noticeDays: 7  },
      { type: 'Congé maladie',             daysPerYear: 8,                    maxCarryOver: 0,  requiresDocument: true,  noticeDays: 0  },
      { type: 'Congé maternité',           daysPerYear: 90,                   maxCarryOver: 0,  requiresDocument: true,  noticeDays: 30 },
      { type: 'Récupération',              daysPerYear: 0,                    maxCarryOver: 10, requiresDocument: false, noticeDays: 1  },
      { type: 'Assistance parentale',      daysPerYear: 5,                    maxCarryOver: 0,  requiresDocument: true,  noticeDays: 2  },
      { type: 'Permission exceptionnelle', daysPerYear: 5,                    maxCarryOver: 0,  requiresDocument: false, noticeDays: 1  },
      { type: 'Télétravail',               daysPerYear: 0,                    maxCarryOver: 0,  requiresDocument: false, noticeDays: 1  },
    ],
    updatedAt: '2026-01-15',
    updatedBy: 'David Djouboui',
  })

  const employeeSchedules = ref<EmployeeSchedule[]>([])

  // ── Getters ───────────────────────────────────────────────────
  const workingHolidays = computed(() =>
    [...calendar.value.holidays].sort((a, b) => a.date.localeCompare(b.date)),
  )

  const annualHolidays = computed(() =>
    calendar.value.holidays.filter(h => h.isRecurring),
  )

  const ponctualHolidays = computed(() =>
    calendar.value.holidays.filter(h => !h.isRecurring),
  )

  function getLeaveRule(type: LeaveType): LeaveRule | undefined {
    return calendar.value.leaveRules.find(r => r.type === type)
  }

  function getHolidaysForYear(year: number): Holiday[] {
    return calendar.value.holidays
      .map(h => {
        if (h.isRecurring) return { ...h, date: `${year}-${h.date}` }
        if (h.date.startsWith(`${year}-`)) return h
        return null
      })
      .filter((h): h is Holiday => h !== null)
  }

  // ── Actions ───────────────────────────────────────────────────
  function updateWorkingDays(days: WorkingDays) {
    calendar.value.workingDays = { ...days }
    calendar.value.updatedAt   = new Date().toISOString().slice(0, 10)
  }

  function updateBreak(breakStart: string, breakEnd: string) {
    calendar.value.breakStart = breakStart
    calendar.value.breakEnd   = breakEnd
    calendar.value.updatedAt  = new Date().toISOString().slice(0, 10)
  }

  function addHoliday(holiday: Omit<Holiday, 'id'>) {
    const id = `h${++holidayCounter}`
    calendar.value.holidays.push({ ...holiday, id })
  }

  function removeHoliday(id: string) {
    calendar.value.holidays = calendar.value.holidays.filter(h => h.id !== id)
  }

  function updateHoliday(id: string, data: Partial<Holiday>) {
    const idx = calendar.value.holidays.findIndex(h => h.id === id)
    if (idx !== -1) {
      calendar.value.holidays[idx] = { ...calendar.value.holidays[idx], ...data } as Holiday
    }
  }

  function updateLeaveRule(type: LeaveType, rule: Partial<LeaveRule>) {
    const idx = calendar.value.leaveRules.findIndex(r => r.type === type)
    if (idx !== -1) {
      calendar.value.leaveRules[idx] = { ...calendar.value.leaveRules[idx], ...rule } as LeaveRule
    }
  }

  return {
    calendar,
    employeeSchedules,
    workingHolidays,
    annualHolidays,
    ponctualHolidays,
    getLeaveRule,
    getHolidaysForYear,
    updateWorkingDays,
    updateBreak,
    addHoliday,
    removeHoliday,
    updateHoliday,
    updateLeaveRule,
  }
})
