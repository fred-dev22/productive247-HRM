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
          <button class="btn btn-primary" :disabled="saveDisabled" @click="saveChanges">
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
            v-for="tab in TABS" :key="tab.id"
            class="tab-btn" :class="{ active: activeTab === tab.id }"
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
                v-for="key in DAY_ORDER" :key="key"
                class="day-row" :class="{ 'day-row--on': localDays[key].enabled }"
              >
                <!-- Nom du jour -->
                <span class="day-name">{{ DAY_LABELS[key] }}</span>

                <!-- Toggle actif/inactif -->
                <label class="toggle-wrap day-toggle-label">
                  <input type="checkbox" class="toggle-input" v-model="localDays[key].enabled" />
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                </label>

                <!-- Horaires + Pause (une seule ligne) -->
                <template v-if="localDays[key].enabled">
                  <input type="time" class="time-input" v-model="localDays[key].start" />
                  <span class="hours-sep">→</span>
                  <input type="time" class="time-input" v-model="localDays[key].end" />
                  <span class="day-hours-total">{{ calcDayHours(localDays[key]) }} eff.</span>

                  <!-- Séparateur visuel -->
                  <span class="row-divider" aria-hidden="true">|</span>

                  <!-- Toggle Pause -->
                  <label class="break-toggle-label">
                    <span class="toggle-wrap">
                      <input type="checkbox" class="toggle-input" v-model="localDays[key].breakEnabled" />
                      <span class="toggle-track toggle-track--sm"><span class="toggle-thumb toggle-thumb--sm"></span></span>
                    </span>
                    <span class="break-label-text">Pause</span>
                  </label>

                  <!-- Plage de pause -->
                  <template v-if="localDays[key].breakEnabled">
                    <input type="time" class="time-input time-input--sm" v-model="localDays[key].breakStart"
                      :class="{ 'time-input--error': !!dayBreakError(key) }" />
                    <span class="hours-sep">→</span>
                    <input type="time" class="time-input time-input--sm" v-model="localDays[key].breakEnd"
                      :class="{ 'time-input--error': !!dayBreakError(key) }" />
                    <span v-if="dayBreakError(key)" class="break-error-inline">
                      <i class="ti ti-alert-circle" aria-hidden="true"></i>
                      {{ dayBreakError(key) }}
                    </span>
                  </template>
                  <span v-else class="no-break-label">Aucune pause</span>
                </template>
                <span v-else class="day-disabled-label">Jour non travaillé</span>
              </div>
            </div>
          </div>

          <!-- Résumé hebdomadaire -->
          <div class="section-card">
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

          <!-- Bannière info -->
          

          <div class="section-card">
            <div class="section-header">
              <h2 class="section-title">Fériés annuels</h2>
              <button class="btn btn-outline btn-sm" @click="openAddModal('annual')">
                <i class="ti ti-plus" aria-hidden="true"></i> Ajouter
              </button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Nom</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr v-for="h in annualHolidays" :key="h.id">
                    <td>{{ h.name }}</td>
                    <td><span class="date-badge">{{ formatAnnualDate(h.date) }}</span></td>
                    <td class="actions-cell">
                      <button class="icon-btn" @click="openEditModal(h)"><i class="ti ti-edit"></i></button>
                      <button class="icon-btn icon-btn--danger" @click="deleteHoliday(h.id)"><i class="ti ti-trash"></i></button>
                    </td>
                  </tr>
                  <tr v-if="annualHolidays.length === 0"><td colspan="3" class="empty-cell">Aucun férié annuel</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <h2 class="section-title">Fériés ponctuels</h2>
              <button class="btn btn-outline btn-sm" @click="openAddModal('ponctual')">
                <i class="ti ti-plus" aria-hidden="true"></i> Ajouter
              </button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Nom</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr v-for="h in ponctualHolidays" :key="h.id">
                    <td>{{ h.name }}</td>
                    <td>
                      <span class="date-badge">{{ h.date }}</span>
                      <span class="year-badge">{{ h.date.slice(0, 4) }}</span>
                    </td>
                    <td class="actions-cell">
                      <button class="icon-btn" @click="openEditModal(h)"><i class="ti ti-edit"></i></button>
                      <button class="icon-btn icon-btn--danger" @click="deleteHoliday(h.id)"><i class="ti ti-trash"></i></button>
                    </td>
                  </tr>
                  <tr v-if="ponctualHolidays.length === 0"><td colspan="3" class="empty-cell">Aucun férié ponctuel</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- ══════════ Onglet 3 : Règles de congés ══════════ -->
        <div v-if="activeTab === 'leave-rules'" class="tab-content">
          <div class="rules-grid">
            <div v-for="rule in localRules" :key="rule.type" class="rule-card">
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
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════ Onglet 4 : Perdiems ══════════ -->
        <div v-if="activeTab === 'perdiem'" class="tab-content">
          <div class="section-card">
            <div class="section-header">
              <h2 class="section-title">Taux de perdiem par catégorie</h2>
              <button class="btn btn-primary btn-sm" @click="openPerdiemModal()">
                <i class="ti ti-plus"></i> Ajouter
              </button>
            </div>
            <p class="section-note">Valeurs provisoires</p>
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Description</th>
                  <th>Taux / jour</th>
                  <th>Devise</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pd in calendar.perdiemRates ?? []" :key="pd.id">
                  <td class="pd-cat">{{ pd.category }}</td>
                  <td class="pd-desc">{{ pd.description }}</td>
                  <td class="pd-rate">{{ pd.ratePerDay.toLocaleString('fr-FR') }}</td>
                  <td class="pd-currency">{{ pd.currency }}</td>
                  <td>
                    <div class="pd-actions">
                      <button class="pd-btn pd-edit" @click="openPerdiemModal(pd.id)"><i class="ti ti-edit"></i></button>
                      <button class="pd-btn pd-del"  @click="calendarStore.removePerdiemRate(pd.id)"><i class="ti ti-trash"></i></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!calendar.perdiemRates?.length">
                  <td colspan="5" class="pd-empty">Aucun taux configuré</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- ── Modal Perdiem ── -->
  <Teleport to="body">
    <div v-if="showPerdiemModal" class="modal-overlay" @click.self="showPerdiemModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">{{ editingPerdiem ? 'Modifier le taux' : 'Nouveau taux perdiem' }}</span>
          <button class="modal-close" @click="showPerdiemModal = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Catégorie *</span>
            <input type="text" class="field-input" v-model="pdForm.category" placeholder="Ex: Cadre supérieur" />
          </label>
          <label class="field">
            <span class="field-label">Description</span>
            <input type="text" class="field-input" v-model="pdForm.description" placeholder="Ex: Direction / Cadres A" />
          </label>
          <label class="field">
            <span class="field-label">Taux / jour *</span>
            <input type="number" min="0" class="field-input" v-model.number="pdForm.ratePerDay" />
          </label>
          <label class="field">
            <span class="field-label">Devise</span>
            <select class="field-input" v-model="pdForm.currency">
              <option value="MGA">MGA (Ariary)</option>
              <option value="MUR">MUR (Roupie mauricienne)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showPerdiemModal = false">Annuler</button>
          <button class="btn btn-primary" @click="savePerdiem">Enregistrer</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Modals fériés ── -->
  <Teleport to="body">
    <div v-if="showModal === 'annual'" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">{{ editingHoliday ? 'Modifier' : 'Ajouter un férié annuel' }}</span>
          <button class="modal-close" @click="closeModal"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Nom *</span>
            <input type="text" class="field-input" v-model="hForm.name" placeholder="Ex : Fête du Travail" />
          </label>
          <div class="field">
            <span class="field-label">Date (mois — jour)</span>
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

  <Teleport to="body">
    <div v-if="showModal === 'ponctual'" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">{{ editingHoliday ? 'Modifier' : 'Ajouter un férié ponctuel' }}</span>
          <button class="modal-close" @click="closeModal"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Nom *</span>
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
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore }     from '../../stores/auth'
import { useCalendarStore } from '../../stores/calendar'
import type { WorkingDays, WorkingDayConfig, Holiday, LeaveRule, LeaveType, HolidayType } from '../../types'

const auth          = useAuthStore()
const calendarStore = useCalendarStore()
const { calendar, annualHolidays, ponctualHolidays } = storeToRefs(calendarStore)

// ── Tabs ──────────────────────────────────────────────────────
const activeTab = ref<'working-days' | 'holidays' | 'leave-rules' | 'perdiem'>('working-days')
const TABS = [
  { id: 'working-days', label: 'Jours de travail', icon: 'ti-clock'         },
  { id: 'holidays',     label: 'Jours fériés',     icon: 'ti-calendar-event' },
  { id: 'leave-rules',  label: 'Règles de congés', icon: 'ti-list-check'     },
  { id: 'perdiem',      label: 'Perdiems',          icon: 'ti-coin'           },
] as const

const showToast = ref(false)
function triggerToast() { showToast.value = true; setTimeout(() => { showToast.value = false }, 2500) }

// ── Jours locaux ──────────────────────────────────────────────
const DAY_ORDER: (keyof WorkingDays)[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<keyof WorkingDays, string> = {
  monday:'Lundi', tuesday:'Mardi', wednesday:'Mercredi',
  thursday:'Jeudi', friday:'Vendredi', saturday:'Samedi', sunday:'Dimanche',
}
const localDays = reactive<WorkingDays>(JSON.parse(JSON.stringify(calendar.value.workingDays)))

// ── Règles locales ─────────────────────────────────────────────
const localRules   = ref<LeaveRule[]>(JSON.parse(JSON.stringify(calendar.value.leaveRules)))
const rulesTouched = ref(false)

// ── Helpers temps ─────────────────────────────────────────────
function toMin(t: string): number {
  if (!t) return 0
  const p = t.split(':').map(Number)
  return (p[0] ?? 0) * 60 + (p[1] ?? 0)
}
function minToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`
}

function calcDayHours(day: WorkingDayConfig): string {
  const workMin  = toMin(day.end) - toMin(day.start)
  const breakMin = day.breakEnabled ? toMin(day.breakEnd) - toMin(day.breakStart) : 0
  return minToLabel(Math.max(0, workMin - breakMin))
}

// ── Validation pause par jour ─────────────────────────────────
function dayBreakError(key: keyof WorkingDays): string | null {
  const day = localDays[key]
  if (!day.enabled || !day.breakEnabled) return null
  const bStart = toMin(day.breakStart), bEnd = toMin(day.breakEnd)
  if (bEnd <= bStart)           return 'Fin avant début'
  if (bStart < toMin(day.start)) return 'Avant l\'heure de début'
  if (bEnd   > toMin(day.end))   return 'Après l\'heure de fin'
  return null
}
const hasBreakError = computed(() => DAY_ORDER.some(k => !!dayBreakError(k)))

// ── Résumé hebdo ──────────────────────────────────────────────
const daysPerWeek = computed(() => DAY_ORDER.filter(k => localDays[k].enabled).length)
const weeklyMinutes = computed(() =>
  DAY_ORDER.reduce((total, key) => {
    const day = localDays[key]
    if (!day.enabled) return total
    const w = toMin(day.end) - toMin(day.start)
    const b = day.breakEnabled ? toMin(day.breakEnd) - toMin(day.breakStart) : 0
    return total + Math.max(0, w - b)
  }, 0)
)
const hoursPerWeekLabel  = computed(() => minToLabel(weeklyMinutes.value))
const hoursPerMonthLabel = computed(() => minToLabel(Math.round(weeklyMinutes.value * 4.33)))

// ── Save ──────────────────────────────────────────────────────
const hasChanges   = computed(() =>
  JSON.stringify(localDays) !== JSON.stringify(calendar.value.workingDays) || rulesTouched.value
)
const saveDisabled = computed(() => !hasChanges.value || hasBreakError.value)

function saveChanges() {
  if (hasBreakError.value) return
  calendarStore.updateWorkingDays(JSON.parse(JSON.stringify(localDays)))
  if (rulesTouched.value) {
    localRules.value.forEach(r => calendarStore.updateLeaveRule(r.type as LeaveType, r))
    rulesTouched.value = false
  }
  triggerToast()
}

// ── Display helpers ───────────────────────────────────────────
function formatAnnualDate(date: string): string {
  const M = ['','jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
  const p = date.split('-')
  return `${p[1] ?? ''} ${M[parseInt(p[0] ?? '0')] ?? ''}`
}
const LEAVE_ICONS: Record<string, string> = {
  'Congé annuel':'ti-beach','Congé maladie':'ti-heart-rate-monitor','Congé maternité':'ti-baby-carriage',
  'Récupération':'ti-clock-hour-3','Télétravail':'ti-home','Assistance parentale':'ti-users',
  'Permission exceptionnelle':'ti-star',
}
function leaveIcon(type: string) { return LEAVE_ICONS[type] ?? 'ti-calendar' }

// ── Modals fériés ─────────────────────────────────────────────
const showModal      = ref<'annual' | 'ponctual' | null>(null)
const editingHoliday = ref<Holiday | null>(null)
const MONTHS = [
  {v:'01',l:'Janvier'},{v:'02',l:'Février'},{v:'03',l:'Mars'},{v:'04',l:'Avril'},
  {v:'05',l:'Mai'},{v:'06',l:'Juin'},{v:'07',l:'Juillet'},{v:'08',l:'Août'},
  {v:'09',l:'Septembre'},{v:'10',l:'Octobre'},{v:'11',l:'Novembre'},{v:'12',l:'Décembre'},
]
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2,'0'))
const hForm = reactive({ name: '', month: '01', day: '01', fullDate: '' })

function openAddModal(type: 'annual' | 'ponctual') {
  editingHoliday.value = null
  hForm.name = ''; hForm.month = '01'; hForm.day = '01'; hForm.fullDate = ''
  showModal.value = type
}
function openEditModal(h: Holiday) {
  editingHoliday.value = h
  hForm.name = h.name
  if (h.isRecurring) {
    const p = h.date.split('-')
    hForm.month = p[0] ?? '01'
    hForm.day   = p[1] ?? '01'
    showModal.value = 'annual'
  } else {
    hForm.fullDate  = h.date
    showModal.value = 'ponctual'
  }
}
function closeModal() { showModal.value = null; editingHoliday.value = null }
function saveAnnualHoliday() {
  if (!hForm.name.trim()) return
  const date = `${hForm.month}-${hForm.day}`
  editingHoliday.value
    ? calendarStore.updateHoliday(editingHoliday.value.id, { name: hForm.name, date })
    : calendarStore.addHoliday({ name: hForm.name, date, type: 'annual', isRecurring: true })
  closeModal()
}
function savePonctualHoliday() {
  if (!hForm.name.trim() || !hForm.fullDate) return
  editingHoliday.value
    ? calendarStore.updateHoliday(editingHoliday.value.id, { name: hForm.name, date: hForm.fullDate })
    : calendarStore.addHoliday({ name: hForm.name, date: hForm.fullDate, type: 'ponctual', isRecurring: false })
  closeModal()
}
function deleteHoliday(id: string) { if (confirm('Supprimer ce jour férié ?')) calendarStore.removeHoliday(id) }

// ── Perdiem ────────────────────────────────────────────────────
const showPerdiemModal = ref(false)
const editingPerdiem   = ref<string | null>(null)
const pdForm = reactive({ category: '', description: '', ratePerDay: 0, currency: 'MGA' })

function openPerdiemModal(id?: string) {
  editingPerdiem.value = id ?? null
  if (id) {
    const pd = (calendar.value.perdiemRates ?? []).find(r => r.id === id)
    if (pd) { pdForm.category = pd.category; pdForm.description = pd.description; pdForm.ratePerDay = pd.ratePerDay; pdForm.currency = pd.currency }
  } else {
    pdForm.category = ''; pdForm.description = ''; pdForm.ratePerDay = 0; pdForm.currency = 'MGA'
  }
  showPerdiemModal.value = true
}

function savePerdiem() {
  if (!pdForm.category.trim()) return
  if (editingPerdiem.value) {
    calendarStore.updatePerdiemRate(editingPerdiem.value, { category: pdForm.category, description: pdForm.description, ratePerDay: pdForm.ratePerDay, currency: pdForm.currency })
  } else {
    calendarStore.addPerdiemRate({ category: pdForm.category, description: pdForm.description, ratePerDay: pdForm.ratePerDay, currency: pdForm.currency })
  }
  showPerdiemModal.value = false
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header   { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.page-title    { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-subtitle { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.update-badge  { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-muted); background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 20px; padding: 3px 10px; margin-top: 8px; }

.toast-notif { position: fixed; bottom: 24px; right: 24px; background: var(--color-success); color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; z-index: 2000; box-shadow: 0 4px 16px rgba(0,0,0,.16); }
.toast-enter-active, .toast-leave-active { transition: all .25s; }
.toast-enter-from, .toast-leave-to       { opacity: 0; transform: translateY(10px); }

.tabs-bar { display: flex; gap: 4px; border-bottom: 1.5px solid var(--color-border); margin-bottom: 20px; overflow-x: auto; }
.tab-btn  { display: flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 13px; font-weight: 500; color: var(--color-text-muted); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: color .12s, border-color .12s; }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.tab-btn:hover:not(.active) { color: var(--color-text); }

.section-card   { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; padding: 20px; margin-bottom: 16px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.section-title  { font-size: 15px; font-weight: 600; color: var(--color-text); margin-bottom: 16px; }
.section-header .section-title { margin-bottom: 0; }

/* ── Day rows — une seule ligne ── */
.days-grid { display: flex; flex-direction: column; gap: 2px; }
.day-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background .12s;
  flex-wrap: nowrap;
  min-height: 44px;
}
.day-row--on { background: var(--color-primary-light); }
.day-name    { font-size: 13px; font-weight: 500; color: var(--color-text); width: 90px; flex-shrink: 0; }
.day-toggle-label { cursor: pointer; flex-shrink: 0; }
.day-disabled-label { font-size: 11px; color: var(--color-text-muted); font-style: italic; }
.row-divider { color: var(--color-border); font-size: 16px; user-select: none; flex-shrink: 0; }

/* Toggle switch */
.toggle-wrap  { position: relative; display: inline-flex; align-items: center; flex-shrink: 0; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track { width: 36px; height: 20px; background: var(--color-border-strong); border-radius: 10px; position: relative; transition: background .2s; cursor: pointer; flex-shrink: 0; }
.toggle-input:checked + .toggle-track { background: var(--color-primary); }
.toggle-thumb { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
.toggle-input:checked + .toggle-track .toggle-thumb { left: 19px; }
/* Small */
.toggle-track--sm { width: 28px; height: 16px; }
.toggle-thumb--sm { width: 10px; height: 10px; top: 3px; left: 3px; }
.toggle-input:checked + .toggle-track--sm .toggle-thumb--sm { left: 15px; }

.hours-sep   { color: var(--color-text-muted); font-size: 14px; flex-shrink: 0; }
.time-input  { height: 32px; padding: 0 8px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 13px; color: var(--color-text); background: var(--color-surface); outline: none; width: 96px; flex-shrink: 0; transition: border-color .12s; }
.time-input--sm    { width: 80px; height: 28px; font-size: 12px; }
.time-input:focus  { border-color: var(--color-primary); }
.time-input--error { border-color: var(--color-danger) !important; }
.day-hours-total   { font-size: 11px; font-weight: 600; color: var(--color-primary); background: var(--color-primary-light); border-radius: 4px; padding: 2px 8px; white-space: nowrap; flex-shrink: 0; }

.break-toggle-label { display: flex; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0; }
.break-label-text   { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }
.no-break-label     { font-size: 11px; color: var(--color-text-muted); font-style: italic; white-space: nowrap; }
.break-error-inline { font-size: 10px; color: var(--color-danger); display: flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; }

@media (max-width: 768px) {
  .day-row { flex-wrap: wrap; }
  .row-divider { display: none; }
  .break-toggle-label { margin-left: 100px; }
}

/* Summary */
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.summary-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px; background: var(--color-bg); border-radius: 8px; }
.summary-value { font-size: 24px; font-weight: 700; color: var(--color-primary); }
.summary-label { font-size: 12px; color: var(--color-text-muted); text-align: center; }

/* Tables */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .06em; background: var(--color-bg); border-bottom: 0.5px solid var(--color-border); }
.data-table td { padding: 10px 12px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--color-bg); }
.date-badge { font-size: 12px; font-weight: 500; background: var(--color-bg); border: 0.5px solid var(--color-border); border-radius: 4px; padding: 2px 8px; margin-right: 6px; }
.year-badge { font-size: 10px; font-weight: 700; color: var(--color-surface); background: var(--color-accent); border-radius: 4px; padding: 1px 6px; }
.info-banner { display: flex; align-items: flex-start; gap: 10px; background: var(--color-info-bg); border: 0.5px solid var(--color-info); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: var(--color-text); line-height: 1.5; }
.info-banner-icon { color: var(--color-info); font-size: 16px; margin-top: 1px; flex-shrink: 0; }
.actions-cell { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: var(--color-bg); color: var(--color-text-muted); cursor: pointer; font-size: 14px; transition: background .12s, color .12s; }
.icon-btn:hover         { background: var(--color-primary-light); color: var(--color-primary); }
.icon-btn--danger:hover { background: var(--color-danger-bg);     color: var(--color-danger);  }
.empty-cell { text-align: center; color: var(--color-text-muted); padding: 20px; }

/* Rules */
.rules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.rule-card   { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; padding: 18px; }
.rule-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 0.5px solid var(--color-border); }
.rule-header i { font-size: 20px; color: var(--color-primary); }
.rule-type     { font-size: 14px; font-weight: 600; color: var(--color-text); }
.rule-fields   { display: flex; flex-direction: column; gap: 12px; }
.rule-field    { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--color-text-muted); }
.rule-field--toggle { flex-direction: row; align-items: center; justify-content: space-between; }
.rule-input    { height: 32px; padding: 0 8px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 13px; color: var(--color-text); background: var(--color-bg); outline: none; width: 100%; }
.rule-input:focus { border-color: var(--color-primary); background: var(--color-surface); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all .12s; white-space: nowrap; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn-primary  { background: var(--color-primary); color: #fff; }
.btn-primary:not(:disabled):hover { background: var(--color-primary-dark); }
.btn-outline  { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
.btn-sm { padding: 6px 12px; font-size: 12px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card    { background: var(--color-surface); border-radius: 12px; padding: 24px; max-width: 420px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,.16); }
.modal-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-title   { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-close   { width: 28px; height: 28px; border: none; background: var(--color-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px; }
.modal-close:hover { background: var(--color-border); }
.modal-body    { display: flex; flex-direction: column; gap: 14px; }
.modal-footer  { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 0.5px solid var(--color-border); }
.field         { display: flex; flex-direction: column; gap: 4px; }
.field-label   { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-input   { height: 36px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none; width: 100%; box-sizing: border-box; }
.field-input:focus { border-color: var(--color-primary); background: var(--color-surface); }
.date-selects  { display: flex; gap: 8px; }
.date-selects .field-input { flex: 1; }

/* Perdiem */
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.section-note   { font-size: 11px; color: var(--color-warning); margin-bottom: 14px; font-style: italic; }
.btn-sm { padding: 5px 12px; font-size: 12px; }
.pd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pd-table th { padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; background: var(--color-bg); border-bottom: 0.5px solid var(--color-border); }
.pd-table td { padding: 10px 12px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text); }
.pd-table tbody tr:last-child td { border-bottom: none; }
.pd-cat      { font-weight: 600; }
.pd-desc     { color: var(--color-text-muted); font-size: 12px; }
.pd-rate     { font-weight: 600; text-align: right; }
.pd-currency { color: var(--color-text-muted); }
.pd-actions  { display: flex; gap: 4px; }
.pd-btn      { width: 28px; height: 28px; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; }
.pd-edit     { background: var(--color-info-bg); color: var(--color-info); }
.pd-del      { background: var(--color-danger-bg); color: var(--color-danger); }
.pd-empty    { text-align: center; padding: 20px; color: var(--color-text-muted); font-style: italic; }

@media (max-width: 768px) {
  .content { padding: 16px; }
  .page-header { flex-direction: column; }
  .summary-grid { grid-template-columns: 1fr; }
  .rules-grid   { grid-template-columns: 1fr; }
}
</style>
