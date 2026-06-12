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
    @open-card="openCard"
  >
    <!-- Bouton "Nouvelle demande" -->
    <template #header-actions>
      <button :class="L.btnPrimary" @click="showCreate = true">
        <Plus class="w-4 h-4" /> {{ t('dashboard.new_request') }}
      </button>
    </template>

    <!-- Actions contextuelles (ligne sélectionnée) -->
    <template #row-actions="{ item }">
      <AbsenceWorkflowActions v-if="isActionable(item)" :leave="item" />
      <button v-else :class="quickBtn" @click="openCard(item)">Ouvrir la fiche</button>
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

    <!-- Aperçu rapide -->
    <template #details-panel="{ item: r }">
      <div class="flex flex-col gap-3.5">
        <div class="flex items-center gap-2.5">
          <UserAvatar :name="r.employeeName" size="md" />
          <div class="min-w-0">
            <div class="text-sm font-semibold text-foreground truncate">{{ r.employeeName }}</div>
            <div class="text-[11px] text-muted-foreground">{{ typeLabel(r.type) }}</div>
          </div>
        </div>
        <div><StatusPill :status="r.status" /></div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Début</div>{{ r.startDate }}</div>
          <div><div class="text-muted-foreground text-[11px]">Fin</div>{{ r.endDate }}</div>
          <div><div class="text-muted-foreground text-[11px]">Jours ouvrés</div>{{ r.workingDays }}j</div>
          <div><div class="text-muted-foreground text-[11px]">Soumis le</div>{{ r.submittedAt }}</div>
        </div>
        <div v-if="r.reason" class="text-[12px]">
          <div class="text-muted-foreground text-[11px]">Motif</div>{{ r.reason }}
        </div>
        <div v-if="r.rejectionReason" class="text-[12px] text-danger">
          <div class="text-[11px] font-medium">Motif du refus</div>{{ r.rejectionReason }}
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(r)">Ouvrir la fiche</button>
        <AbsenceWorkflowActions v-if="isActionable(r)" :leave="r" />
      </div>
    </template>

    <!-- État vide -->
    <template #empty>
      <CalendarOff class="w-8 h-8" />
      <p class="text-[13px]">{{ t('absence.empty') }}</p>
    </template>

    <!-- Fiche (double-clic) + création -->
    <AbsenceCard v-if="openCardId !== null" :leaves="filtered" :request-id="openCardId" @close="openCardId = null" />
    <AbsenceCreate v-if="showCreate" @close="showCreate = false" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, CalendarOff } from 'lucide-vue-next'
import { StatusPill, UserAvatar, ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import AbsenceCard from '../../components/absences/AbsenceCard.vue'
import AbsenceCreate from '../../components/absences/AbsenceCreate.vue'
import AbsenceWorkflowActions from '../../components/absences/AbsenceWorkflowActions.vue'
import * as L from '../../lib/listClasses'
import { useAbsenceStore } from '../../stores/absences'
import type { LeaveRequest } from '../../types'

const absenceStore = useAbsenceStore()
const { t }        = useI18n()

const showCreate = ref(false)
const openCardId = ref<number | null>(null)
function openCard(item: LeaveRequest) { openCardId.value = item.id }

const quickBtn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer bg-background text-muted-foreground hover:text-foreground'
const ACTIONABLE = new Set(['pending', 'draft', 'returned', 'registered', 'done'])
function isActionable(r: LeaveRequest) { return ACTIONABLE.has(r.status) }

/* ── Colonnes (sans colonne Actions) ────────────────────────── */
const columns = computed<ListColumn[]>(() => [
  { key: 'employee',  label: t('absence.fields.employee'),  sortable: true, hideable: false, width: 230 },
  { key: 'type',      label: t('absence.fields.type'),      sortable: true, width: 160 },
  { key: 'dates',     label: t('absence.fields.dates'),     width: 210 },
  { key: 'days',      label: t('absence.fields.days'),      sortable: true, width: 90 },
  { key: 'submitted', label: t('absence.fields.submitted'), sortable: true, width: 140 },
  { key: 'status',    label: t('absence.fields.status'),    sortable: true, width: 140 },
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
const sortFieldMap: Record<string, string> = { employee: 'employeeName', days: 'workingDays', submitted: 'submittedAt' }

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
</script>
