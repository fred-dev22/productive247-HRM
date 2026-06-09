<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">
  <div class="planning-view">

    <!-- ── En-tête ── -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Mon Planning</h1>
        <span class="month-badge">{{ monthYearLabel }}</span>
      </div>

      <div class="week-nav">
        <button class="nav-btn" @click="prevWeek" title="Semaine précédente">
          <i class="ti ti-chevron-left" aria-hidden="true"></i>
        </button>
        <span class="week-label">{{ weekRangeLabel }}</span>
        <button class="nav-btn" @click="nextWeek" title="Semaine suivante">
          <i class="ti ti-chevron-right" aria-hidden="true"></i>
        </button>
        <button class="btn btn-outline btn-sm" @click="goToday">Aujourd'hui</button>
      </div>
    </div>

    <!-- ── Grille semaine ── -->
    <div class="week-scroll">
      <div class="week-grid">
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="day-card"
          :class="[dayCardClass(day), { 'day-card--today': day.date === today }]"
        >

          <!-- En-tête du jour -->
          <div class="day-card-header" :class="{ 'day-card-header--today': day.date === today }">
            <span class="day-abbr" :class="{ 'day-abbr--today': day.date === today }">{{ dayAbbr(day.date) }}</span>
            <span class="day-num"  :class="{ 'day-num--today':  day.date === today }">{{ dayNum(day.date) }}</span>
            <span v-if="day.date === today" class="today-badge">Aujourd'hui</span>
          </div>

          <!-- Jour ouvrable normal -->
          <template v-if="day.isWorkingDay && !day.isAbsence && !day.isHoliday">
            <div class="day-card-body">
              <div class="day-info-row">
                <i class="ti ti-clock" aria-hidden="true"></i>
                <span>{{ day.hours?.start }} → {{ day.hours?.end }}</span>
              </div>
              <div class="day-info-row">
                <i class="ti ti-coffee" aria-hidden="true"></i>
                <span>Pause {{ day.hours?.breakStart }} → {{ day.hours?.breakEnd }}</span>
              </div>
              <div class="day-subtotal">{{ effectiveHoursLabel(day.hours) }} effectives</div>
            </div>
          </template>

          <!-- Jour absent (congé approuvé) -->
          <template v-else-if="day.isAbsence && day.absenceStatus === 'approved'">
            <div class="day-card-body day-card-body--centered">
              <span class="absence-badge">{{ day.absenceType }}</span>
              <span class="status-pill status-pill--approved">Approuvé</span>
            </div>
          </template>

          <!-- Jour absent (congé en attente) -->
          <template v-else-if="day.isAbsence && day.absenceStatus === 'pending'">
            <div class="day-card-body day-card-body--centered">
              <span class="absence-badge absence-badge--pending">{{ day.absenceType }}</span>
              <span class="status-pill status-pill--pending">En attente de validation</span>
            </div>
          </template>

          <!-- Jour férié -->
          <template v-else-if="day.isHoliday">
            <div class="day-card-body day-card-body--centered">
              <span class="holiday-name">{{ day.holidayName }}</span>
              <span class="status-pill status-pill--holiday">Jour férié</span>
            </div>
          </template>

          <!-- Jour non ouvrable -->
          <template v-else>
            <div class="day-card-body day-card-body--centered day-card-body--off">
              <i class="ti ti-moon" aria-hidden="true"></i>
              <span>Non ouvrable</span>
            </div>
          </template>

        </div>
      </div>
    </div>

    <!-- ── Récapitulatif semaine ── -->
    <div class="summary-card">
      <h2 class="summary-title">Résumé de la semaine</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <i class="ti ti-briefcase" aria-hidden="true"></i>
          <div>
            <span class="summary-value">{{ workedDays }}/{{ workableMax }}</span>
            <span class="summary-label">Jours travaillés</span>
          </div>
        </div>
        <div class="summary-item">
          <i class="ti ti-calendar-off" aria-hidden="true"></i>
          <div>
            <span class="summary-value">{{ absenceDays }}</span>
            <span class="summary-label">Jour(s) d'absence</span>
          </div>
        </div>
        <div class="summary-item">
          <i class="ti ti-clock" aria-hidden="true"></i>
          <div>
            <span class="summary-value">{{ effectiveHoursTotal }}</span>
            <span class="summary-label">Heures effectives prévues</span>
          </div>
        </div>
      </div>

      <div class="balances-row">
        <span class="balances-title">Soldes restants</span>
        <div class="balances-list">
          <div v-for="b in balanceSummary" :key="b.label" class="balance-chip">
            <span class="balance-label">{{ b.label }}</span>
            <span class="balance-days">{{ b.days }}j</span>
          </div>
        </div>
      </div>
    </div>

  </div><!-- .planning-view -->
      </main>
    </div>
  </div><!-- .app-shell -->
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore }     from '../../stores/auth'
import { useCalendarStore } from '../../stores/calendar'
import { useAbsenceStore }  from '../../stores/absences'
import { generateWeekPlanning } from '../../utils/calendar'
import type { DayPlanning, WorkingHours } from '../../types'

const auth          = useAuthStore()
const calendarStore = useCalendarStore()
const absenceStore  = useAbsenceStore()

const today = new Date().toISOString().split('T')[0] ?? ''

// ── Week navigation ───────────────────────────────────────────
function parseLocal(dateStr: string): Date {
  const p = dateStr.split('-').map(Number)
  return new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1)
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMonday(date: Date): Date {
  const d   = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

const currentWeekStart = ref(fmt(getMonday(new Date())))

function prevWeek() {
  const d = parseLocal(currentWeekStart.value)
  d.setDate(d.getDate() - 7)
  currentWeekStart.value = fmt(d)
}

function nextWeek() {
  const d = parseLocal(currentWeekStart.value)
  d.setDate(d.getDate() + 7)
  currentWeekStart.value = fmt(d)
}

function goToday() {
  currentWeekStart.value = fmt(getMonday(new Date()))
}

// ── Week labels ───────────────────────────────────────────────
const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const DAYS_FR_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const weekEndDate = computed(() => {
  const d = parseLocal(currentWeekStart.value)
  d.setDate(d.getDate() + 6)
  return d
})

const weekRangeLabel = computed(() => {
  const start = parseLocal(currentWeekStart.value)
  const end   = weekEndDate.value
  const sm    = MONTHS_FR[start.getMonth()]
  const em    = MONTHS_FR[end.getMonth()]
  const sy    = start.getFullYear()
  const ey    = end.getFullYear()
  if (sy === ey && start.getMonth() === end.getMonth()) {
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${sm} ${ey}`
  }
  return `Semaine du ${start.getDate()} ${sm} au ${end.getDate()} ${em} ${ey}`
})

const monthYearLabel = computed(() => {
  const d = parseLocal(currentWeekStart.value)
  const m = MONTHS_FR[d.getMonth()] ?? 'mois'
  return `${m.charAt(0).toUpperCase() + m.slice(1)} ${d.getFullYear()}`
})

// ── Planning data ─────────────────────────────────────────────
const weekDays = computed<DayPlanning[]>(() =>
  generateWeekPlanning(
    currentWeekStart.value,
    calendarStore.calendar,
    absenceStore.myLeaves.map(l => ({
      startDate: l.startDate,
      endDate:   l.endDate,
      type:      l.type,
      status:    l.status,
    })),
  ),
)

// ── Day helpers ───────────────────────────────────────────────
function dayAbbr(dateStr: string): string {
  return DAYS_FR_SHORT[parseLocal(dateStr).getDay()] ?? ''
}

function dayNum(dateStr: string): string {
  return String(parseLocal(dateStr).getDate())
}

function dayCardClass(day: DayPlanning): Record<string, boolean> {
  return {
    'day-card--working': day.isWorkingDay && !day.isAbsence && !day.isHoliday,
    'day-card--approved': day.isAbsence && day.absenceStatus === 'approved',
    'day-card--pending':  day.isAbsence && day.absenceStatus === 'pending',
    'day-card--holiday':  day.isHoliday && !day.isAbsence,
    'day-card--off':      !day.isWorkingDay && !day.isHoliday,
  }
}

function effectiveHoursLabel(hours?: WorkingHours): string {
  if (!hours) return '0h'
  const toMin  = (t: string) => { const p = t.split(':').map(Number); return (p[0] ?? 0) * 60 + (p[1] ?? 0) }
  const effMin = Math.max(0, toMin(hours.end) - toMin(hours.start) - (toMin(hours.breakEnd) - toMin(hours.breakStart)))
  const h = Math.floor(effMin / 60)
  const m = effMin % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

// ── Summary ───────────────────────────────────────────────────
const workableMax = computed(() =>
  weekDays.value.filter(d => {
    const day = parseLocal(d.date).getDay()
    return day !== 0 && day !== 6
  }).length,
)

const workedDays = computed(() =>
  weekDays.value.filter(d => d.isWorkingDay && !d.isAbsence).length,
)

const absenceDays = computed(() =>
  weekDays.value.filter(d => d.isAbsence).length,
)

const effectiveHoursTotal = computed(() => {
  const toMin = (t: string) => { const p = t.split(':').map(Number); return (p[0] ?? 0) * 60 + (p[1] ?? 0) }
  let totalMin = 0
  for (const d of weekDays.value) {
    if (!d.isWorkingDay || d.isAbsence || !d.hours) continue
    const workMin  = toMin(d.hours.end)      - toMin(d.hours.start)
    const breakMin = toMin(d.hours.breakEnd) - toMin(d.hours.breakStart)
    totalMin += Math.max(0, workMin - breakMin)
  }
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
})

const balanceSummary = [
  { label: 'Congé annuel',  days: 12 },
  { label: 'Maladie',       days: 8  },
  { label: 'Récupération',  days: 3  },
  { label: 'Télétravail',   days: 5  },
]
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; background: var(--color-bg); }

.planning-view {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.page-title  { font-size: 20px; font-weight: 700; color: var(--color-text); }
.month-badge {
  font-size: 12px; font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: 20px;
  padding: 3px 12px;
}

.week-nav {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.nav-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-surface); color: var(--color-text);
  cursor: pointer; font-size: 16px;
  transition: background .12s;
}
.nav-btn:hover { background: var(--color-bg); }
.week-label { font-size: 13px; font-weight: 500; color: var(--color-text); white-space: nowrap; }

/* ── Week grid ── */
.week-scroll { overflow-x: auto; margin-bottom: 20px; }
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(130px, 1fr));
  gap: 8px;
  min-width: 700px;
}

.day-card {
  border-radius: 10px;
  border: 0.5px solid var(--color-border);
  background: var(--color-surface);
  overflow: hidden;
  min-height: 130px;
  display: flex;
  flex-direction: column;
}

.day-card--working  { background: var(--color-surface); }
.day-card--approved { background: var(--color-primary-light); border-color: var(--color-primary); }
.day-card--pending  { background: var(--color-warning-bg);    border-color: var(--color-warning); }
.day-card--holiday  { background: var(--color-info-bg);       border-color: var(--color-info); }
.day-card--off      { background: var(--color-bg); opacity: .6; }
.day-card--today    { background: var(--color-primary-light) !important; border: 2px solid var(--color-primary) !important; }

.day-card-header--today { background: none; }
.day-abbr--today { color: var(--color-primary); font-weight: 700; }
.day-num--today  { color: var(--color-primary); }
.today-badge {
  margin-left: auto;
  background: var(--color-primary); color: #fff;
  font-size: 9px; font-weight: 700; padding: 2px 6px;
  border-radius: 10px; letter-spacing: .03em;
}

.day-card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 0.5px solid var(--color-border);
}
.day-abbr { font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .06em; }
.day-num  { font-size: 18px; font-weight: 700; color: var(--color-text); }

.day-card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.day-card-body--centered {
  align-items: center;
  justify-content: center;
  text-align: center;
}
.day-card-body--off {
  color: var(--color-text-muted);
  font-size: 12px;
}
.day-card-body--off i { font-size: 20px; margin-bottom: 4px; }

.day-info-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--color-text-muted);
}
.day-info-row i { font-size: 13px; flex-shrink: 0; }
.day-subtotal {
  font-size: 11px; font-weight: 600;
  color: var(--color-primary);
  margin-top: 4px;
}

.absence-badge {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: 6px;
  padding: 3px 8px;
  text-align: center;
  word-break: break-word;
}
.absence-badge--pending {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.holiday-name {
  font-size: 12px; font-weight: 600;
  color: var(--color-info);
  text-align: center;
  word-break: break-word;
  margin-bottom: 4px;
}

/* ── Status pill ── */
.status-pill {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 700;
  border-radius: 20px;
  padding: 2px 8px;
  text-transform: uppercase;
  letter-spacing: .05em;
}
.status-pill--approved { background: var(--color-success-bg); color: var(--color-success); }
.status-pill--pending  { background: var(--color-warning-bg); color: var(--color-warning); }
.status-pill--holiday  { background: var(--color-info-bg);    color: var(--color-info);    }

/* ── Summary card ── */
.summary-card {
  background: var(--color-surface);
  border: 0.5px solid var(--color-border);
  border-radius: 10px;
  padding: 20px;
}
.summary-title {
  font-size: 14px; font-weight: 600; color: var(--color-text);
  margin-bottom: 16px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.summary-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; background: var(--color-bg); border-radius: 8px;
}
.summary-item i { font-size: 20px; color: var(--color-primary); flex-shrink: 0; }
.summary-item > div { display: flex; flex-direction: column; gap: 2px; }
.summary-value { font-size: 18px; font-weight: 700; color: var(--color-text); }
.summary-label { font-size: 11px; color: var(--color-text-muted); }

.balances-row { padding-top: 12px; border-top: 0.5px solid var(--color-border); }
.balances-title { font-size: 12px; font-weight: 600; color: var(--color-text-muted); display: block; margin-bottom: 10px; }
.balances-list  { display: flex; gap: 8px; flex-wrap: wrap; }
.balance-chip {
  display: flex; align-items: center; gap: 6px;
  background: var(--color-bg);
  border: 0.5px solid var(--color-border);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
}
.balance-label { color: var(--color-text-muted); }
.balance-days  { font-weight: 700; color: var(--color-primary); }

/* ── Buttons ── */
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all .12s; white-space: nowrap; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
.btn-sm { padding: 5px 12px; font-size: 12px; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .planning-view { padding: 16px; }
  .page-header   { flex-direction: column; align-items: flex-start; }
  .summary-grid  { grid-template-columns: 1fr; }
}
</style>
