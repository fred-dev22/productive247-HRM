<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-card">

        <!-- ── En-tête ── -->
        <div class="modal-header">
          <span class="modal-title-text">{{ t('absence.new') }}</span>
          <button class="modal-close-btn" @click="close" :title="t('absence.close')">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <!-- ── Corps ── -->
        <div class="modal-body">

          <!-- Champ 1: Type d'absence -->
          <div class="field">
            <label class="field-label">{{ t('absence.fields.type') }} *</label>
            <select v-model="form.type" class="field-input" :class="{ 'input-error': errors.type }">
              <option value="">{{ t('absence.select_type') }}</option>
              <option v-for="lt in leaveTypes" :key="lt" :value="lt">{{ typeLabel(lt) }}</option>
            </select>
            <div v-if="errors.type" class="field-error">{{ errors.type }}</div>

            <div v-if="currentRule" class="rule-hint">
              <span class="hint-chip hint-chip--neutral">
                <i class="ti ti-calendar" aria-hidden="true"></i>
                Solde : {{ currentRule.daysPerYear }} j/an
              </span>
              <span v-if="currentRule.noticeDays > 0" class="hint-chip hint-chip--info">
                <i class="ti ti-clock" aria-hidden="true"></i>
                Préavis : {{ currentRule.noticeDays }} jour(s)
              </span>
              <span class="hint-chip" :class="currentRule.requiresDocument ? 'hint-chip--warning' : 'hint-chip--neutral'">
                <i class="ti ti-paperclip" aria-hidden="true"></i>
                Justificatif : {{ currentRule.requiresDocument ? 'Requis' : 'Non requis' }}
              </span>
            </div>
          </div>

          <!-- Champ 2: Date de début -->
          <div class="field">
            <label class="field-label">{{ t('absence.fields.start_date') }} *</label>
            <input
              type="date"
              v-model="form.startDate"
              class="field-input"
              :class="{ 'input-error': errors.startDate }"
            />
            <div v-if="errors.startDate" class="field-error">{{ errors.startDate }}</div>
            <div v-if="isPastDate" class="field-warning">
              <i class="ti ti-alert-triangle" aria-hidden="true"></i>
              La date est dans le passé, confirmez-vous ?
            </div>
            <div v-if="isNotWorkingDay" class="field-error">
              <i class="ti ti-alert-circle" aria-hidden="true"></i>
              Ce jour n'est pas un jour ouvrable
            </div>
          </div>

          <!-- Champ 3: Période début -->
          <div class="field">
            <span class="field-label">Période de début</span>
            <div class="radio-group">
              <label class="radio-item">
                <input type="radio" v-model="form.startPeriod" value="full" />
                <span>Journée entière</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="form.startPeriod" value="am" />
                <span>Matin</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="form.startPeriod" value="pm" />
                <span>Après-midi</span>
              </label>
            </div>
          </div>

          <!-- Champ 4 + 5: Nombre de jours + Date de fin -->
          <div class="field-row">
            <div class="field">
              <label class="field-label">Nombre de jours *</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                v-model.number="form.workingDaysCount"
                class="field-input"
                :class="{ 'input-error': errors.workingDays }"
                placeholder="ex: 3.5"
                @input="onDaysInput"
              />
              <div v-if="errors.workingDays" class="field-error">{{ errors.workingDays }}</div>
            </div>

            <div class="field">
              <label class="field-label">Date de fin</label>
              <div class="field-readonly-wrap">
                <input
                  type="date"
                  v-model="form.endDate"
                  class="field-input"
                  :class="{ 'days-computed': daysMode === 'from-days' }"
                  @change="onEndDateChange"
                />
                <span v-if="form.endDate && form.workingDaysCount" class="days-badge"
                  :class="isBalanceInsufficient ? 'days-badge--over' : 'days-badge--ok'">
                  {{ form.workingDaysCount }} j ouvrables
                </span>
              </div>
            </div>
          </div>

          <!-- Champ 6: Période fin -->
          <div class="field">
            <span class="field-label">Période de fin</span>
            <div class="radio-group">
              <label class="radio-item">
                <input type="radio" v-model="form.endPeriod" value="full" />
                <span>Journée entière</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="form.endPeriod" value="am" />
                <span>Matin</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="form.endPeriod" value="pm" />
                <span>Après-midi</span>
              </label>
            </div>
          </div>

          <!-- Champ 7: Date de reprise (auto) -->
          <div v-if="resumeDate" class="resume-info">
            <i class="ti ti-calendar-check" aria-hidden="true"></i>
            Reprise prévue le <strong>{{ formatDateFR(resumeDate) }}</strong>
          </div>

          <!-- Erreurs de validation métier -->
          <div v-if="isBalanceInsufficient" class="field-error field-error--block">
            <i class="ti ti-alert-circle" aria-hidden="true"></i>
            Solde insuffisant ({{ currentRule?.daysPerYear ?? 0 }} jours disponibles)
          </div>
          <div v-if="isNoticePeriodViolated" class="field-error field-error--block">
            <i class="ti ti-alert-circle" aria-hidden="true"></i>
            Préavis de {{ currentRule?.noticeDays }} jour(s) requis pour ce type
          </div>

          <!-- Champ 8: Intérimaire (masqué pour Télétravail) -->
          <div v-if="form.type && form.type !== 'Télétravail'" class="field">
            <label class="field-label">
              Intérimaire
              <span class="optional">(optionnel)</span>
            </label>
            <input
              type="text"
              v-model="form.interim"
              class="field-input"
              placeholder="Qui assure votre intérim ?"
            />
          </div>

          <!-- Champ 9: Commentaire -->
          <div class="field">
            <label class="field-label">
              {{ t('absence.fields.reason') }}
              <span class="optional">({{ t('absence.optional') }})</span>
            </label>
            <textarea
              v-model="form.comment"
              class="field-textarea"
              rows="3"
              placeholder="Précisez si nécessaire..."
            ></textarea>
          </div>

        </div>

        <!-- ── Pied ── -->
        <div class="modal-footer">
          <button class="btn btn-outline" @click="handleDraft">
            <i class="ti ti-device-floppy" aria-hidden="true"></i>
            {{ t('absence.actions.save_draft') }}
          </button>
          <button class="btn btn-primary" @click="handleSubmit">
            <i class="ti ti-send" aria-hidden="true"></i>
            {{ t('absence.actions.submit') }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAbsenceStore }  from '../stores/absences'
import { useCalendarStore } from '../stores/calendar'
import { calculateEndDate, getWorkingDaysBetween, isWorkingDay } from '../utils/calendar'
import type { LeaveType } from '../types'

const props = defineProps<{
  modelValue: boolean
  initialType?: LeaveType | ''
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'drafted': []
  'submitted': []
}>()

const absenceStore  = useAbsenceStore()
const calendarStore = useCalendarStore()
const { t }         = useI18n()

const leaveTypes: LeaveType[] = [
  'Congé annuel', 'Congé maladie', 'Congé maternité',
  'Récupération', 'Assistance parentale', 'Permission exceptionnelle', 'Télétravail',
]

const typeI18nKey: Record<string, string> = {
  'Congé annuel':              'absence.types.annual',
  'Congé maladie':             'absence.types.sick',
  'Congé maternité':           'absence.types.maternity',
  'Récupération':              'absence.types.recovery',
  'Assistance parentale':      'absence.types.parental',
  'Permission exceptionnelle': 'absence.types.exceptional',
  'Télétravail':               'absence.types.remote',
}
function typeLabel(type: string): string {
  const key = typeI18nKey[type]
  return key ? t(key) : type
}

// ── Form state ─────────────────────────────────────────────────
const form = reactive({
  type:             '' as LeaveType | '',
  startDate:        '',
  startPeriod:      'full' as 'full' | 'am' | 'pm',
  workingDaysCount: null as number | null,
  endDate:          '',
  endPeriod:        'full' as 'full' | 'am' | 'pm',
  interim:          '',
  comment:          '',
})

const errors = reactive({
  type:         '',
  startDate:    '',
  workingDays:  '',
})

const resumeDate = ref('')
const daysMode   = ref<'from-days' | 'from-date'>('from-days')
let   calculating = false

// ── Computed ───────────────────────────────────────────────────
const currentRule = computed(() =>
  form.type ? calendarStore.getLeaveRule(form.type as LeaveType) : null
)

const isPastDate = computed(() => {
  if (!form.startDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const p = form.startDate.split('-').map(Number)
  return new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1) < today
})

const isNotWorkingDay = computed(() => {
  if (!form.startDate) return false
  const p = form.startDate.split('-').map(Number)
  return !isWorkingDay(new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1), calendarStore.calendar)
})

const isBalanceInsufficient = computed(() => {
  if (!form.workingDaysCount || !currentRule.value) return false
  const limit = currentRule.value.daysPerYear
  return limit > 0 && form.workingDaysCount > limit
})

const isNoticePeriodViolated = computed(() => {
  if (!form.startDate || !currentRule.value || currentRule.value.noticeDays === 0) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const p     = form.startDate.split('-').map(Number)
  const start = new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1)
  const diffDays = Math.ceil((start.getTime() - today.getTime()) / 86400000)
  return diffDays < currentRule.value.noticeDays
})

// ── Watchers ───────────────────────────────────────────────────
watch(() => props.modelValue, (val) => {
  if (val) {
    form.type             = props.initialType ?? ''
    form.startDate        = ''
    form.startPeriod      = 'full'
    form.workingDaysCount = null
    form.endDate          = ''
    form.endPeriod        = 'full'
    form.interim          = ''
    form.comment          = ''
    resumeDate.value      = ''
    daysMode.value        = 'from-days'
    errors.type           = ''
    errors.startDate      = ''
    errors.workingDays    = ''
  }
})

// Auto-calculate end date when start + days change
watch(
  () => [form.startDate, form.workingDaysCount, form.startPeriod] as const,
  ([start, days, period]) => {
    if (calculating || daysMode.value !== 'from-days') return
    if (!start || !days || days <= 0) { resumeDate.value = ''; return }
    calculating = true
    try {
      const result  = calculateEndDate(start, days, calendarStore.calendar, period)
      form.endDate  = result.endDate
      form.endPeriod = result.endPeriod
      resumeDate.value = result.resumeDate
    } finally {
      calculating = false
    }
  },
)

function onDaysInput() {
  daysMode.value = 'from-days'
}

function onEndDateChange() {
  if (calculating) return
  if (!form.startDate || !form.endDate) return
  daysMode.value = 'from-date'
  calculating = true
  try {
    const days = getWorkingDaysBetween(form.startDate, form.endDate, calendarStore.calendar)
    form.workingDaysCount = days
    if (days > 0) {
      const result     = calculateEndDate(form.startDate, days, calendarStore.calendar, form.startPeriod)
      resumeDate.value = result.resumeDate
    }
  } finally {
    calculating = false
    daysMode.value = 'from-days'
  }
}

function formatDateFR(dateStr: string): string {
  const MONTHS_FR = [
    'jan', 'fév', 'mar', 'avr', 'mai', 'jun',
    'jul', 'aoû', 'sep', 'oct', 'nov', 'déc',
  ]
  const p = dateStr.split('-').map(Number)
  return `${p[2] ?? ''} ${MONTHS_FR[(p[1] ?? 1) - 1] ?? ''} ${p[0] ?? ''}`
}

// ── Validation ─────────────────────────────────────────────────
function validate(): boolean {
  errors.type        = ''
  errors.startDate   = ''
  errors.workingDays = ''
  let ok = true

  if (!form.type) {
    errors.type = t('validation.required_type')
    ok = false
  }
  if (!form.startDate) {
    errors.startDate = t('validation.required_start')
    ok = false
  }
  if (isNotWorkingDay.value) {
    errors.startDate = 'Ce jour n\'est pas un jour ouvrable'
    ok = false
  }
  if (!form.workingDaysCount || form.workingDaysCount <= 0) {
    errors.workingDays = 'Nombre de jours requis (min. 0.5)'
    ok = false
  }
  if (isBalanceInsufficient.value) {
    errors.workingDays = `Solde insuffisant (${currentRule.value?.daysPerYear ?? 0} j disponibles)`
    ok = false
  }
  return ok
}

function close() { emit('update:modelValue', false) }

function handleDraft() {
  if (!validate()) return
  absenceStore.saveDraft({
    type:      form.type as LeaveType,
    startDate: form.startDate,
    endDate:   form.endDate || form.startDate,
    reason:    form.comment || undefined,
  })
  close()
  emit('drafted')
}

function handleSubmit() {
  if (!validate()) return
  absenceStore.submitLeave({
    type:      form.type as LeaveType,
    startDate: form.startDate,
    endDate:   form.endDate || form.startDate,
    reason:    form.comment || undefined,
  })
  close()
  emit('submitted')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.modal-card {
  position: relative;
  background: var(--color-surface);
  border-radius: 12px;
  padding: 28px;
  max-width: 560px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,.16);
  display: flex; flex-direction: column;
  max-height: 92vh;
  overflow-y: auto;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.modal-title-text { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-close-btn {
  width: 28px; height: 28px; border: none;
  background: var(--color-bg); border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); font-size: 14px; flex-shrink: 0;
  transition: background .12s, color .12s;
}
.modal-close-btn:hover { background: var(--color-border); color: var(--color-text); }

.modal-body { display: flex; flex-direction: column; gap: 14px; }

.field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text); }
.optional { font-weight: 400; color: var(--color-text-muted); }

.field-input {
  height: 38px; padding: 0 10px;
  border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); font-size: 13px;
  color: var(--color-text); outline: none;
  width: 100%; box-sizing: border-box;
  transition: border-color .12s, background .12s;
}
.field-input:focus { border-color: var(--color-primary); background: var(--color-surface); }
.field-input.input-error { border-color: var(--color-danger) !important; }
.field-input.days-computed { background: var(--color-primary-light); color: var(--color-primary); }

.field-textarea {
  padding: 8px 10px;
  border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); font-size: 13px;
  color: var(--color-text); outline: none;
  resize: vertical; font-family: inherit;
  width: 100%; box-sizing: border-box;
  transition: border-color .12s, background .12s;
}
.field-textarea:focus { border-color: var(--color-primary); background: var(--color-surface); }

.field-error { font-size: 11px; color: var(--color-danger); display: flex; align-items: center; gap: 4px; }
.field-error--block {
  background: var(--color-danger-bg);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
}
.field-warning {
  font-size: 11px; color: var(--color-warning);
  display: flex; align-items: center; gap: 4px;
  background: var(--color-warning-bg);
  border-radius: 4px; padding: 4px 8px;
}

/* Rule hints */
.rule-hint {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-top: 6px;
}
.hint-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 500;
  border-radius: 20px; padding: 3px 10px;
}
.hint-chip--neutral { background: var(--color-neutral-bg); color: var(--color-neutral); }
.hint-chip--info    { background: var(--color-info-bg);    color: var(--color-info); }
.hint-chip--warning { background: var(--color-warning-bg); color: var(--color-warning); }

/* Radio groups */
.radio-group { display: flex; gap: 16px; flex-wrap: wrap; }
.radio-item  {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--color-text); cursor: pointer;
}
.radio-item input[type="radio"] { accent-color: var(--color-primary); cursor: pointer; }

/* Field row */
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* End date + badge */
.field-readonly-wrap { position: relative; }
.days-badge {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 600;
  border-radius: 6px; padding: 3px 8px;
  margin-top: 4px;
}
.days-badge--ok   { background: var(--color-success-bg); color: var(--color-success); }
.days-badge--over { background: var(--color-danger-bg);  color: var(--color-danger);  }

/* Resume date */
.resume-info {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--color-text-muted);
  background: var(--color-primary-light);
  border-radius: 6px; padding: 8px 12px;
}
.resume-info i { color: var(--color-primary); }
.resume-info strong { color: var(--color-primary); }

.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  margin-top: 20px; padding-top: 16px;
  border-top: 0.5px solid var(--color-border);
}

.btn {
  padding: 8px 16px; border-radius: 6px;
  font-size: 13px; font-weight: 500;
  cursor: pointer; border: none;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all .12s; white-space: nowrap;
}
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

@media (max-width: 600px) {
  .modal-card  { padding: 20px; }
  .field-row   { grid-template-columns: 1fr; }
  .radio-group { flex-direction: column; gap: 8px; }
  .modal-footer { flex-direction: column-reverse; }
  .btn { width: 100%; justify-content: center; }
}
</style>
