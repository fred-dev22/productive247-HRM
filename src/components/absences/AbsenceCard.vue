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
import FormSection from '../ui/form-field/FormSection.vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import AbsenceWorkflowActions from './AbsenceWorkflowActions.vue'
import * as cls from '../../lib/formClasses'
import { formatDate } from '../../lib/date'
import { useLeaveRequestStore } from '../../stores/leaveRequests'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import type { LeaveRequest } from '../../types'

const props = defineProps<{
  /** Demandes de la liste courante (pour la navigation N°) */
  leaves: LeaveRequest[]
  /** Demande affichée */
  requestId: string
}>()

const emit = defineEmits<{ close: [] }>()

const store = useLeaveRequestStore()
const leaveTypesStore = useLeaveTypesStore()
if (leaveTypesStore.leaveTypes.length === 0) leaveTypesStore.fetchAll()

function leaveNo(l: LeaveRequest) { return l.referenceCode }

const currentId = ref(props.requestId)
watch(() => props.requestId, (v) => { currentId.value = v; isEditMode.value = false })

const current = computed<LeaveRequest | null>(() => props.leaves.find(l => l.id === currentId.value) ?? null)
const currentIndex = computed(() => props.leaves.findIndex(l => l.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.leaves.length - 1)

const sidebarItems = computed(() => props.leaves.map(l => ({ no: leaveNo(l), label: `${l.employeeName} · ${l.leaveTypeName}` })))
const currentNo = computed(() => (current.value ? leaveNo(current.value) : null))

// La liste passée en prop (mine/team/all) ne porte pas l'historique de
// validation — seul le détail (GET /leave-requests/:id) l'inclut.
const validationHistory = ref<LeaveRequest['validationHistory']>(undefined)
watch(currentId, async (id) => {
  validationHistory.value = undefined
  if (!id) return
  try {
    const detail = await store.fetchOne(id)
    validationHistory.value = detail.validationHistory
  } catch {
    // silencieux : l'historique est une amélioration, pas bloquant pour la fiche
  }
}, { immediate: true })

function goPrev() { if (hasPrev.value) { currentId.value = props.leaves[currentIndex.value - 1]!.id; isEditMode.value = false } }
function goNext() { if (hasNext.value) { currentId.value = props.leaves[currentIndex.value + 1]!.id; isEditMode.value = false } }
function selectSidebar(no: string) {
  const l = props.leaves.find(x => leaveNo(x) === no)
  if (l) { currentId.value = l.id; isEditMode.value = false }
}

/* ── Mode édition (brouillons uniquement) ───────────────────── */
const isEditMode = ref(false)
const canEdit = computed(() => current.value?.status === 'Draft' || current.value?.status === 'Returned')
const form = ref({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })
const saveError = ref('')

const leaveTypeItems = computed(() => leaveTypesStore.activeTypes.map(lt => ({ id: lt.id, label: lt.name })))

function enterEdit() {
  if (!current.value) return
  form.value = {
    leaveTypeId: current.value.leaveTypeId,
    startDate: current.value.startDate,
    endDate: current.value.endDate,
    reason: current.value.reason ?? '',
  }
  isEditMode.value = true
}
function cancelEdit() { isEditMode.value = false }
async function save() {
  if (!current.value || !form.value.leaveTypeId) return
  try {
    await store.update(current.value.id, {
      leaveTypeId: form.value.leaveTypeId,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      reason: form.value.reason,
    })
    isEditMode.value = false
  } catch {
    saveError.value = store.error ?? "La mise à jour a échoué."
  }
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
      <AbsenceWorkflowActions :leave="current" @deleted="emit('close')" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Section Général -->
        <FormSection title="Général" :recaps="[current.employeeName, current.leaveTypeName, `${current.daysCount}j`]">
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
            <SearchableDropdown
              v-if="isEditMode"
              :items="leaveTypeItems"
              :model-value="form.leaveTypeId"
              :show-avatar="false"
              @update:model-value="form.leaveTypeId = String($event)"
            />
            <div v-else :class="readBox">{{ current.leaveTypeName }}</div>
          </div>

          <!-- Date début -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Date de début</label>
            <input v-if="isEditMode" type="date" v-model="form.startDate" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ formatDate(current.startDate) }}</div>
          </div>

          <!-- Date fin -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Date de fin</label>
            <input v-if="isEditMode" type="date" v-model="form.endDate" :min="form.startDate" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ formatDate(current.endDate) }}</div>
          </div>

          <!-- Jours ouvrés -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Jours ouvrés</label>
            <div :class="readBox">{{ current.daysCount }} jour(s)</div>
          </div>

          <!-- Référence -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Référence</label>
            <div :class="readBox">{{ current.referenceCode }}</div>
          </div>

          <!-- Intérimaire -->
          <div v-if="current.interimEmployeeName" :class="cls.field">
            <label :class="cls.fieldLabel">Intérimaire</label>
            <div :class="readBox">{{ current.interimEmployeeName }}</div>
          </div>

          <!-- Motif -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Motif</label>
            <textarea v-if="isEditMode" v-model="form.reason" :class="cls.fieldTextarea" rows="3" placeholder="Motif de la demande…"></textarea>
            <div v-else :class="[readBox, 'min-h-[38px] h-auto py-2']">{{ current.reason || '—' }}</div>
          </div>

          <!-- Motif de refus / retour -->
          <div v-if="current.rejectionReason" :class="cls.field">
            <label :class="cls.fieldLabel">{{ current.status === 'Returned' ? 'Commentaire de retour' : 'Motif du refus' }}</label>
            <div class="text-[13px] text-danger bg-danger-bg border border-danger/20 rounded-md px-2.5 py-2">{{ current.rejectionReason }}</div>
          </div>
        </div>
        <div v-if="saveError" class="text-xs text-danger bg-danger-bg px-3 py-2 rounded-md mt-3">{{ saveError }}</div>
        </FormSection>

        <!-- Historique de validation -->
        <FormSection v-if="validationHistory?.length" title="Historique de validation">
          <ValidationTimeline :history="validationHistory" />
        </FormSection>
      </div>
    </template>
  </CardModalShell>
</template>
