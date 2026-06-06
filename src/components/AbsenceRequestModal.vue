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

          <!-- Type d'absence -->
          <div class="field">
            <label class="field-label">{{ t('absence.fields.type') }} *</label>
            <select v-model="form.type" class="field-input" :class="{ 'input-error': errors.type }">
              <option value="">{{ t('absence.select_type') }}</option>
              <option v-for="lt in leaveTypes" :key="lt" :value="lt">{{ typeLabel(lt) }}</option>
            </select>
            <div v-if="errors.type" class="field-error">{{ errors.type }}</div>
            <div v-if="form.type" class="balance-hint">
              {{ t('absence.fields.balance', { count: balanceFor(form.type as LeaveType) }) }}
            </div>
          </div>

          <!-- Date de début -->
          <div class="field">
            <label class="field-label">{{ t('absence.fields.start_date') }} *</label>
            <input
              type="date"
              v-model="form.startDate"
              class="field-input"
              :class="{ 'input-error': errors.startDate }"
            />
            <div v-if="errors.startDate" class="field-error">{{ errors.startDate }}</div>
          </div>

          <!-- Date de fin -->
          <div class="field">
            <label class="field-label">{{ t('absence.fields.end_date') }} *</label>
            <input
              type="date"
              v-model="form.endDate"
              class="field-input"
              :class="{ 'input-error': errors.endDate }"
              :min="form.startDate || undefined"
            />
            <div v-if="errors.endDate" class="field-error">{{ errors.endDate }}</div>
          </div>

          <!-- Badge jours ouvrables -->
          <div v-if="workingDays > 0" class="days-badge">
            {{ workingDays }} jours ouvrables
          </div>

          <!-- Commentaire -->
          <div class="field">
            <label class="field-label">
              {{ t('absence.fields.reason') }}
              <span class="optional">({{ t('absence.optional') }})</span>
            </label>
            <textarea
              v-model="form.reason"
              class="field-textarea"
              rows="3"
              placeholder="Précisez si nécessaire..."
            ></textarea>
          </div>

        </div>

        <!-- ── Pied de modale ── -->
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
import { reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAbsenceStore } from '../stores/absences'
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

const absenceStore = useAbsenceStore()
const { t } = useI18n()

const leaveTypes: LeaveType[] = [
  'Congé annuel',
  'Congé maladie',
  'Congé maternité',
  'Récupération',
  'Assistance parentale',
  'Permission exceptionnelle',
  'Télétravail',
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

const balances: Record<string, number> = {
  'Congé annuel':              12,
  'Congé maladie':             8,
  'Récupération':              3,
  'Télétravail':               5,
  'Congé maternité':           90,
  'Assistance parentale':      3,
  'Permission exceptionnelle': 3,
}

function balanceFor(type: LeaveType): number {
  return balances[type] ?? 0
}

const form = reactive({
  type:      '' as LeaveType | '',
  startDate: '',
  endDate:   '',
  reason:    '',
})

const errors = reactive({
  type:      '',
  startDate: '',
  endDate:   '',
})

// Réinitialise le formulaire à chaque ouverture
watch(() => props.modelValue, (val) => {
  if (val) {
    form.type      = props.initialType ?? ''
    form.startDate = ''
    form.endDate   = ''
    form.reason    = ''
    errors.type      = ''
    errors.startDate = ''
    errors.endDate   = ''
  }
})

const workingDays = computed(() => {
  if (!form.startDate || !form.endDate || form.endDate < form.startDate) return 0
  return absenceStore.calculateWorkingDays(form.startDate, form.endDate)
})

function validate(): boolean {
  errors.type      = ''
  errors.startDate = ''
  errors.endDate   = ''
  let ok = true
  if (!form.type) {
    errors.type = t('validation.required_type')
    ok = false
  }
  if (!form.startDate) {
    errors.startDate = t('validation.required_start')
    ok = false
  }
  if (!form.endDate) {
    errors.endDate = t('validation.required_end')
    ok = false
  } else if (form.startDate && form.endDate < form.startDate) {
    errors.endDate = t('validation.end_before_start')
    ok = false
  }
  return ok
}

function close() {
  emit('update:modelValue', false)
}

function handleDraft() {
  if (!validate()) return
  absenceStore.saveDraft({
    type:      form.type as LeaveType,
    startDate: form.startDate,
    endDate:   form.endDate,
    reason:    form.reason || undefined,
  })
  close()
  emit('drafted')
}

function handleSubmit() {
  if (!validate()) return
  absenceStore.submitLeave({
    type:      form.type as LeaveType,
    startDate: form.startDate,
    endDate:   form.endDate,
    reason:    form.reason || undefined,
  })
  close()
  emit('submitted')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 28px;
  max-width: 520px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--p247-text);
}

.modal-close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--p247-bg);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--p247-muted);
  font-size: 14px;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}

.modal-close-btn:hover {
  background: var(--p247-border);
  color: var(--p247-text);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--p247-text);
}

.optional {
  font-weight: 400;
  color: var(--p247-muted);
}

.field-input {
  height: 40px;
  padding: 0 10px;
  border: 0.5px solid var(--p247-border);
  border-radius: 6px;
  background: var(--p247-bg);
  font-size: 13px;
  color: var(--p247-text);
  outline: none;
  transition: border-color 0.12s, background 0.12s;
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: var(--p247-orange);
  background: white;
}

.input-error {
  border-color: var(--p247-danger) !important;
}

.field-textarea {
  padding: 8px 10px;
  border: 0.5px solid var(--p247-border);
  border-radius: 6px;
  background: var(--p247-bg);
  font-size: 13px;
  color: var(--p247-text);
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.12s, background 0.12s;
  width: 100%;
  box-sizing: border-box;
}

.field-textarea:focus {
  border-color: var(--p247-orange);
  background: white;
}

.field-error {
  font-size: 11px;
  color: var(--p247-danger);
}

.balance-hint {
  font-size: 12px;
  color: var(--p247-muted);
}

.days-badge {
  display: inline-flex;
  align-items: center;
  background: var(--p247-orange-light);
  color: var(--p247-orange);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  align-self: flex-start;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 0.5px solid var(--p247-border);
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.12s;
  white-space: nowrap;
}

.btn-primary {
  background: var(--p247-orange);
  color: white;
}

.btn-primary:hover {
  background: var(--p247-orange-dark);
}

.btn-outline {
  background: white;
  color: var(--p247-text);
  border: 0.5px solid var(--p247-border);
}

.btn-outline:hover {
  background: var(--p247-bg);
}

@media (max-width: 600px) {
  .modal-card {
    padding: 20px;
    width: 90%;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
