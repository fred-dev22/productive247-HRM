<script setup lang="ts">
/**
 * Fiche de création d'une demande d'absence — sur CreateModalShell (pattern
 * frontdesk). Logique du store inchangée (submitLeave / saveDraft).
 */
import { ref, computed } from 'vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import * as cls from '../../lib/formClasses'
import { useAbsenceStore } from '../../stores/absences'
import type { LeaveType } from '../../types'

const emit = defineEmits<{ close: []; created: [] }>()
const absenceStore = useAbsenceStore()

const TYPE_OPTIONS: LeaveType[] = ['Congé annuel', 'Congé maladie', 'Récupération', 'Télétravail', 'Congé maternité']

const form = ref({ type: 'Congé annuel' as LeaveType, startDate: '', endDate: '', reason: '' })
const error = ref('')

const workingDays = computed(() =>
  form.value.startDate && form.value.endDate && form.value.endDate >= form.value.startDate
    ? absenceStore.calculateWorkingDays(form.value.startDate, form.value.endDate)
    : 0,
)

function validate(): boolean {
  if (!form.value.startDate || !form.value.endDate) { error.value = 'Veuillez renseigner les dates'; return false }
  if (form.value.endDate < form.value.startDate)    { error.value = 'La date de fin doit être postérieure à la date de début'; return false }
  error.value = ''
  return true
}

function create() {
  if (!validate()) return
  absenceStore.submitLeave({
    type: form.value.type,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    reason: form.value.reason || undefined,
  })
  emit('created')
  emit('close')
}

function saveDraft() {
  if (!validate()) return
  absenceStore.saveDraft({
    type: form.value.type,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    reason: form.value.reason || undefined,
  })
  emit('created')
  emit('close')
}
</script>

<template>
  <CreateModalShell
    title="Nouvelle demande d'absence"
    banner-label="Nouvelle demande d'absence"
    create-label="Soumettre la demande"
    :save-error="error"
    @close="emit('close')"
    @create="create"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-3xl">
          <div class="flex items-center border-b-2 border-primary pb-2 mb-5">
            <h2 class="text-base font-bold text-foreground">Détails de la demande</h2>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Type d'absence <span class="text-danger">*</span></label>
              <select v-model="form.type" :class="cls.fieldSelect">
                <option v-for="t in TYPE_OPTIONS" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Jours ouvrés</label>
              <div class="text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center">
                {{ workingDays }} jour(s)
              </div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date de début <span class="text-danger">*</span></label>
              <input type="date" v-model="form.startDate" :class="cls.fieldInput" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date de fin <span class="text-danger">*</span></label>
              <input type="date" v-model="form.endDate" :min="form.startDate" :class="cls.fieldInput" />
            </div>
            <div :class="cls.field" class="col-span-2 max-sm:col-span-1">
              <label :class="cls.fieldLabel">Motif</label>
              <textarea v-model="form.reason" :class="cls.fieldTextarea" rows="3" placeholder="Motif de la demande…"></textarea>
            </div>
          </div>

          <div class="mt-6">
            <button :class="cls.btnOutline" @click="saveDraft">Enregistrer comme brouillon</button>
          </div>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
