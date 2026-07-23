import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'
import type {
  CompanyCalendar, WorkingDays, WorkingHours,
  Holiday, HolidayScope, LeaveRule, LeaveType, PerdiemRate,
} from '../types'

// ── Backend <-> frontend mapping ────────────────────────────────
// Calendar.workDays is a normalized one-row-per-day table server-side
// (productive247-hrm-backend: CalendarWorkDay); the frontend keeps working
// with the friendlier WorkingDays object (keyed by day, "HH:MM" strings) —
// the store is the only place that translates between the two.
interface BackendWorkDay {
  Id?: string
  DayOfWeek: string
  IsEnabled: boolean
  StartTime: string | null
  EndTime: string | null
  BreakEnabled: boolean
  BreakStartTime: string | null
  BreakEndTime: string | null
}
interface BackendCalendar {
  Id: string
  Name: string
  IsDefault: boolean
  CreatedBy: string
  CreatedAt: string
  ModifiedBy: string | null
  ModifiedAt: string | null
  workDays: BackendWorkDay[]
}
interface BackendHoliday {
  Id: string
  Name: string
  Date: string
  IsRecurring: boolean
  HolidayType: HolidayScope
  OrganizationUnitId: string | null
  CreatedBy: string
  CreatedAt: string
}

const DAY_KEY_TO_BACKEND: Record<keyof WorkingDays, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}
const BACKEND_TO_DAY_KEY = Object.fromEntries(
  Object.entries(DAY_KEY_TO_BACKEND).map(([k, v]) => [v, k]),
) as Record<string, keyof WorkingDays>

function isoToHHMM(iso: string | null): string {
  return iso ? iso.slice(11, 16) : ''
}
function hhmmToIso(hhmm: string): string {
  return `2000-01-01T${hhmm || '00:00'}:00.000Z`
}

const EMPTY_DAY = { enabled: false, start: '', end: '', breakEnabled: false, breakStart: '', breakEnd: '' }
function emptyWorkingDays(): WorkingDays {
  return {
    monday: { ...EMPTY_DAY }, tuesday: { ...EMPTY_DAY }, wednesday: { ...EMPTY_DAY },
    thursday: { ...EMPTY_DAY }, friday: { ...EMPTY_DAY }, saturday: { ...EMPTY_DAY }, sunday: { ...EMPTY_DAY },
  }
}

function mapWorkingDaysFromBackend(workDays: BackendWorkDay[]): WorkingDays {
  const result = emptyWorkingDays()
  for (const wd of workDays) {
    const key = BACKEND_TO_DAY_KEY[wd.DayOfWeek]
    if (!key) continue
    result[key] = {
      enabled: wd.IsEnabled,
      start: isoToHHMM(wd.StartTime),
      end: isoToHHMM(wd.EndTime),
      breakEnabled: wd.BreakEnabled,
      breakStart: isoToHHMM(wd.BreakStartTime),
      breakEnd: isoToHHMM(wd.BreakEndTime),
    }
  }
  return result
}

function mapWorkingDaysToBackend(workingDays: WorkingDays): BackendWorkDay[] {
  return (Object.keys(DAY_KEY_TO_BACKEND) as (keyof WorkingDays)[]).map((key) => {
    const day = workingDays[key]
    return {
      DayOfWeek: DAY_KEY_TO_BACKEND[key],
      IsEnabled: day.enabled,
      StartTime: day.enabled ? hhmmToIso(day.start) : null,
      EndTime: day.enabled ? hhmmToIso(day.end) : null,
      BreakEnabled: day.enabled && day.breakEnabled,
      BreakStartTime: day.enabled && day.breakEnabled ? hhmmToIso(day.breakStart) : null,
      BreakEndTime: day.enabled && day.breakEnabled ? hhmmToIso(day.breakEnd) : null,
    }
  })
}

function mapHoliday(raw: BackendHoliday): Holiday {
  return {
    id: raw.Id,
    name: raw.Name,
    date: raw.Date.slice(0, 10),
    isRecurring: raw.IsRecurring,
    holidayType: raw.HolidayType,
    organizationUnitId: raw.OrganizationUnitId ?? undefined,
  }
}

export const useCalendarStore = defineStore('calendar', () => {
  // ── State ────────────────────────────────────────────────────
  const calendarId   = ref('')
  const calendarName = ref('Calendrier standard Galana')
  const isDefault    = ref(true)
  const workingDays  = ref<WorkingDays>(emptyWorkingDays())
  const updatedAt    = ref('')
  const updatedBy    = ref('')

  const holidays = ref<Holiday[]>([])

  const loading = ref(false)
  const error   = ref<string | null>(null)

  // Not backed by an endpoint in this pass — LeaveType (Domaine 3) et
  // ExpenseConfig couvriront respectivement les regles de conge et les
  // perdiems reels. Conserves ici, mock, pour ne pas casser les vues qui
  // les consomment encore.
  const leaveRules = ref<LeaveRule[]>([
    { type: 'Congé annuel',              daysPerYear: 24, daysPerMonth: 2,  maxCarryOver: 5,  requiresDocument: false, noticeDays: 7  },
    { type: 'Congé maladie',             daysPerYear: 8,                    maxCarryOver: 0,  requiresDocument: true,  noticeDays: 0  },
    { type: 'Congé maternité',           daysPerYear: 90,                   maxCarryOver: 0,  requiresDocument: true,  noticeDays: 30 },
    { type: 'Récupération',              daysPerYear: 0,                    maxCarryOver: 10, requiresDocument: false, noticeDays: 1  },
    { type: 'Assistance parentale',      daysPerYear: 5,                    maxCarryOver: 0,  requiresDocument: true,  noticeDays: 2  },
    { type: 'Permission exceptionnelle', daysPerYear: 5,                    maxCarryOver: 0,  requiresDocument: false, noticeDays: 1  },
    { type: 'Télétravail',               daysPerYear: 0,                    maxCarryOver: 0,  requiresDocument: false, noticeDays: 1  },
  ])
  const perdiemRates = ref<PerdiemRate[]>([
    { id: 'pd1', category: 'Cadre supérieur',   ratePerDay: 150000, currency: 'MGA', description: 'Direction / Cadres A — valeur provisoire' },
    { id: 'pd2', category: 'Cadre',              ratePerDay: 100000, currency: 'MGA', description: 'Cadres B — valeur provisoire' },
    { id: 'pd3', category: 'Agent de maîtrise',  ratePerDay:  75000, currency: 'MGA', description: 'Agents de maîtrise — valeur provisoire' },
    { id: 'pd4', category: 'Employé',             ratePerDay:  50000, currency: 'MGA', description: 'Employés de base — valeur provisoire' },
  ])

  // Vue agregee retro-compatible avec l'ancien CompanyCalendar mocke —
  // utils/calendar.ts et plusieurs composants (AbsenceRequestModal,
  // EmployeePlanningView) attendent workingDays + holidays sur un seul objet.
  const calendar = computed<CompanyCalendar>(() => ({
    id: calendarId.value,
    workingDays: workingDays.value,
    holidays: holidays.value,
    leaveRules: leaveRules.value,
    perdiemRates: perdiemRates.value,
    updatedAt: updatedAt.value,
    updatedBy: updatedBy.value,
  }))

  // ── Getters ───────────────────────────────────────────────────
  const annualHolidays   = computed(() => holidays.value.filter(h => h.isRecurring))
  const ponctualHolidays = computed(() => holidays.value.filter(h => !h.isRecurring))

  const DAY_KEYS: (keyof WorkingDays)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ]

  function toMinutes(t: string): number {
    if (!t) return 0
    const p = t.split(':').map(Number)
    return (p[0] ?? 0) * 60 + (p[1] ?? 0)
  }

  function formatMinutes(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
  }

  const daysPerWeek = computed(() =>
    DAY_KEYS.filter(k => workingDays.value[k].enabled).length,
  )

  const weeklyMinutes = computed(() =>
    DAY_KEYS.reduce((total, key) => {
      const day = workingDays.value[key]
      if (!day.enabled) return total
      const work  = toMinutes(day.end) - toMinutes(day.start)
      const pause = day.breakEnabled ? toMinutes(day.breakEnd) - toMinutes(day.breakStart) : 0
      return total + Math.max(0, work - pause)
    }, 0),
  )

  function getLeaveRule(type: LeaveType): LeaveRule | undefined {
    return leaveRules.value.find(r => r.type === type)
  }

  // ── Actions — Calendar / WorkingDays ────────────────────────────
  async function fetchCalendar() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendCalendar>('/calendars/default')
      calendarId.value   = data.Id
      calendarName.value = data.Name
      isDefault.value    = data.IsDefault
      workingDays.value  = mapWorkingDaysFromBackend(data.workDays)
      updatedAt.value    = (data.ModifiedAt ?? data.CreatedAt).slice(0, 10)
      updatedBy.value    = data.ModifiedBy ?? data.CreatedBy
    } catch (err) {
      // Pas encore de calendrier par defaut (ex: toute nouvelle instance,
      // avant que l'onboarding n'en cree un) — pas bloquant, on garde les
      // valeurs locales par defaut plutot que de casser les appelants.
      error.value = "Aucun calendrier n'est encore configuré"
    } finally {
      loading.value = false
    }
  }

  async function updateWorkingDays(days: WorkingDays) {
    workingDays.value = { ...days }
    if (!calendarId.value) return
    error.value = null
    try {
      const { data } = await api.patch<BackendCalendar>(`/calendars/${calendarId.value}`, {
        WorkDays: mapWorkingDaysToBackend(days),
      })
      workingDays.value = mapWorkingDaysFromBackend(data.workDays)
      updatedAt.value    = (data.ModifiedAt ?? data.CreatedAt).slice(0, 10)
      updatedBy.value    = data.ModifiedBy ?? data.CreatedBy
    } catch (err) {
      error.value = 'Impossible de mettre à jour les jours ouvrables'
      throw err
    }
  }

  async function updateWorkingHours(hours: WorkingHours) {
    const days = { ...workingDays.value }
    for (const key of Object.keys(days) as (keyof WorkingDays)[]) {
      if (days[key].enabled) {
        days[key] = { ...days[key], start: hours.start, end: hours.end, breakStart: hours.breakStart, breakEnd: hours.breakEnd }
      }
    }
    await updateWorkingDays(days)
  }

  // ── Actions — Holidays ───────────────────────────────────────────
  async function fetchHolidays(year: number, organizationUnitId?: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendHoliday[]>(`/holidays/year/${year}`, {
        params: organizationUnitId ? { organizationUnitId } : undefined,
      })
      holidays.value = data.map(mapHoliday)
    } catch (err) {
      error.value = 'Impossible de charger les jours fériés'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addHoliday(holiday: Omit<Holiday, 'id'>) {
    error.value = null
    try {
      const { data } = await api.post<BackendHoliday>('/holidays', {
        Name: holiday.name,
        Date: holiday.date,
        IsRecurring: holiday.isRecurring,
        HolidayType: holiday.holidayType,
        OrganizationUnitId: holiday.organizationUnitId ?? undefined,
      })
      const mapped = mapHoliday(data)
      holidays.value.push(mapped)
      return mapped
    } catch (err) {
      error.value = "Impossible de créer le jour férié"
      throw err
    }
  }

  async function removeHoliday(id: string) {
    error.value = null
    try {
      await api.delete(`/holidays/${id}`)
      holidays.value = holidays.value.filter(h => h.id !== id)
    } catch (err) {
      error.value = 'Impossible de supprimer le jour férié'
      throw err
    }
  }

  async function updateHoliday(id: string, data: Partial<Holiday>) {
    error.value = null
    try {
      const body: Record<string, unknown> = {}
      if (data.name !== undefined) body.Name = data.name
      if (data.date !== undefined) body.Date = data.date
      if (data.isRecurring !== undefined) body.IsRecurring = data.isRecurring
      if (data.holidayType !== undefined) body.HolidayType = data.holidayType
      if (data.organizationUnitId !== undefined) body.OrganizationUnitId = data.organizationUnitId
      const { data: updated } = await api.patch<BackendHoliday>(`/holidays/${id}`, body)
      const mapped = mapHoliday(updated)
      const idx = holidays.value.findIndex(h => h.id === id)
      if (idx !== -1) holidays.value[idx] = mapped
      return mapped
    } catch (err) {
      error.value = 'Impossible de mettre à jour le jour férié'
      throw err
    }
  }

  // ── Actions — Leave rules (mock, Domaine 3 les remplacera) ────────
  function updateLeaveRule(type: LeaveType, rule: Partial<LeaveRule>) {
    const idx = leaveRules.value.findIndex(r => r.type === type)
    if (idx !== -1) {
      leaveRules.value[idx] = { ...leaveRules.value[idx], ...rule } as LeaveRule
    }
  }

  // ── Actions — Perdiem (mock, hors perimetre de cette passe) ───────
  function getPerdiemRate(category: string): PerdiemRate | undefined {
    return perdiemRates.value.find(r => r.category === category)
  }
  function addPerdiemRate(rate: Omit<PerdiemRate, 'id'>) {
    const id = `pd${Date.now()}`
    perdiemRates.value = [...perdiemRates.value, { ...rate, id }]
  }
  function updatePerdiemRate(id: string, data: Partial<PerdiemRate>) {
    const idx = perdiemRates.value.findIndex(r => r.id === id)
    if (idx !== -1) perdiemRates.value[idx] = { ...perdiemRates.value[idx], ...data } as PerdiemRate
  }
  function removePerdiemRate(id: string) {
    perdiemRates.value = perdiemRates.value.filter(r => r.id !== id)
  }

  return {
    calendar,
    holidays,
    loading,
    error,
    annualHolidays,
    ponctualHolidays,
    daysPerWeek,
    weeklyMinutes,
    toMinutes,
    formatMinutes,
    getLeaveRule,
    getPerdiemRate,
    fetchCalendar,
    updateWorkingDays,
    updateWorkingHours,
    fetchHolidays,
    addHoliday,
    removeHoliday,
    updateHoliday,
    updateLeaveRule,
    addPerdiemRate,
    updatePerdiemRate,
    removePerdiemRate,
  }
})
