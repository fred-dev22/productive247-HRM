<template>
  <ListPageLayout
    :title="t('absence.my_title')"
    :subtitle="auth.user?.name ?? ''"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="t('absence.total', { count: totalCount })"
    :search-placeholder="t('topbar.search_placeholder')"
    scope-label="Demandes :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @open-card="openCard"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="showCreate = true">
        <Plus class="w-4 h-4" /> {{ t('absence.new') }}
      </button>
    </template>

    <!-- Soldes -->
    <template #above-table>
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <div :class="kpiCard" class="border-t-[3px] border-t-primary"><div :class="kpiLabel">{{ t('balances.annual') }}</div><div :class="kpiValue" class="text-primary">12</div><div :class="kpiSub">{{ t('balances.on', { total: 24 }) }}</div></div>
        <div :class="kpiCard" class="border-t-[3px] border-t-success"><div :class="kpiLabel">{{ t('balances.recovery') }}</div><div :class="kpiValue" class="text-success">3</div><div :class="kpiSub">{{ t('balances.acquired') }}</div></div>
        <div :class="kpiCard" class="border-t-[3px] border-t-success"><div :class="kpiLabel">{{ t('balances.sick') }}</div><div :class="kpiValue" class="text-success">8</div><div :class="kpiSub">{{ t('balances.available') }}</div></div>
        <div :class="kpiCard" class="border-t-[3px]" style="border-top-color:#854F0B"><div :class="kpiLabel">{{ t('balances.remote') }}</div><div :class="kpiValue" style="color:#854F0B">5</div><div :class="kpiSub">{{ t('balances.used') }}</div></div>
      </div>
    </template>

    <!-- Actions contextuelles -->
    <template #row-actions="{ item }">
      <AbsenceWorkflowActions :leave="item" />
    </template>

    <!-- Cellules -->
    <template #cell-type="{ item }"><span class="whitespace-nowrap">{{ typeLabel(item.type) }}</span></template>
    <template #cell-dates="{ item }"><span class="whitespace-nowrap text-[11px]">{{ item.startDate }} → {{ item.endDate }}</span></template>
    <template #cell-days="{ item }"><span class="font-medium whitespace-nowrap">{{ item.workingDays }}j</span></template>
    <template #cell-submitted="{ item }"><span class="text-muted-foreground whitespace-nowrap text-[11px]">{{ item.submittedAt }}</span></template>
    <template #cell-status="{ item }"><StatusPill :status="item.status" /></template>

    <!-- Aperçu -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div class="text-sm font-semibold text-foreground">{{ typeLabel(item.type) }}</div>
        <div><StatusPill :status="item.status" /></div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Début</div>{{ item.startDate }}</div>
          <div><div class="text-muted-foreground text-[11px]">Fin</div>{{ item.endDate }}</div>
          <div><div class="text-muted-foreground text-[11px]">Jours ouvrés</div>{{ item.workingDays }}j</div>
          <div><div class="text-muted-foreground text-[11px]">Soumis le</div>{{ item.submittedAt }}</div>
        </div>
        <div v-if="item.reason" class="text-[12px]"><div class="text-muted-foreground text-[11px]">Motif</div>{{ item.reason }}</div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item)">Ouvrir la fiche</button>
        <AbsenceWorkflowActions :leave="item" />
      </div>
    </template>

    <template #empty>
      <CalendarOff class="w-8 h-8" />
      <p class="text-[13px]">{{ t('absence.my_empty') }}</p>
    </template>

    <AbsenceCard v-if="openCardId !== null" :leaves="filtered" :request-id="openCardId" @close="openCardId = null" />
    <AbsenceCreate v-if="showCreate" @close="showCreate = false" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, CalendarOff } from 'lucide-vue-next'
import { StatusPill, ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import AbsenceCard from '../../components/absences/AbsenceCard.vue'
import AbsenceCreate from '../../components/absences/AbsenceCreate.vue'
import AbsenceWorkflowActions from '../../components/absences/AbsenceWorkflowActions.vue'
import * as L from '../../lib/listClasses'
import { useAuthStore } from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import type { LeaveRequest } from '../../types'

const { t } = useI18n()
const auth = useAuthStore()
const absenceStore = useAbsenceStore()

const kpiCard = 'bg-card border border-border rounded-lg px-3.5 py-3'
const kpiLabel = 'text-[13px] text-muted-foreground mb-1'
const kpiValue = 'text-[28px] font-semibold leading-none'
const kpiSub = 'text-xs text-muted-foreground mt-[3px]'

const showCreate = ref(false)
const openCardId = ref<number | null>(null)
function openCard(item: LeaveRequest) { openCardId.value = item.id }

const typeI18nKey: Record<string, string> = {
  'Congé annuel': 'absence.types.annual', 'Congé maladie': 'absence.types.sick',
  'Congé maternité': 'absence.types.maternity', 'Récupération': 'absence.types.recovery',
  'Assistance parentale': 'absence.types.parental', 'Permission exceptionnelle': 'absence.types.exceptional',
  'Télétravail': 'absence.types.remote',
}
function typeLabel(type: string): string { const k = typeI18nKey[type]; return k ? t(k) : type }

const columns = computed<ListColumn[]>(() => [
  { key: 'type', label: t('absence.fields.type'), sortable: true, hideable: false, width: 200 },
  { key: 'dates', label: t('absence.fields.dates'), width: 210 },
  { key: 'days', label: t('absence.fields.days'), align: 'center', width: 90 },
  { key: 'submitted', label: t('absence.fields.submitted'), sortable: true, width: 130 },
  { key: 'status', label: t('absence.fields.status'), width: 130 },
])

const scopeOptions = computed(() => [
  { value: '', label: t('absence.all') },
  { value: 'pending', label: t('absence.status.pending') },
  { value: 'approved', label: t('absence.status.approved') },
  { value: 'rejected', label: t('absence.status.rejected') },
  { value: 'draft', label: t('absence.status.draft') },
])
const activeScope = ref('')

const searchQuery = ref('')
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = ref(10)
watch([activeScope, searchQuery, pageSize], () => { page.value = 1 })

const sortFieldMap: Record<string, keyof LeaveRequest> = { type: 'type', submitted: 'submittedAt' }

const filtered = computed(() => {
  let rows = absenceStore.myLeaves.filter(l => {
    if (activeScope.value && l.status !== activeScope.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!l.type.toLowerCase().includes(q)) return false
    }
    return true
  })
  if (sortKey.value && sortFieldMap[sortKey.value]) {
    const f = sortFieldMap[sortKey.value]!
    rows = [...rows].sort((a, b) => {
      const cmp = String(a[f] ?? '').localeCompare(String(b[f] ?? ''))
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return rows
})

const totalCount = computed(() => filtered.value.length)
const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
</script>
