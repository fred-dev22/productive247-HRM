<script setup lang="ts">
/**
 * Fiche de création d'une demande d'absence — sur CreateModalShell (pattern
 * frontdesk). Calcul bidirectionnel jours ↔ date de fin (jours ouvrés du
 * calendrier réel), alertes préavis/solde/jour non ouvrable, intérimaire
 * (vrai employé), workflow "Enregistrement direct" pour les types medicaux
 * (LeaveType.workflowType === 'Medical').
 */
import { reactive, ref, computed, watch } from 'vue'
import {
  Calendar, Clock, Paperclip, TriangleAlert, CircleAlert, CalendarCheck,
} from 'lucide-vue-next'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import * as cls from '../../lib/formClasses'
import { useLeaveRequestStore } from '../../stores/leaveRequests'
import { useLeaveTransactionStore } from '../../stores/leaveTransactions'
import { useCalendarStore } from '../../stores/calendar'
import { useEmployeeStore } from '../../stores/employees'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { calculateEndDate, getWorkingDaysBetween, isWorkingDay } from '../../utils/calendar'

const props = defineProps<{ initialLeaveTypeId?: string }>()
const emit = defineEmits<{ close: []; created: [] }>()

const leaveRequestStore     = useLeaveRequestStore()
const leaveTransactionStore = useLeaveTransactionStore()
const calendarStore         = useCalendarStore()
const employeeStore         = useEmployeeStore()
const leaveTypesStore       = useLeaveTypesStore()

if (!calendarStore.calendar.id) calendarStore.fetchCalendar()
if (calendarStore.holidays.length === 0) calendarStore.fetchHolidays(new Date().getFullYear())
if (leaveTypesStore.leaveTypes.length === 0) leaveTypesStore.fetchAll()
if (leaveTransactionStore.myBalances.length === 0) leaveTransactionStore.fetchMyBalances()

const forWhom = ref<BeneficiaryValue>({ mode: 'self', employeeId: '' })
const employeeItems = computed(() =>
  employeeStore.employees.map(e => ({ id: e.id, label: e.name, sublabel: e.entityName, initials: e.avatarText, avatarColor: e.avatarBg })),
)

const leaveTypeItems = computed(() =>
  leaveTypesStore.activeTypes.map(lt => ({ id: lt.id, label: lt.name })),
)

const form = reactive({
  leaveTypeId:      props.initialLeaveTypeId ?? '',
  startDate:        '',
  startPeriod:      'full' as 'full' | 'am' | 'pm',
  workingDaysCount: null as number | null,
  endDate:          '',
  endPeriod:        'full' as 'full' | 'am' | 'pm',
  interimEmployeeId: '',
  comment:          '',
})
const error = ref('')
const errors = reactive({ employee: '', leaveType: '', startDate: '', workingDays: '' })

const resumeDate = ref('')
const daysMode   = ref<'from-days' | 'from-date'>('from-days')
let calculating  = false

const currentType = computed(() => leaveTypesStore.leaveTypes.find(lt => lt.id === form.leaveTypeId) ?? null)
const isMedicalType = computed(() => currentType.value?.workflowType === 'Medical')

const isPastDate = computed(() => {
  if (!form.startDate) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const p = form.startDate.split('-').map(Number)
  return new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1) < today
})

const isNotWorkingDay = computed(() => {
  if (!form.startDate) return false
  const p = form.startDate.split('-').map(Number)
  return !isWorkingDay(new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1), calendarStore.calendar)
})

const myBalance = computed(() => {
  if (!form.leaveTypeId) return null
  return leaveTransactionStore.myBalances.find(b => b.leaveTypeId === form.leaveTypeId) ?? null
})

const isBalanceInsufficient = computed(() => {
  if (!form.workingDaysCount || !currentType.value || isMedicalType.value) return false
  if (currentType.value.daysPerYear <= 0) return false // illimité
  if (forWhom.value.mode !== 'self' || !myBalance.value) return false
  return form.workingDaysCount > myBalance.value.balance
})

const isNoticePeriodViolated = computed(() => {
  if (!form.startDate || !currentType.value || isMedicalType.value || currentType.value.noticeDays === 0) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const p     = form.startDate.split('-').map(Number)
  const start = new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1)
  const diffDays = Math.ceil((start.getTime() - today.getTime()) / 86400000)
  return diffDays < currentType.value.noticeDays
})

// Auto-calcule la date de fin quand début + nombre de jours changent
watch(
  () => [form.startDate, form.workingDaysCount, form.startPeriod] as const,
  ([start, days, period]) => {
    if (calculating || daysMode.value !== 'from-days') return
    if (!start || !days || days <= 0) { resumeDate.value = ''; return }
    calculating = true
    try {
      const result      = calculateEndDate(start, days, calendarStore.calendar, period)
      form.endDate       = result.endDate
      form.endPeriod      = result.endPeriod
      resumeDate.value   = result.resumeDate
    } finally {
      calculating = false
    }
  },
)

function onDaysInput() { daysMode.value = 'from-days' }

function onEndDateChange() {
  if (calculating) return
  if (!form.startDate || !form.endDate) return
  daysMode.value = 'from-date'
  calculating = true
  try {
    const days = getWorkingDaysBetween(form.startDate, form.endDate, calendarStore.calendar)
    form.workingDaysCount = days
    if (days > 0) {
      const result      = calculateEndDate(form.startDate, days, calendarStore.calendar, form.startPeriod)
      resumeDate.value  = result.resumeDate
    }
  } finally {
    calculating = false
    daysMode.value = 'from-days'
  }
}

function formatDateFR(dateStr: string): string {
  const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const p = dateStr.split('-').map(Number)
  return `${p[2] ?? ''} ${MONTHS_FR[(p[1] ?? 1) - 1] ?? ''} ${p[0] ?? ''}`
}

function validate(): boolean {
  errors.employee = ''; errors.leaveType = ''; errors.startDate = ''; errors.workingDays = ''
  let ok = true
  if (forWhom.value.mode === 'for-employee' && !forWhom.value.employeeId) { errors.employee = 'Veuillez sélectionner un employé'; ok = false }
  if (!form.leaveTypeId) { errors.leaveType = 'Le type est obligatoire'; ok = false }
  if (!form.startDate) { errors.startDate = 'La date de début est obligatoire'; ok = false }
  if (isNotWorkingDay.value) { errors.startDate = "Ce jour n'est pas un jour ouvrable"; ok = false }
  if (!form.workingDaysCount || form.workingDaysCount <= 0) { errors.workingDays = 'Nombre de jours requis (min. 0.5)'; ok = false }
  if (isBalanceInsufficient.value) { errors.workingDays = `Solde insuffisant (${myBalance.value?.balance ?? 0} j disponibles)` ; ok = false }
  error.value = ok ? '' : 'Veuillez corriger les champs en erreur'
  return ok
}

function buildPayload() {
  return {
    leaveTypeId: form.leaveTypeId,
    startDate:   form.startDate,
    endDate:     form.endDate || form.startDate,
    reason:      form.comment || undefined,
    interimEmployeeId: form.interimEmployeeId || undefined,
    employeeId:  forWhom.value.mode === 'for-employee' ? forWhom.value.employeeId : undefined,
  }
}

async function create() {
  if (!validate()) return
  try {
    await leaveRequestStore.createAndSubmit(buildPayload())
    emit('created'); emit('close')
  } catch {
    error.value = leaveRequestStore.error ?? "La soumission a échoué. Veuillez réessayer."
  }
}
async function saveDraft() {
  if (!validate()) return
  try {
    await leaveRequestStore.saveDraft(buildPayload())
    emit('created'); emit('close')
  } catch {
    error.value = leaveRequestStore.error ?? "L'enregistrement a échoué. Veuillez réessayer."
  }
}
</script>

<template>
  <CreateModalShell
    title="Nouvelle demande d'absence"
    banner-label="Nouvelle demande d'absence"
    :create-label="isMedicalType ? 'Enregistrer la déclaration' : 'Soumettre la demande'"
    :save-error="error"
    @close="emit('close')"
    @create="create"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-3xl mx-auto">
          <FormSection title="Bénéficiaire">
          <ForWhomSelector v-model="forWhom" :available-employees="employeeItems" :error-employee="errors.employee" />
          </FormSection>

          <FormSection title="Détails de la demande">
          <div class="flex flex-col gap-4">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Type d'absence <span class="text-danger">*</span></label>
              <SearchableDropdown
                :items="leaveTypeItems"
                :model-value="form.leaveTypeId"
                placeholder="Sélectionner un type…"
                :show-avatar="false"
                @update:model-value="form.leaveTypeId = String($event)"
              />
              <div v-if="errors.leaveType" :class="cls.fieldError">{{ errors.leaveType }}</div>

              <div v-if="currentType" class="flex flex-wrap gap-1.5 mt-1.5">
                <span :class="cls.hintChipNeutral"><Calendar class="w-3 h-3" /> Solde : {{ myBalance ? `${myBalance.balance} j` : `${currentType.daysPerYear} j/an` }}</span>
                <span v-if="currentType.noticeDays > 0 && !isMedicalType" :class="cls.hintChipInfo"><Clock class="w-3 h-3" /> Préavis : {{ currentType.noticeDays }} jour(s)</span>
                <span :class="currentType.documentRequired ? cls.hintChipWarning : cls.hintChipNeutral">
                  <Paperclip class="w-3 h-3" /> Justificatif : {{ currentType.documentRequired ? 'Requis' : 'Non requis' }}
                </span>
                <span v-if="isMedicalType" :class="cls.hintChipInfo">Enregistrement direct, sans validation préalable</span>
              </div>
            </div>

            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date de début <span class="text-danger">*</span></label>
              <input type="date" v-model="form.startDate" :class="[cls.fieldInput, errors.startDate && cls.inputError]" />
              <div v-if="errors.startDate" :class="cls.fieldError">{{ errors.startDate }}</div>
              <div v-if="isPastDate && !isMedicalType" :class="cls.fieldWarning"><TriangleAlert class="w-3.5 h-3.5 shrink-0" /> La date est dans le passé, confirmez-vous ?</div>
            </div>

            <div :class="cls.field">
              <span :class="cls.fieldLabel">Période de début</span>
              <div :class="cls.radioGroup">
                <label :class="cls.radioItem"><input type="radio" v-model="form.startPeriod" value="full" /><span>Journée entière</span></label>
                <label :class="cls.radioItem"><input type="radio" v-model="form.startPeriod" value="am" /><span>Matin</span></label>
                <label :class="cls.radioItem"><input type="radio" v-model="form.startPeriod" value="pm" /><span>Après-midi</span></label>
              </div>
            </div>

            <div :class="cls.fieldRow">
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Nombre de jours <span class="text-danger">*</span></label>
                <input
                  type="number" min="0.5" step="0.5"
                  v-model.number="form.workingDaysCount"
                  :class="[cls.fieldInput, errors.workingDays && cls.inputError]"
                  placeholder="ex: 3.5"
                  @input="onDaysInput"
                />
                <div v-if="errors.workingDays" :class="cls.fieldError">{{ errors.workingDays }}</div>
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Date de fin</label>
                <input
                  type="date" v-model="form.endDate"
                  :class="[cls.fieldInput, daysMode === 'from-days' && 'bg-primary/10 text-primary']"
                  @change="onEndDateChange"
                />
                <span
                  v-if="form.endDate && form.workingDaysCount"
                  class="inline-flex items-center text-[11px] font-semibold rounded-md px-2 py-[3px] mt-1 w-fit"
                  :class="isBalanceInsufficient ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success'"
                >{{ form.workingDaysCount }} j ouvrables</span>
              </div>
            </div>

            <div :class="cls.field">
              <span :class="cls.fieldLabel">Période de fin</span>
              <div :class="cls.radioGroup">
                <label :class="cls.radioItem"><input type="radio" v-model="form.endPeriod" value="full" /><span>Journée entière</span></label>
                <label :class="cls.radioItem"><input type="radio" v-model="form.endPeriod" value="am" /><span>Matin</span></label>
                <label :class="cls.radioItem"><input type="radio" v-model="form.endPeriod" value="pm" /><span>Après-midi</span></label>
              </div>
            </div>

            <div v-if="resumeDate" class="flex items-center gap-2 text-[13px] text-muted-foreground bg-primary/10 rounded-md px-3 py-2">
              <CalendarCheck class="w-4 h-4 text-primary shrink-0" />
              <span>Reprise prévue le <strong class="text-primary">{{ formatDateFR(resumeDate) }}</strong></span>
            </div>

            <div v-if="isNotWorkingDay" :class="cls.fieldErrorBlock"><CircleAlert class="w-3.5 h-3.5 shrink-0" /> Ce jour n'est pas un jour ouvrable</div>
            <div v-if="isBalanceInsufficient" :class="cls.fieldErrorBlock"><CircleAlert class="w-3.5 h-3.5 shrink-0" /> Solde insuffisant ({{ myBalance?.balance ?? 0 }} jours disponibles)</div>
            <div v-if="isNoticePeriodViolated" :class="cls.fieldErrorBlock"><CircleAlert class="w-3.5 h-3.5 shrink-0" /> Préavis de {{ currentType?.noticeDays }} jour(s) requis pour ce type</div>

            <div :class="cls.field">
              <label :class="cls.fieldLabel">Intérimaire <span :class="cls.fieldOptional">(optionnel)</span></label>
              <SearchableDropdown
                :items="employeeItems"
                :model-value="form.interimEmployeeId"
                placeholder="Qui assure votre intérim ?"
                @update:model-value="form.interimEmployeeId = String($event)"
              />
            </div>

            <div :class="cls.field">
              <label :class="cls.fieldLabel">Motif <span :class="cls.fieldOptional">(optionnel)</span></label>
              <textarea v-model="form.comment" :class="cls.fieldTextarea" rows="3" placeholder="Précisez si nécessaire…"></textarea>
            </div>
          </div>
          </FormSection>

          <div class="mt-6 pt-4 border-t border-border flex justify-end gap-2">
            <button :class="cls.btnOutline" @click="saveDraft">Enregistrer comme brouillon</button>
          </div>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
