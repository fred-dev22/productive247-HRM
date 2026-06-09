import type {
  CompanyCalendar, WorkingDays, DayPlanning, LeaveType, LeaveStatus,
} from '../types'

const DAY_KEYS: (keyof WorkingDays)[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
]

function parseLocal(dateStr: string): Date {
  const p = dateStr.split('-').map(Number)
  return new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1)
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isHoliday(
  date: Date,
  calendar: CompanyCalendar,
): { isHoliday: boolean; name?: string } {
  const yyyy      = date.getFullYear()
  const mm        = String(date.getMonth() + 1).padStart(2, '0')
  const dd        = String(date.getDate()).padStart(2, '0')
  const fullDate  = `${yyyy}-${mm}-${dd}`
  const monthDay  = `${mm}-${dd}`

  for (const h of calendar.holidays) {
    if (h.isRecurring  && h.date === monthDay)  return { isHoliday: true, name: h.name }
    if (!h.isRecurring && h.date === fullDate)  return { isHoliday: true, name: h.name }
  }
  return { isHoliday: false }
}

export function isWorkingDay(date: Date, calendar: CompanyCalendar): boolean {
  const dayKey    = DAY_KEYS[date.getDay()] as keyof WorkingDays
  const dayConfig = calendar.workingDays[dayKey]
  if (!dayConfig.enabled) return false
  return !isHoliday(date, calendar).isHoliday
}

export function calculateEndDate(
  startDate:   string,
  workingDays: number,
  calendar:    CompanyCalendar,
  startPeriod: 'full' | 'am' | 'pm' = 'full',
): {
  endDate:           string
  endPeriod:         'full' | 'am' | 'pm'
  resumeDate:        string
  actualWorkingDays: number
} {
  let count          = startPeriod === 'full' ? 0 : 0.5
  const increment    = startPeriod === 'full' ? 1 : 0.5
  let current        = parseLocal(startDate)
  let lastWorkingDay = parseLocal(startDate)

  if (isWorkingDay(current, calendar)) {
    count += increment
    lastWorkingDay = new Date(current)
  }

  while (count < workingDays) {
    current = new Date(current)
    current.setDate(current.getDate() + 1)
    if (isWorkingDay(current, calendar)) {
      const remaining = workingDays - count
      if (remaining <= 0.5) {
        count += 0.5
        lastWorkingDay = new Date(current)
        break
      }
      count += 1
      lastWorkingDay = new Date(current)
    }
  }

  const resumeDay = new Date(lastWorkingDay)
  resumeDay.setDate(resumeDay.getDate() + 1)
  while (!isWorkingDay(resumeDay, calendar)) {
    resumeDay.setDate(resumeDay.getDate() + 1)
  }

  return {
    endDate:           fmt(lastWorkingDay),
    endPeriod:         count % 1 === 0.5 ? 'am' : 'full',
    resumeDate:        fmt(resumeDay),
    actualWorkingDays: count,
  }
}

export function getWorkingDaysBetween(
  startDate: string,
  endDate:   string,
  calendar:  CompanyCalendar,
): number {
  let count = 0
  const current = parseLocal(startDate)
  const end     = parseLocal(endDate)
  while (current <= end) {
    if (isWorkingDay(current, calendar)) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function generateWeekPlanning(
  weekStart: string,
  calendar:  CompanyCalendar,
  absences:  Array<{
    startDate: string
    endDate:   string
    type:      LeaveType
    status:    LeaveStatus
  }>,
): DayPlanning[] {
  const days  : DayPlanning[] = []
  const anchor = parseLocal(weekStart)

  for (let i = 0; i < 7; i++) {
    const current  = parseLocal(weekStart)
    current.setDate(anchor.getDate() + i)

    const dateStr       = fmt(current)
    const holidayCheck  = isHoliday(current, calendar)
    const working       = isWorkingDay(current, calendar)
    const dayKey        = DAY_KEYS[current.getDay()] as keyof WorkingDays
    const dayConfig     = calendar.workingDays[dayKey]

    const absence = absences.find(
      a =>
        a.startDate <= dateStr &&
        a.endDate   >= dateStr &&
        (a.status === 'approved' || a.status === 'pending'),
    )

    days.push({
      date:          dateStr,
      isWorkingDay:  working,
      isHoliday:     holidayCheck.isHoliday,
      holidayName:   holidayCheck.name,
      isAbsence:     !!absence,
      absenceType:   absence?.type,
      absenceStatus: absence?.status,
      hours: working ? {
        start:      dayConfig.start,
        end:        dayConfig.end,
        breakStart: dayConfig.breakEnabled ? dayConfig.breakStart : '',
        breakEnd:   dayConfig.breakEnabled ? dayConfig.breakEnd   : '',
      } : undefined,
    })
  }
  return days
}
