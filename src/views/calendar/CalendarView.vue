<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- ── En-tête ── -->
        <div class="page-header">
          <div class="header-text">
            <h1 class="page-title">Calendrier de l'entreprise</h1>
            <p class="page-subtitle">Configuration des jours ouvrables, fériés et règles de congés</p>
            <span class="update-badge">
              <i class="ti ti-clock-edit" aria-hidden="true"></i>
              Dernière mise à jour : {{ calendar.updatedAt }} par {{ calendar.updatedBy }}
            </span>
          </div>
          <button
            class="btn btn-primary"
            :disabled="saveDisabled"
            @click="saveChanges"
          >
            <i class="ti ti-device-floppy" aria-hidden="true"></i>
            Enregistrer les modifications
          </button>
        </div>

        <!-- ── Toast ── -->
        <Transition name="toast">
          <div v-if="showToast" class="toast-notif">
            <i class="ti ti-check" aria-hidden="true"></i>
            Calendrier mis à jour
          </div>
        </Transition>

        <!-- ── Tabs ── -->
        <div class="tabs-bar">
          <button
            v-for="tab in TABS"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i :class="`ti ${tab.icon}`" aria-hidden="true"></i>
            {{ tab.label }}
          </button>
        </div>

        <!-- ══════════ Onglet 1 : Jours de travail ══════════ -->
        <div v-if="activeTab === 'working-days'" class="tab-content">

          <div class="section-card">
            <h2 class="section-title">Jours ouvrables</h2>

            <div class="days-grid">
              <div
                v-for="key in DAY_ORDER"
                :key="key"
                class="day-row"
                :class="{ 'day-row--on': localDays[key].enabled }"
              >
                <!-- Toggle -->
                <label class="day-toggle">
                  <span class="day-name">{{ DAY_LABELS[key] }}</span>
                  <span class="toggle-wrap">
                    <input
                      type="checkbox"
                      class="toggle-input"
                      v-model="localDays[key].enabled"
                    />
                    <span class="toggle-track">
                      <span class="toggle-thumb"></span>
                    </span>
                  </span>
                </label>

                <!-- Horaires propres à ce jour -->
                <div v-if="localDays[key].enabled" class="day-hours">
                  <label class="hours-label">
                    Début
                    <input type="time" class="time-input" v-model="localDays[key].start" />
                  </label>
                  <span class="hours-sep">→</span>
                  <label class="hours-label">
                    Fin
                    <input type="time" class="time-input" v-model="localDays[key].end" />
                  </label>
                  <span class="day-hours-total">
                    {{ calcDayHours(localDays[key]) }} eff.
                  </span>
                </div>
              </div>
            </div>

            <!-- Pause déjeuner commune -->
            <div class="break-section">
              <h3 class="break-title">
                <i class="ti ti-coffee" aria-hidden="true"></i>
                Pause déjeuner (commune à tous les jours)
              </h3>
              <div class="break-inputs">
                <label class="hours-label">
                  Début pause
                  <input
                    type="time"
                    class="time-input"
                    :class="{ 'time-input--error': !!breakError, 'time-input--ok': !breakError && localBreakStart }"
                    v-model="localBreakStart"
                  />
                </label>
                <span class="hours-sep">→</span>
                <label class="hours-label">
                  Fin pause
                  <input
                    type="time"
                    class="time-input"
                    :class="{ 'time-input--error': !!breakError, 'time-input--ok': !breakError && localBreakEnd }"
                    v-model="localBreakEnd"
                  />
                </label>
              </div>
              <p v-if="breakError" class="break-error">
                <i class="ti ti-alert-circle" aria-hidden="true"></i>
                {{ breakError }}
              </p>
            </div>
          </div>

          <!-- Résumé hebdomadaire -->
          <div class="section-card summary-card">
            <h2 class="section-title">Résumé hebdomadaire</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-value">{{ daysPerWeek }}</span>
                <span class="summary-label">Jours ouvrables / semaine</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ hoursPerWeekLabel }}</span>
                <span class="summary-label">Heures / semaine</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ hoursPerMonthLabel }}</span>
                <span class="summary-label">Heures / mois (× 4,33)</span>
              </div>
            </div>
          </div>

        </div>

        <!-- ══════════ Onglet 2 : Jours fériés ══════════ -->
        <div v-if="activeTab === 'holidays'" class="tab-content">

          <!-- Fériés annuels -->
          <div class="section-card">
            <div class="section-header">
              <h2 class="section-title">Fériés annuels</h2>
              <button class="btn btn-outline btn-sm" @click="openAddModal('annual')">
                <i class="ti ti-plus" aria-hidden="true"></i>
                Ajouter un férié annuel
              </button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="h in annualHolidays" :key="h.id">
                    <td>{{ h.name }}</td>
                    <td>
                      <span class="date-badge">{{ formatAnnualDate(h.date) }}</span>
                    </td>
                    <td class="actions-cell">
                      <button class="icon-btn" title="Modifier" @click="openEditModal(h)">
                        <i class="ti ti-edit" aria-hidden="true"></i>
                      </button>
                      <button class="icon-btn icon-btn--danger" title="Supprimer" @click="deleteHoliday(h.id)">
                        <i class="ti ti-trash" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="annualHolidays.length === 0">
                    <td colspan="3" class="empty-cell">Aucun férié annuel configuré</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Fériés ponctuels -->
          <div class="section-card">
            <div class="section-header">
              <h2 class="section-title">Fériés ponctuels</h2>
              <button class="btn btn-outline btn-sm" @click="openAddModal('ponctual')">
                <i class="ti ti-plus" aria-hidden="true"></i>
                Ajouter un férié ponctuel
              </button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="h in ponctualHolidays" :key="h.id">
                    <td>{{ h.name }}</td>
                    <td>
                      <span class="date-badge">{{ h.date }}</span>
                      <span class="year-badge">{{ h.date.slice(0, 4) }}</span>
                    </td>
                    <td class="actions-cell">
                      <button class="icon-btn" title="Modifier" @click="openEditModal(h)">
                        <i class="ti ti-edit" aria-hidden="true"></i>
                      </button>
                      <button class="icon-btn icon-btn--danger" title="Supprimer" @click="deleteHoliday(h.id)">
                        <i class="ti ti-trash" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="ponctualHolidays.length === 0">
                    <td colspan="3" class="empty-cell">Aucun férié ponctuel configuré</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- ══════════ Onglet 3 : Règles de congés ══════════ -->
        <div v-if="activeTab === 'leave-rules'" class="tab-content">
          <div class="rules-grid">
            <div
              v-for="rule in localRules"
              :key="rule.type"
              class="rule-card"
            >
              <div class="rule-header">
                <i :class="`ti ${leaveIcon(rule.type)}`" aria-hidden="true"></i>
                <span class="rule-type">{{ rule.type }}</span>
              </div>
              <div class="rule-fields">
                <label class="rule-field">
                  <span>Jours alloués par an</span>
                  <input type="number" min="0" class="rule-input" v-model.number="rule.daysPerYear" @input="rulesTouched = true" />
                </label>
                <label class="rule-field">
                  <span>Accumulation mensuelle (j/mois)</span>
                  <input type="number" min="0" step="0.5" class="rule-input" v-model.number="rule.daysPerMonth" @input="rulesTouched = true" />
                </label>
                <label class="rule-field">
                  <span>Report possible (jours max)</span>
                  <input type="number" min="0" class="rule-input" v-model.number="rule.maxCarryOver" @input="rulesTouched = true" />
                </label>
                <label class="rule-field">
                  <span>Préavis minimum (jours)</span>
                  <input type="number" min="0" class="rule-input" v-model.number="rule.noticeDays" @input="rulesTouched = true" />
                </label>
                <div class="rule-field rule-field--toggle">
                  <span>Justificatif obligatoire</span>
                  <label class="toggle-wrap">
                    <input type="checkbox" class="toggle-input" v-model="rule.requiresDocument" @change="rulesTouched = true" />
                    <span class="toggle-track">
                      <span class="toggle-thumb"></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- ══════════ Modal Férié Annuel ══════════ -->
  <Teleport to="body">
    <div v-if="showModal === 'annual'" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">{{ editingHoliday ? 'Modifier le férié' : 'Ajouter un férié annuel' }}</span>
          <button class="modal-close" @click="closeModal"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Nom du férié *</span>
            <input type="text" class="field-input" v-model="hForm.name" placeholder="Ex : Fête du Travail" />
          </label>
          <div class="field">
            <span class="field-label">Date (mois et jour)</span>
            <div class="date-selects">
              <select class="field-input" v-model="hForm.month">
                <option v-for="m in MONTHS" :key="m.v" :value="m.v">{{ m.l }}</option>
              </select>
              <select class="field-input" v-model="hForm.day">
                <option v-for="d in DAYS" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" @click="saveAnnualHoliday">Enregistrer</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ══════════ Modal Férié Ponctuel ══════════ -->
  <Teleport to="body">
    <div v-if="showModal === 'ponctual'" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">{{ editingHoliday ? 'Modifier le férié' : 'Ajouter un férié ponctuel' }}</span>
          <button class="modal-close" @click="closeModal"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Nom du férié *</span>
            <input type="text" class="field-input" v-model="hForm.name" placeholder="Ex : Aïd el-Fitr 2026" />
          </label>
          <label class="field">
            <span class="field-label">Date complète</span>
            <input type="date" class="field-input" v-model="hForm.fullDate" />
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" @click="savePonctualHoliday">Enregistrer</button>
        </div>
      </div>
    </div>
  </Teleport>

</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore }     from '../../stores/auth'
import { useCalendarStore } from '../../stores/calendar'
import type { WorkingDays, WorkingDayConfig, Holiday, LeaveRule, LeaveType } from '../../types'

const auth          = useAuthStore()
const calendarStore = useCalendarStore()
const { calendar, annualHolidays, ponctualHolidays } = storeToRefs(calendarStore)

// ── Tabs ──────────────────────────────────────────────────────
const activeTab = ref<'working-days' | 'holidays' | 'leave-rules'>('working-days')

const TABS = [
  { id: 'working-days', label: 'Jours de travail', icon: 'ti-clock'          },
  { id: 'holidays',     label: 'Jours fériés',     icon: 'ti-calendar-event'  },
  { id: 'leave-rules',  label: 'Règles de congés', icon: 'ti-list-check'      },
] as const

// ── Toast ─────────────────────────────────────────────────────
const showToast = ref(false)
function triggerToast() {
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}

// ── Tab 1 : local state ────────────────────────────────────────
const DAY_ORDER: (keyof WorkingDays)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]
const DAY_LABELS: Record<keyof WorkingDays, string> = {
  monday:    'Lundi',
  tuesday:   'Mardi',
  wednesday: 'Mercredi',
  thursday:  'Jeudi',
  friday:    'Vendredi',
  saturday:  'Samedi',
  sunday:    'Dimanche',
}

const localDays = reactive<WorkingDays>(
  JSON.parse(JSON.stringify(calendar.value.workingDays))
)
const localBreakStart = ref(calendar.value.breakStart)
const localBreakEnd   = ref(calendar.value.breakEnd)

// Quand on active samedi ou dimanche → heures par défaut mi-journée
watch(() => localDays.saturday.enabled, (val) => {
  if (val) { localDays.saturday.start = '08:00'; localDays.saturday.end = '12:00' }
})
watch(() => localDays.sunday.enabled, (val) => {
  if (val) { localDays.sunday.start = '08:00'; localDays.sunday.end = '12:00' }
})

// ── Tab 3 : leave rules ────────────────────────────────────────
const localRules  = ref<LeaveRule[]>(JSON.parse(JSON.stringify(calendar.value.leaveRules)))
const rulesTouched = ref(false)

// ── Helpers horaires ──────────────────────────────────────────
function toMin(t: string): number {
  const p = t.split(':').map(Number)
  return (p[0] ?? 0) * 60 + (p[1] ?? 0)
}
function minToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

function calcDayHours(day: WorkingDayConfig): string {
  const workMin  = toMin(day.end) - toMin(day.start)
  const breakMin = toMin(localBreakEnd.value) - toMin(localBreakStart.value)
  return minToLabel(Math.max(0, workMin - breakMin))
}

// ── Validation pause ──────────────────────────────────────────
const breakError = computed<string | null>(() => {
  const bStart = toMin(localBreakStart.value)
  const bEnd   = toMin(localBreakEnd.value)
  if (bEnd <= bStart) return 'La fin de pause doit être après le début'
  for (const key of DAY_ORDER) {
    const day = localDays[key]
    if (!day.enabled) continue
    if (bStart < toMin(day.start) || bEnd > toMin(day.end)) {
      return 'La pause doit être dans la plage de travail'
    }
  }
  return null
})

// ── Résumé hebdomadaire ───────────────────────────────────────
const daysPerWeek = computed(() =>
  DAY_ORDER.filter(k => localDays[k].enabled).length
)

const weeklyMinutes = computed(() => {
  const breakMin = toMin(localBreakEnd.value) - toMin(localBreakStart.value)
  return DAY_ORDER.reduce((total, key) => {
    const day = localDays[key]
    if (!day.enabled) return total
    return total + Math.max(0, toMin(day.end) - toMin(day.start) - breakMin)
  }, 0)
})

const hoursPerWeekLabel  = computed(() => minToLabel(weeklyMinutes.value))
const hoursPerMonthLabel = computed(() => minToLabel(Math.round(weeklyMinutes.value * 4.33)))

// ── Dirty tracking ────────────────────────────────────────────
const hasChanges = computed(() =>
  JSON.stringify(localDays)      !== JSON.stringify(calendar.value.workingDays) ||
  localBreakStart.value          !== calendar.value.breakStart                   ||
  localBreakEnd.value            !== calendar.value.breakEnd                     ||
  rulesTouched.value
)

const saveDisabled = computed(() => !hasChanges.value || !!breakError.value)

// ── Save ──────────────────────────────────────────────────────
function saveChanges() {
  if (breakError.value) return
  calendarStore.updateWorkingDays(JSON.parse(JSON.stringify(localDays)))
  calendarStore.updateBreak(localBreakStart.value, localBreakEnd.value)
  if (rulesTouched.value) {
    localRules.value.forEach(r => calendarStore.updateLeaveRule(r.type as LeaveType, r))
    rulesTouched.value = false
  }
  triggerToast()
}

// ── Holiday display helpers ───────────────────────────────────
function formatAnnualDate(date: string): string {
  const MONTHS_FR = ['', 'jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const parts = date.split('-')
  const mm = parts[0] ?? '01'
  const dd = parts[1] ?? '01'
  return `${dd} ${MONTHS_FR[parseInt(mm)] ?? ''}`
}

const LEAVE_ICONS: Record<string, string> = {
  'Congé annuel':              'ti-beach',
  'Congé maladie':             'ti-heart-rate-monitor',
  'Congé maternité':           'ti-baby-carriage',
  'Récupération':              'ti-clock-hour-3',
  'Télétravail':               'ti-home',
  'Assistance parentale':      'ti-users',
  'Permission exceptionnelle': 'ti-star',
}
function leaveIcon(type: string): string {
  return LEAVE_ICONS[type] ?? 'ti-calendar'
}

// ── Holiday modals ────────────────────────────────────────────
const showModal      = ref<'annual' | 'ponctual' | null>(null)
const editingHoliday = ref<Holiday | null>(null)

const MONTHS = [
  { v: '01', l: 'Janvier' }, { v: '02', l: 'Février' }, { v: '03', l: 'Mars' },
  { v: '04', l: 'Avril'   }, { v: '05', l: 'Mai'      }, { v: '06', l: 'Juin' },
  { v: '07', l: 'Juillet' }, { v: '08', l: 'Août'     }, { v: '09', l: 'Septembre' },
  { v: '10', l: 'Octobre' }, { v: '11', l: 'Novembre' }, { v: '12', l: 'Décembre' },
]
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))

const hForm = reactive({ name: '', month: '01', day: '01', fullDate: '' })

function openAddModal(type: 'annual' | 'ponctual') {
  editingHoliday.value = null
  hForm.name     = ''
  hForm.month    = '01'
  hForm.day      = '01'
  hForm.fullDate = ''
  showModal.value = type
}

function openEditModal(h: Holiday) {
  editingHoliday.value = h
  hForm.name = h.name
  if (h.isRecurring) {
    const parts = h.date.split('-')
    hForm.month = parts[0] ?? '01'
    hForm.day   = parts[1] ?? '01'
    showModal.value = 'annual'
  } else {
    hForm.fullDate  = h.date
    showModal.value = 'ponctual'
  }
}

function closeModal() {
  showModal.value      = null
  editingHoliday.value = null
}

function saveAnnualHoliday() {
  if (!hForm.name.trim()) return
  const date = `${hForm.month}-${hForm.day}`
  if (editingHoliday.value) {
    calendarStore.updateHoliday(editingHoliday.value.id, { name: hForm.name, date })
  } else {
    calendarStore.addHoliday({ name: hForm.name, date, type: 'annual', isRecurring: true })
  }
  closeModal()
}

function savePonctualHoliday() {
  if (!hForm.name.trim() || !hForm.fullDate) return
  if (editingHoliday.value) {
    calendarStore.updateHoliday(editingHoliday.value.id, { name: hForm.name, date: hForm.fullDate })
  } else {
    calendarStore.addHoliday({ name: hForm.name, date: hForm.fullDate, type: 'ponctual', isRecurring: false })
  }
  closeModal()
}

function deleteHoliday(id: string) {
  if (confirm('Supprimer ce jour férié ?')) calendarStore.removeHoliday(id)
}
</script>

<style scoped>
/* ── Layout shell ── */
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

/* ── Header ── */
.page-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 16px;
  margin-bottom: 20px; flex-wrap: wrap;
}
.page-title    { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-subtitle { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.update-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--color-text-muted);
  background: var(--color-surface); border: 0.5px solid var(--color-border);
  border-radius: 20px; padding: 3px 10px; margin-top: 8px;
}

/* ── Toast ── */
.toast-notif {
  position: fixed; bottom: 24px; right: 24px;
  background: var(--color-success); color: #fff;
  padding: 12px 20px; border-radius: 8px;
  font-size: 13px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  z-index: 2000; box-shadow: 0 4px 16px rgba(0,0,0,.16);
}
.toast-enter-active, .toast-leave-active { transition: all .25s; }
.toast-enter-from, .toast-leave-to       { opacity: 0; transform: translateY(10px); }

/* ── Tabs ── */
.tabs-bar {
  display: flex; gap: 4px;
  border-bottom: 1.5px solid var(--color-border);
  margin-bottom: 20px; overflow-x: auto;
}
.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px; font-size: 13px; font-weight: 500;
  color: var(--color-text-muted); background: none;
  border: none; border-bottom: 2px solid transparent;
  cursor: pointer; white-space: nowrap;
  transition: color .12s, border-color .12s;
}
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.tab-btn:hover:not(.active) { color: var(--color-text); }

/* ── Cards ── */
.section-card {
  background: var(--color-surface);
  border: 0.5px solid var(--color-border);
  border-radius: 10px; padding: 20px;
  margin-bottom: 16px;
}
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
}
.section-title {
  font-size: 15px; font-weight: 600; color: var(--color-text);
  margin-bottom: 16px;
}
.section-header .section-title { margin-bottom: 0; }

/* ── Day toggles ── */
.days-grid { display: flex; flex-direction: column; gap: 2px; }

.day-row {
  display: flex; align-items: center; gap: 16px;
  padding: 10px 12px; border-radius: 8px;
  transition: background .12s; flex-wrap: wrap;
}
.day-row--on { background: var(--color-primary-light); }

.day-toggle { display: flex; align-items: center; gap: 12px; min-width: 150px; cursor: pointer; }
.day-name   { font-size: 13px; font-weight: 500; color: var(--color-text); width: 90px; }

/* Toggle switch */
.toggle-wrap  { position: relative; display: inline-flex; align-items: center; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track {
  width: 36px; height: 20px;
  background: var(--color-border-strong); border-radius: 10px;
  position: relative; transition: background .2s; cursor: pointer;
}
.toggle-input:checked + .toggle-track { background: var(--color-primary); }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 14px; height: 14px; background: #fff;
  border-radius: 50%; transition: left .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
}
.toggle-input:checked + .toggle-track .toggle-thumb { left: 19px; }

.day-hours { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.day-hours-total {
  font-size: 11px; font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: 4px; padding: 2px 8px;
}

.hours-label { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--color-text-muted); }
.time-input {
  height: 32px; padding: 0 8px;
  border: 0.5px solid var(--color-border);
  border-radius: 6px; font-size: 13px;
  color: var(--color-text); background: var(--color-surface);
  outline: none; width: 100px; transition: border-color .12s;
}
.time-input:focus           { border-color: var(--color-primary); }
.time-input--error          { border-color: var(--color-danger) !important; }
.time-input--ok             { border-color: var(--color-success); }
.hours-sep { color: var(--color-text-muted); font-size: 14px; }

/* Break section */
.break-section {
  margin-top: 20px; padding-top: 16px;
  border-top: 0.5px solid var(--color-border);
}
.break-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--color-text-muted); margin-bottom: 12px;
}
.break-inputs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.break-error {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-danger);
  background: var(--color-danger-bg);
  border-radius: 6px; padding: 8px 12px; margin-top: 10px;
}

/* Summary */
.summary-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.summary-item {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 16px;
  background: var(--color-bg); border-radius: 8px;
}
.summary-value { font-size: 24px; font-weight: 700; color: var(--color-primary); }
.summary-label { font-size: 12px; color: var(--color-text-muted); text-align: center; }

/* ── Tables ── */
.table-wrap  { overflow-x: auto; }
.data-table  { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th {
  text-align: left; padding: 8px 12px;
  font-size: 11px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .06em;
  background: var(--color-bg); border-bottom: 0.5px solid var(--color-border);
}
.data-table td { padding: 10px 12px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--color-bg); }

.date-badge {
  font-size: 12px; font-weight: 500;
  background: var(--color-bg); border: 0.5px solid var(--color-border);
  border-radius: 4px; padding: 2px 8px; margin-right: 6px;
}
.year-badge {
  font-size: 10px; font-weight: 700; color: #fff;
  background: var(--color-accent); border-radius: 4px; padding: 1px 6px;
}
.actions-cell { display: flex; gap: 4px; }
.icon-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 6px; background: var(--color-bg);
  color: var(--color-text-muted); cursor: pointer; font-size: 14px;
  transition: background .12s, color .12s;
}
.icon-btn:hover          { background: var(--color-primary-light); color: var(--color-primary); }
.icon-btn--danger:hover  { background: var(--color-danger-bg);     color: var(--color-danger); }
.empty-cell { text-align: center; color: var(--color-text-muted); padding: 20px; }

/* ── Leave rules ── */
.rules-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.rule-card {
  background: var(--color-surface);
  border: 0.5px solid var(--color-border);
  border-radius: 10px; padding: 18px;
}
.rule-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 0.5px solid var(--color-border);
}
.rule-header i { font-size: 20px; color: var(--color-primary); }
.rule-type     { font-size: 14px; font-weight: 600; color: var(--color-text); }
.rule-fields   { display: flex; flex-direction: column; gap: 12px; }
.rule-field {
  display: flex; flex-direction: column; gap: 4px;
  font-size: 12px; color: var(--color-text-muted);
}
.rule-field--toggle { flex-direction: row; align-items: center; justify-content: space-between; }
.rule-input {
  height: 32px; padding: 0 8px;
  border: 0.5px solid var(--color-border); border-radius: 6px;
  font-size: 13px; color: var(--color-text); background: var(--color-bg);
  outline: none; width: 100%;
}
.rule-input:focus { border-color: var(--color-primary); background: var(--color-surface); }

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; transition: all .12s; white-space: nowrap;
}
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn-primary  { background: var(--color-primary); color: #fff; }
.btn-primary:not(:disabled):hover { background: var(--color-primary-dark); }
.btn-outline  { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
.btn-sm { padding: 6px 12px; font-size: 12px; }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--color-surface); border-radius: 12px; padding: 24px;
  max-width: 420px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,.16);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.modal-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-close {
  width: 28px; height: 28px; border: none; background: var(--color-bg);
  border-radius: 6px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: var(--color-text-muted); font-size: 14px;
}
.modal-close:hover { background: var(--color-border); }
.modal-body   { display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 0.5px solid var(--color-border); }

.field        { display: flex; flex-direction: column; gap: 4px; }
.field-label  { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-input  {
  height: 36px; padding: 0 10px;
  border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); font-size: 13px;
  color: var(--color-text); outline: none;
  width: 100%; box-sizing: border-box;
}
.field-input:focus { border-color: var(--color-primary); background: var(--color-surface); }
.date-selects { display: flex; gap: 8px; }
.date-selects .field-input { flex: 1; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .content      { padding: 16px; }
  .page-header  { flex-direction: column; }
  .summary-grid { grid-template-columns: 1fr; }
  .rules-grid   { grid-template-columns: 1fr; }
  .day-row      { flex-wrap: wrap; }
  .tabs-bar     { overflow-x: auto; }
}
</style>
