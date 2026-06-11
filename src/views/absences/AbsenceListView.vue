<template>
  <ListPageLayout
    :title="t('absence.title')"
    :subtitle="`${t('absence.total', { count: totalCount })} · ${pendingCount} ${t('dashboard.pending').toLowerCase()}`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="t('absence.total', { count: totalCount })"
    :search-placeholder="t('topbar.search_placeholder')"
    :scope-label="t('absence.scope_label')"
    :scope-options="filterPresets"
    v-model:scope="activePreset"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
  >
    <!-- Bouton "Nouvelle demande" (en-tête + toolbar) -->
    <template #header-actions>
      <button :class="L.btnPrimary" @click="showNewModal = true">
        <Plus class="w-4 h-4" /> {{ t('dashboard.new_request') }}
      </button>
    </template>
    <template #toolbar-actions>
      <button :class="L.btnPrimary" @click="showNewModal = true">
        <Plus class="w-4 h-4" /> {{ t('dashboard.new_request') }}
      </button>
    </template>

    <!-- Panneau de filtres -->
    <template #filters>
      <div class="flex flex-col gap-px">
        <div
          v-for="p in filterPresets" :key="p.value"
          class="text-[13px] text-foreground px-2 py-1.5 rounded-md cursor-pointer hover:bg-background"
          :class="{ '!text-primary font-medium bg-primary/10': activePreset === p.value }"
          @click="activePreset = p.value"
        >{{ p.label }}</div>
      </div>
      <div class="text-[11px] text-muted-foreground font-medium mt-1">{{ t('absence.filters.filter_by') }}</div>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">{{ t('absence.fields.type') }}</label>
        <select v-model="filterType" :class="L.fpSelect">
          <option value="">{{ t('absence.filters.all_types') }}</option>
          <option value="Congé annuel">{{ t('absence.types.annual') }}</option>
          <option value="Congé maladie">{{ t('absence.types.sick') }}</option>
          <option value="Récupération">{{ t('absence.types.recovery') }}</option>
          <option value="Télétravail">{{ t('absence.types.remote') }}</option>
          <option value="Congé maternité">{{ t('absence.types.maternity') }}</option>
        </select>
      </div>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">{{ t('absence.filters.from') }}</label>
        <input type="date" v-model="filterFrom" :class="L.fpSelect" />
      </div>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">{{ t('absence.filters.to') }}</label>
        <input type="date" v-model="filterTo" :class="L.fpSelect" :min="filterFrom" />
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">
        {{ t('absence.actions.reset_filters') }}
      </button>
    </template>

    <!-- Cellules -->
    <template #cell-employee="{ item: r }">
      <div class="flex items-center gap-2">
        <UserAvatar :name="r.employeeName" size="sm" />
        <span class="font-medium whitespace-nowrap">{{ r.employeeName }}</span>
      </div>
    </template>
    <template #cell-type="{ item: r }">
      <span class="text-muted-foreground whitespace-nowrap">{{ typeLabel(r.type) }}</span>
    </template>
    <template #cell-dates="{ item: r }">
      <span class="whitespace-nowrap text-[11px]">{{ r.startDate }} → {{ r.endDate }}</span>
    </template>
    <template #cell-days="{ item: r }">
      <span class="font-medium whitespace-nowrap">{{ r.workingDays }}j</span>
    </template>
    <template #cell-submitted="{ item: r }">
      <span class="text-muted-foreground whitespace-nowrap text-[11px]">{{ r.submittedAt }}</span>
    </template>
    <template #cell-status="{ item: r }">
      <StatusPill :status="r.status" />
    </template>
    <template #cell-actions="{ item: r, toggleDetail, isExpanded }">
      <div v-if="r.status === 'pending'" class="flex gap-1">
        <button :class="L.actApprove" @click="handleApprove(r.id)">{{ t('absence.actions.approve') }}</button>
        <button :class="L.actReturn"  @click="openReturnModal(r)"><Undo2 class="w-3.5 h-3.5" /> Retourner</button>
        <button :class="L.actReject"  @click="openRejectModal(r)">{{ t('absence.actions.reject') }}</button>
      </div>
      <div v-else-if="r.status === 'registered'" class="flex gap-1">
        <button :class="L.actApprove" @click="absenceStore.markDone(r.id)">Marquer Effectué</button>
        <button :class="L.actView" @click="toggleDetail()">{{ isExpanded ? '↑' : 'Voir' }}</button>
      </div>
      <div v-else-if="r.status === 'done'" class="flex gap-1">
        <button :class="L.actApprove" @click="absenceStore.markRegularized(r.id)">Régulariser</button>
        <button :class="L.actView" @click="toggleDetail()">{{ isExpanded ? '↑' : 'Voir' }}</button>
      </div>
      <button v-else :class="L.actView" @click="toggleDetail()">
        {{ isExpanded ? '↑ Fermer' : t('absence.actions.view') }}
      </button>
    </template>

    <!-- Détail extensible -->
    <template #row-detail="{ item: r }">
      <div class="bg-background border-t border-border p-4 flex flex-col gap-2.5">
        <div class="flex gap-4 text-[11px] text-muted-foreground">
          <span>{{ t('absence.fields.start_date') }} : {{ r.startDate }}</span>
          <span>{{ t('absence.fields.end_date') }} : {{ r.endDate }}</span>
          <span>{{ t('absence.fields.working_days', { count: r.workingDays }) }}</span>
        </div>
        <div v-if="r.reason" class="text-[13px]"><span class="font-medium text-[11px]">{{ t('absence.fields.reason') }} :</span> {{ r.reason }}</div>
        <div v-if="r.rejectionReason" class="flex items-center gap-1.5 text-danger text-xs">
          <CircleAlert class="w-3.5 h-3.5" />
          <span class="font-medium text-[11px]">{{ t('absence.fields.rejection_reason') }} :</span> {{ r.rejectionReason }}
        </div>
        <div v-if="r.validationHistory?.length" class="mt-1">
          <div class="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.06em] mb-2.5">Historique de validation</div>
          <ValidationTimeline :history="r.validationHistory" />
        </div>
      </div>
    </template>

    <!-- État vide -->
    <template #empty>
      <CalendarOff class="w-8 h-8" />
      <p class="text-[13px]">{{ t('absence.empty') }}</p>
    </template>

    <!-- Modales -->
    <ModalShell :open="returnModal.open" :title="`Retourner la demande de ${returnModal.employeeName}`" max-width="max-w-[420px]" @close="closeReturnModal">
      <label :class="cls.fieldLabel">Commentaire *</label>
      <textarea v-model="returnModal.comment" :class="cls.fieldTextarea" placeholder="Expliquez ce qui doit être corrigé..." rows="4"></textarea>
      <div v-if="returnModal.error" :class="cls.fieldError">{{ returnModal.error }}</div>
      <template #footer>
        <button :class="cls.btnPrimary" @click="confirmReturn"><Undo2 class="w-4 h-4" /> Retourner</button>
        <button :class="cls.btnOutline" @click="closeReturnModal">{{ t('absence.actions.cancel') }}</button>
      </template>
    </ModalShell>

    <ModalShell :open="rejectModal.open" :title="t('absence.reject_modal.title', { name: rejectModal.employeeName })" max-width="max-w-[420px]" @close="closeRejectModal">
      <label :class="cls.fieldLabel">{{ t('absence.reject_modal.label') }}</label>
      <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" :placeholder="t('absence.reject_modal.placeholder')" rows="4"></textarea>
      <div v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</div>
      <template #footer>
        <button :class="cls.btnPrimary" @click="confirmReject">{{ t('absence.actions.confirm_reject') }}</button>
        <button :class="cls.btnOutline" @click="closeRejectModal">{{ t('absence.actions.cancel') }}</button>
      </template>
    </ModalShell>

    <AbsenceRequestModal v-model="showNewModal" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Undo2, CircleAlert, CalendarOff } from 'lucide-vue-next'
import { StatusPill, UserAvatar, ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ValidationTimeline from '../../components/ui/ValidationTimeline.vue'
import AbsenceRequestModal from '../../components/AbsenceRequestModal.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useAbsenceStore } from '../../stores/absences'
import type { LeaveRequest } from '../../types'

const absenceStore = useAbsenceStore()
const { t }        = useI18n()

const showNewModal = ref(false)

/* ── Colonnes ───────────────────────────────────────────────── */
const columns = computed<ListColumn[]>(() => [
  { key: 'employee',  label: t('absence.fields.employee'),  sortable: true, hideable: false, width: 220 },
  { key: 'type',      label: t('absence.fields.type'),      sortable: true, width: 150 },
  { key: 'dates',     label: t('absence.fields.dates'),     width: 200 },
  { key: 'days',      label: t('absence.fields.days'),      sortable: true, width: 90 },
  { key: 'submitted', label: t('absence.fields.submitted'), sortable: true, width: 130 },
  { key: 'status',    label: t('absence.fields.status'),    sortable: true, width: 130 },
  { key: 'actions',   label: t('absence.fields.actions'),   pinnable: false, width: 260 },
])

const typeI18nKey: Record<string, string> = {
  'Congé annuel': 'absence.types.annual', 'Congé maladie': 'absence.types.sick',
  'Récupération': 'absence.types.recovery', 'Télétravail': 'absence.types.remote',
  'Congé maternité': 'absence.types.maternity',
}
function typeLabel(type: string): string {
  const key = typeI18nKey[type]; return key ? t(key) : type
}

/* ── Tri ────────────────────────────────────────────────────── */
const searchQuery = ref('')
const sortKey = ref(''); const sortDir = ref<'asc' | 'desc'>('asc')
const sortFieldMap: Record<string, string> = {
  employee: 'employeeName', days: 'workingDays', submitted: 'submittedAt',
}

/* ── Filtres ────────────────────────────────────────────────── */
const filterPresets = computed(() => [
  { label: t('absence.all'), value: '' },
  { label: t('absence.status.pending'),  value: 'pending' },
  { label: t('absence.status.approved'), value: 'approved' },
  { label: t('absence.status.rejected'), value: 'rejected' },
  { label: t('absence.status.draft'),    value: 'draft' },
])
const activePreset = ref('')

const filterStatus = ref(''); const filterType = ref(''); const filterFrom = ref(''); const filterTo = ref('')
const page = ref(1); const pageSize = ref(10)

// La portée (dropdown + presets du panneau) pilote le filtre de statut
watch(activePreset, (v) => { filterStatus.value = v; page.value = 1 })

function resetFilters() {
  filterStatus.value = ''; filterType.value = ''; filterFrom.value = ''; filterTo.value = ''
  searchQuery.value = ''; activePreset.value = ''; page.value = 1
}

/* ── Données ────────────────────────────────────────────────── */
const filtered = computed(() => {
  let list = absenceStore.allLeaves.filter(l => {
    if (filterStatus.value && l.status !== filterStatus.value) return false
    if (filterType.value   && l.type   !== filterType.value)   return false
    if (filterFrom.value   && l.startDate < filterFrom.value)  return false
    if (filterTo.value     && l.endDate   > filterTo.value)    return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!l.employeeName.toLowerCase().includes(q) && !l.type.toLowerCase().includes(q)) return false
    }
    return true
  })
  if (sortKey.value) {
    const field = sortFieldMap[sortKey.value] ?? sortKey.value
    list = [...list].sort((a, b) => {
      const va = (a as any)[field] ?? ''; const vb = (b as any)[field] ?? ''
      const cmp = String(va).localeCompare(String(vb))
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return list
})

const totalCount   = computed(() => filtered.value.length)
const pendingCount = computed(() => filtered.value.filter(l => l.status === 'pending').length)
const pageItems    = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

/* ── Actions ────────────────────────────────────────────────── */
function handleApprove(id: number) { absenceStore.approveLeave(id) }

const returnModal = reactive({ open: false, id: 0, employeeName: '', comment: '', error: '' })
function openReturnModal(r: LeaveRequest) {
  Object.assign(returnModal, { open: true, id: r.id, employeeName: r.employeeName, comment: '', error: '' })
}
function closeReturnModal() { returnModal.open = false }
function confirmReturn() {
  if (!returnModal.comment.trim() || returnModal.comment.trim().length < 10) {
    returnModal.error = 'Le commentaire doit comporter au moins 10 caractères'; return
  }
  absenceStore.returnLeave(returnModal.id, returnModal.comment.trim())
  closeReturnModal()
}

const rejectModal = reactive({ open: false, id: 0, employeeName: '', reason: '', error: '' })
function openRejectModal(r: LeaveRequest) {
  Object.assign(rejectModal, { open: true, id: r.id, employeeName: r.employeeName, reason: '', error: '' })
}
function closeRejectModal() { rejectModal.open = false }
function confirmReject() {
  if (!rejectModal.reason.trim())            { rejectModal.error = t('absence.reject_modal.error_empty'); return }
  if (rejectModal.reason.trim().length < 10) { rejectModal.error = t('absence.reject_modal.error_short'); return }
  absenceStore.rejectLeave(rejectModal.id, rejectModal.reason.trim())
  closeRejectModal()
}
</script>
