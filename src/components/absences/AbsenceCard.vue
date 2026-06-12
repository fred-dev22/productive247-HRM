<script setup lang="ts">
/**
 * Fiche d'une demande d'absence (lecture / édition) — sur CardModalShell,
 * pattern frontdesk. Navigateur de N° à gauche, barre d'actions métier, mode
 * lecture par défaut ; édition possible pour les brouillons.
 */
import { ref, computed, watch } from 'vue'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import UserAvatar from '../ui/UserAvatar.vue'
import ValidationTimeline from '../ui/ValidationTimeline.vue'
import AbsenceWorkflowActions from './AbsenceWorkflowActions.vue'
import * as cls from '../../lib/formClasses'
import { useAbsenceStore } from '../../stores/absences'
import type { LeaveRequest, LeaveType } from '../../types'

const props = defineProps<{
  /** Demandes de la liste courante (pour la navigation N°) */
  leaves: LeaveRequest[]
  /** Demande affichée */
  requestId: number
}>()

const emit = defineEmits<{ close: [] }>()

const absenceStore = useAbsenceStore()

const TYPE_LABELS: Record<string, string> = {
  'Congé annuel': 'Congé annuel', 'Congé maladie': 'Congé maladie',
  'Récupération': 'Récupération', 'Télétravail': 'Télétravail',
  'Congé maternité': 'Congé maternité',
}
const TYPE_OPTIONS: LeaveType[] = ['Congé annuel', 'Congé maladie', 'Récupération', 'Télétravail', 'Congé maternité']
function typeLabel(t: string) { return TYPE_LABELS[t] ?? t }
function leaveNo(l: LeaveRequest) { return 'DEM-' + String(l.id).padStart(4, '0') }

const currentId = ref(props.requestId)
watch(() => props.requestId, (v) => { currentId.value = v; isEditMode.value = false })

const current = computed<LeaveRequest | null>(() => props.leaves.find(l => l.id === currentId.value) ?? null)
const currentIndex = computed(() => props.leaves.findIndex(l => l.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.leaves.length - 1)

const sidebarItems = computed(() => props.leaves.map(l => ({ no: leaveNo(l), label: `${l.employeeName} · ${typeLabel(l.type)}` })))
const currentNo = computed(() => (current.value ? leaveNo(current.value) : null))

function goPrev() { if (hasPrev.value) { currentId.value = props.leaves[currentIndex.value - 1]!.id; isEditMode.value = false } }
function goNext() { if (hasNext.value) { currentId.value = props.leaves[currentIndex.value + 1]!.id; isEditMode.value = false } }
function selectSidebar(no: string) {
  const l = props.leaves.find(x => leaveNo(x) === no)
  if (l) { currentId.value = l.id; isEditMode.value = false }
}

/* ── Mode édition (brouillons uniquement) ───────────────────── */
const isEditMode = ref(false)
const canEdit = computed(() => current.value?.status === 'draft')
const form = ref({ type: '' as LeaveType | '', startDate: '', endDate: '', reason: '' })

function enterEdit() {
  if (!current.value) return
  form.value = {
    type: current.value.type,
    startDate: current.value.startDate,
    endDate: current.value.endDate,
    reason: current.value.reason ?? '',
  }
  isEditMode.value = true
}
function cancelEdit() { isEditMode.value = false }
function save() {
  if (!current.value || !form.value.type) return
  absenceStore.updateLeave(current.value.id, {
    type: form.value.type,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    reason: form.value.reason,
  })
  isEditMode.value = false
}

const pageTitle = computed(() => (current.value ? `${leaveNo(current.value)} · ${current.value.employeeName}` : ''))
const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="pageTitle"
    :page-number="leaveNo(current)"
    banner-label="Fiche demande d'absence"
    :is-edit-mode="isEditMode"
    :show-edit="canEdit"
    :show-title-new-button="false"
    :sidebar-items="sidebarItems"
    :current-no="currentNo"
    :has-prev="hasPrev"
    :has-next="hasNext"
    :has-unsaved-changes="isEditMode"
    @close="emit('close')"
    @enter-edit="enterEdit"
    @cancel-edit="cancelEdit"
    @save="save"
    @go-prev="goPrev"
    @go-next="goNext"
    @select-sidebar="selectSidebar"
  >
    <template #title-badges>
      <StatusPill :status="current.status" />
    </template>

    <!-- Barre d'actions métier (mode lecture) -->
    <template v-if="!isEditMode" #action-buttons>
      <AbsenceWorkflowActions :leave="current" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Section Général -->
        <div class="flex items-center border-b-2 border-primary pb-2 mb-5">
          <h2 class="text-base font-bold text-foreground">Général</h2>
        </div>

        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
          <!-- Employé -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Employé</label>
            <div class="flex items-center gap-2 h-[38px]">
              <UserAvatar :name="current.employeeName" size="sm" />
              <span class="text-[13px] font-medium text-foreground">{{ current.employeeName }}</span>
            </div>
          </div>

          <!-- Type -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Type d'absence</label>
            <select v-if="isEditMode" v-model="form.type" :class="cls.fieldSelect">
              <option v-for="t in TYPE_OPTIONS" :key="t" :value="t">{{ typeLabel(t) }}</option>
            </select>
            <div v-else :class="readBox">{{ typeLabel(current.type) }}</div>
          </div>

          <!-- Date début -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Date de début</label>
            <input v-if="isEditMode" type="date" v-model="form.startDate" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.startDate }}</div>
          </div>

          <!-- Date fin -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Date de fin</label>
            <input v-if="isEditMode" type="date" v-model="form.endDate" :min="form.startDate" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.endDate }}</div>
          </div>

          <!-- Jours ouvrés -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Jours ouvrés</label>
            <div :class="readBox">{{ current.workingDays }} jour(s)</div>
          </div>

          <!-- Soumis le -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Soumis le</label>
            <div :class="readBox">{{ current.submittedAt }}</div>
          </div>

          <!-- Motif -->
          <div :class="cls.field" class="col-span-2 max-sm:col-span-1">
            <label :class="cls.fieldLabel">Motif</label>
            <textarea v-if="isEditMode" v-model="form.reason" :class="cls.fieldTextarea" rows="3" placeholder="Motif de la demande…"></textarea>
            <div v-else :class="[readBox, 'min-h-[38px] h-auto py-2']">{{ current.reason || '—' }}</div>
          </div>

          <!-- Motif de refus -->
          <div v-if="current.rejectionReason" :class="cls.field" class="col-span-2 max-sm:col-span-1">
            <label :class="cls.fieldLabel">Motif du refus</label>
            <div class="text-[13px] text-danger bg-danger-bg border border-danger/20 rounded-md px-2.5 py-2">{{ current.rejectionReason }}</div>
          </div>
        </div>

        <!-- Historique de validation -->
        <div v-if="current.validationHistory?.length" class="mt-7">
          <div class="flex items-center border-b-2 border-primary pb-2 mb-4">
            <h2 class="text-base font-bold text-foreground">Historique de validation</h2>
          </div>
          <ValidationTimeline :history="current.validationHistory" />
        </div>
      </div>
    </template>
  </CardModalShell>
</template>
