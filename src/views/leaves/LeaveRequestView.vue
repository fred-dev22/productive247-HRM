<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <div :class="L.pageHeader">
          <div>
            <div :class="L.pageTitle">{{ t('absence.new') }}</div>
            <div :class="L.pageSub">{{ auth.user?.name }}</div>
          </div>
        </div>

        <div class="flex justify-center">
          <div class="bg-card border border-border rounded-lg p-5 w-full max-w-[560px] flex flex-col gap-4">

            <!-- Type -->
            <div :class="cls.field">
              <label :class="cls.fieldLabel">{{ t('absence.fields.type') }} *</label>
              <select v-model="form.type" :class="[cls.fieldSelect, errors.type && cls.inputError]">
                <option value="">{{ t('absence.select_type') }}</option>
                <option v-for="lt in leaveTypes" :key="lt" :value="lt">{{ typeLabel(lt) }}</option>
              </select>
              <div v-if="errors.type" :class="cls.fieldError">{{ errors.type }}</div>
              <div v-if="form.type" class="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Wallet class="w-3 h-3 text-primary" />
                {{ t('absence.fields.balance', { count: balanceFor(form.type) }) }}
              </div>
            </div>

            <!-- Dates -->
            <div :class="cls.fieldRow">
              <div :class="cls.field">
                <label :class="cls.fieldLabel">{{ t('absence.fields.start_date') }} *</label>
                <input type="date" v-model="form.startDate" :class="[cls.fieldInput, errors.startDate && cls.inputError]" />
                <div v-if="errors.startDate" :class="cls.fieldError">{{ errors.startDate }}</div>
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">{{ t('absence.fields.end_date') }} *</label>
                <input type="date" v-model="form.endDate" :class="[cls.fieldInput, errors.endDate && cls.inputError]" :min="form.startDate || undefined" />
                <div v-if="errors.endDate" :class="cls.fieldError">{{ errors.endDate }}</div>
              </div>
            </div>

            <!-- Badge jours ouvrables -->
            <div v-if="workingDays > 0" class="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full self-start">
              <Sun class="w-3.5 h-3.5" />
              {{ t('absence.fields.working_days', { count: workingDays }) }}
            </div>

            <!-- Commentaire -->
            <div :class="cls.field">
              <label :class="cls.fieldLabel">
                {{ t('absence.fields.reason') }}
                <span :class="cls.fieldOptional">({{ t('absence.optional') }})</span>
              </label>
              <textarea v-model="form.reason" :class="cls.fieldTextarea" rows="3" placeholder="Informations complémentaires..."></textarea>
            </div>

            <!-- Toast -->
            <div v-if="toast" class="bg-success-bg text-success text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5">
              <Check class="w-3.5 h-3.5" /> {{ toast }}
            </div>

            <!-- Boutons -->
            <div class="flex gap-2 flex-wrap pt-1">
              <button :class="cls.btnOutline" @click="handleDraft">
                <Save class="w-4 h-4" /> {{ t('absence.actions.save_draft') }}
              </button>
              <button :class="cls.btnPrimary" @click="handleSubmit">
                <Send class="w-4 h-4" /> {{ t('absence.actions.submit') }}
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
import { Wallet, Sun, Check, Save, Send } from 'lucide-vue-next'
import { AppSidebar, AppTopNav } from '../../components'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
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
  router.push({ name: 'employee-dashboard' })
}
</script>
