import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CompanyCalendar, EmployeeSchedule, WorkingDays, WorkingHours,
  Holiday, LeaveRule, LeaveType, PerdiemRate,
} from '../types'

let holidayCounter = 20

export const useCalendarStore = defineStore('calendar', () => {
  const calendar = ref<CompanyCalendar>({
    id: 'cal-001',
    workingDays: {
      monday:    { enabled: true,  start: '08:00', end: '17:30', breakEnabled: true,  breakStart: '12:00', breakEnd: '14:00' },
      tuesday:   { enabled: true,  start: '08:00', end: '17:30', breakEnabled: true,  breakStart: '12:00', breakEnd: '14:00' },
      wednesday: { enabled: true,  start: '08:00', end: '17:30', breakEnabled: true,  breakStart: '12:00', breakEnd: '14:00' },
      thursday:  { enabled: true,  start: '08:00', end: '17:30', breakEnabled: true,  breakStart: '12:00', breakEnd: '14:00' },
      friday:    { enabled: true,  start: '08:00', end: '17:30', breakEnabled: true,  breakStart: '12:00', breakEnd: '14:00' },
      saturday:  { enabled: false, start: '08:00', end: '12:00', breakEnabled: false, breakStart: '',      breakEnd: ''      },
      sunday:    { enabled: false, start: '08:00', end: '12:00', breakEnabled: false, breakStart: '',      breakEnd: ''      },
    },
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
    perdiemRates: [
      { id: 'pd1', category: 'Cadre supérieur',   ratePerDay: 150000, currency: 'MGA', description: 'Direction / Cadres A — valeur provisoire' },
      { id: 'pd2', category: 'Cadre',              ratePerDay: 100000, currency: 'MGA', description: 'Cadres B — valeur provisoire' },
      { id: 'pd3', category: 'Agent de maîtrise',  ratePerDay:  75000, currency: 'MGA', description: 'Agents de maîtrise — valeur provisoire' },
      { id: 'pd4', category: 'Employé',             ratePerDay:  50000, currency: 'MGA', description: 'Employés de base — valeur provisoire' },
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

  function updateWorkingHours(hours: WorkingHours) {
    // Apply the same break times to all enabled days
    const days = calendar.value.workingDays
    for (const key of Object.keys(days) as (keyof WorkingDays)[]) {
      if (days[key].enabled) {
        days[key].start      = hours.start
        days[key].end        = hours.end
        days[key].breakStart = hours.breakStart
        days[key].breakEnd   = hours.breakEnd
      }
    }
    calendar.value.updatedAt = new Date().toISOString().slice(0, 10)
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

  // ── Perdiem actions ───────────────────────────────────────────
  function getPerdiemRate(category: string): PerdiemRate | undefined {
    return (calendar.value.perdiemRates ?? []).find(r => r.category === category)
  }

  function addPerdiemRate(rate: Omit<PerdiemRate, 'id'>) {
    const id = `pd${Date.now()}`
    calendar.value.perdiemRates = [...(calendar.value.perdiemRates ?? []), { ...rate, id }]
  }

  function updatePerdiemRate(id: string, data: Partial<PerdiemRate>) {
    const list = calendar.value.perdiemRates ?? []
    const idx  = list.findIndex(r => r.id === id)
    if (idx !== -1) list[idx] = { ...list[idx], ...data } as PerdiemRate
  }

  function removePerdiemRate(id: string) {
    calendar.value.perdiemRates = (calendar.value.perdiemRates ?? []).filter(r => r.id !== id)
  }

  return {
    calendar,
    employeeSchedules,
    workingHolidays,
    annualHolidays,
    ponctualHolidays,
    getLeaveRule,
    getHolidaysForYear,
    getPerdiemRate,
    updateWorkingDays,
    updateWorkingHours,
    addHoliday,
    removeHoliday,
    updateHoliday,
    updateLeaveRule,
    addPerdiemRate,
    updatePerdiemRate,
    removePerdiemRate,
  }
})
