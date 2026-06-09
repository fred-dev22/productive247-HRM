<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar role="employee" />
      <main class="content">

        <div class="page-header">
          <div>
            <div class="page-title">{{ t('absence.new') }}</div>
            <div class="page-sub">{{ auth.user?.name }}</div>
          </div>
          <router-link :to="{ name: 'employe' }" class="btn btn-outline">
            <i class="ti ti-arrow-left" aria-hidden="true"></i> {{ t('absence.actions.back') }}
          </router-link>
        </div>

        <div class="form-wrapper">
          <div class="card form-card">

            <!-- Type -->
            <div class="field">
              <label class="field-label">{{ t('absence.fields.type') }} *</label>
              <select v-model="form.type" class="field-input" :class="{ 'input-error': errors.type }">
                <option value="">{{ t('absence.select_type') }}</option>
                <option v-for="lt in leaveTypes" :key="lt" :value="lt">{{ typeLabel(lt) }}</option>
              </select>
              <div v-if="errors.type" class="error-msg">{{ errors.type }}</div>
              <div v-if="form.type" class="balance-hint">
                <i class="ti ti-wallet" aria-hidden="true"></i>
                {{ t('absence.fields.balance', { count: balanceFor(form.type) }) }}
              </div>
            </div>

            <!-- Dates -->
            <div class="field-row">
              <div class="field">
                <label class="field-label">{{ t('absence.fields.start_date') }} *</label>
                <input
                  type="date"
                  v-model="form.startDate"
                  class="field-input"
                  :class="{ 'input-error': errors.startDate }"
                />
                <div v-if="errors.startDate" class="error-msg">{{ errors.startDate }}</div>
              </div>
              <div class="field">
                <label class="field-label">{{ t('absence.fields.end_date') }} *</label>
                <input
                  type="date"
                  v-model="form.endDate"
                  class="field-input"
                  :class="{ 'input-error': errors.endDate }"
                  :min="form.startDate || undefined"
                />
                <div v-if="errors.endDate" class="error-msg">{{ errors.endDate }}</div>
              </div>
            </div>

            <!-- Badge jours ouvrables -->
            <div v-if="workingDays > 0" class="days-badge">
              <i class="ti ti-sun" aria-hidden="true"></i>
              {{ t('absence.fields.working_days', { count: workingDays }) }}
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
                placeholder="Informations complémentaires..."
              ></textarea>
            </div>

            <!-- Toast -->
            <div v-if="toast" class="toast">
              <i class="ti ti-check" aria-hidden="true"></i> {{ toast }}
            </div>

            <!-- Boutons -->
            <div class="form-actions">
              <button class="btn btn-outline" @click="handleDraft">
                <i class="ti ti-device-floppy" aria-hidden="true"></i> {{ t('absence.actions.save_draft') }}
              </button>
              <button class="btn btn-primary" @click="handleSubmit">
                <i class="ti ti-send" aria-hidden="true"></i> {{ t('absence.actions.submit') }}
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppSidebar, AppTopNav } from '../../components'
import { useAuthStore } from '../../stores/auth'
import { useLeavesStore } from '../../stores/leaves'
import type { LeaveType } from '../../types'

const auth   = useAuthStore()
const leaves = useLeavesStore()
const router = useRouter()
const { t }  = useI18n()

// ── Leave types (internal French values) ────────────────────
const leaveTypes: LeaveType[] = [
  'Congé annuel', 'Congé maladie', 'Récupération', 'Télétravail', 'Congé maternité',
]

// ── Type display helper ──────────────────────────────────────
const typeI18nKey: Record<string, string> = {
  'Congé annuel':    'absence.types.annual',
  'Congé maladie':   'absence.types.sick',
  'Récupération':    'absence.types.recovery',
  'Télétravail':     'absence.types.remote',
  'Congé maternité': 'absence.types.maternity',
}
function typeLabel(type: string): string {
  const key = typeI18nKey[type]
  return key ? t(key) : type
}

const balances: Record<LeaveType, number> = {
  'Congé annuel':              12,
  'Congé maladie':              8,
  'Récupération':               3,
  'Télétravail':                5,
  'Congé maternité':           90,
  'Assistance parentale':       3,
  'Permission exceptionnelle':  2,
}

function balanceFor(type: LeaveType): number {
  return balances[type] ?? 0
}

const form = reactive({
  type: '' as LeaveType | '',
  startDate: '',
  endDate: '',
  reason: '',
})

const errors = reactive({
  type: '',
  startDate: '',
  endDate: '',
})

const toast = ref('')

const workingDays = computed(() => {
  if (!form.startDate || !form.endDate) return 0
  if (form.endDate < form.startDate) return 0
  return leaves.calculateWorkingDays(form.startDate, form.endDate)
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

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

function handleDraft() {
  if (!validate()) return
  leaves.saveDraft({
    type: form.type as LeaveType,
    startDate: form.startDate,
    endDate: form.endDate,
    reason: form.reason || undefined,
  })
  showToast(t('absence.draft_saved'))
}

function handleSubmit() {
  if (!validate()) return
  leaves.submitLeave({
    type: form.type as LeaveType,
    startDate: form.startDate,
    endDate: form.endDate,
    reason: form.reason || undefined,
  })
  router.push({ name: 'employe' })
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--p247-bg); }

.page-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title   { font-size: 18px; font-weight: 600; }
.page-sub     { font-size: 13px; color: var(--p247-muted); margin-top: 1px; }

.btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-primary  { background: var(--p247-orange); color: white; }
.btn-primary:hover  { background: var(--p247-orange-dark); }
.btn-outline  { background: var(--p247-white); color: var(--p247-text); border: 0.5px solid var(--p247-border); }
.btn-outline:hover  { background: var(--p247-bg); }

.form-wrapper { display: flex; justify-content: center; }
.form-card    { width: 100%; max-width: 560px; display: flex; flex-direction: column; gap: 16px; }
.card { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; padding: 20px; }

.field        { display: flex; flex-direction: column; gap: 4px; }
.field-row    { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-label  { font-size: 12px; font-weight: 500; color: var(--p247-text); }
.optional     { font-weight: 400; color: var(--p247-muted); }
.field-input  { height: 34px; padding: 0 10px; border: 0.5px solid var(--p247-border); border-radius: 6px; font-size: 12px; color: var(--p247-text); background: var(--p247-white); outline: none; transition: border-color .12s; }
.field-input:focus   { border-color: var(--p247-orange); }
.input-error         { border-color: var(--p247-danger) !important; }
.field-textarea { padding: 8px 10px; border: 0.5px solid var(--p247-border); border-radius: 6px; font-size: 12px; color: var(--p247-text); background: var(--p247-white); outline: none; resize: vertical; font-family: inherit; transition: border-color .12s; }
.field-textarea:focus { border-color: var(--p247-orange); }
.error-msg    { font-size: 11px; color: var(--p247-danger); }

.balance-hint { font-size: 11px; color: var(--p247-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.balance-hint i { color: var(--p247-orange); }

.days-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--p247-orange-light); color: var(--p247-orange);
  font-size: 12px; font-weight: 600;
  padding: 6px 12px; border-radius: 20px;
  align-self: flex-start;
}

.form-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 4px; }

.toast {
  background: var(--color-success-bg); color: var(--p247-success);
  font-size: 12px; font-weight: 500;
  padding: 8px 12px; border-radius: 6px;
  display: flex; align-items: center; gap: 6px;
}
</style>
