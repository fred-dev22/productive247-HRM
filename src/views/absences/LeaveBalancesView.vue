<template>
  <ListPageLayout
    title="Soldes de congés"
    subtitle="Vue d'ensemble des soldes par employé et par type"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} employé(s)`"
    row-key="employeeId"
    search-placeholder="Rechercher un employé…"
    :loading="balanceStore.loading"
    v-model:search-query="search"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
  >
    <!-- Export -->
    <template #header-actions>
      <button :class="L.btnOutline" @click="() => {}"><FileDown class="w-4 h-4" /> Exporter</button>
    </template>

    <!-- KPIs -->
    <template #above-table>
      <div class="grid grid-cols-4 gap-3 mb-4 max-[1100px]:grid-cols-2 max-md:grid-cols-2">
        <div :class="kpiCard"><div :class="kpiIcon" class="bg-success-bg"><Users class="w-[18px] h-[18px] text-success" /></div><div><div :class="kpiVal">{{ balanceStore.allBalances.length }}</div><div :class="kpiLabel">Employés suivis</div></div></div>
        <div v-for="(c, i) in kpiTypeCols" :key="c.leaveTypeId" :class="kpiCard">
          <div :class="kpiIcon" :class="KPI_STYLES[i].bg"><component :is="KPI_STYLES[i].icon" class="w-[18px] h-[18px]" :class="KPI_STYLES[i].text" /></div>
          <div><div :class="kpiVal">{{ totalForType(c.leaveTypeId) }}j</div><div :class="kpiLabel">{{ c.leaveTypeName }} restants</div></div>
        </div>
      </div>
    </template>

    <!-- Filtres -->
    <template #filters>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Entité</label>
        <select v-model="filterEntity" :class="L.fpSelect">
          <option value="">Toutes les entités</option>
          <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.name">{{ e.name }}</option>
        </select>
      </div>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Type de congé</label>
        <select v-model="filterType" :class="L.fpSelect">
          <option value="">Tous les types</option>
          <option v-for="c in TYPE_COLS" :key="c.leaveTypeId" :value="c.leaveTypeId">{{ c.leaveTypeName }}</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">Réinitialiser les filtres</button>
    </template>

    <!-- Cellule employé -->
    <template #cell-employee="{ item }">
      <div class="flex items-center gap-2">
        <UserAvatar :name="item.employeeName" size="sm" />
        <div>
          <div class="text-[13px] font-medium text-foreground whitespace-nowrap">{{ item.employeeName }}</div>
          <div class="text-[11px] text-muted-foreground whitespace-nowrap">{{ item.entityName }}</div>
        </div>
      </div>
    </template>

    <!-- Cellules par type (slots dynamiques) -->
    <template v-for="c in TYPE_COLS" :key="c.leaveTypeId" #[cellSlot(c.leaveTypeId)]="{ item }">
      <template v-if="cellFor(item, c.leaveTypeId) && cellFor(item, c.leaveTypeId)!.daysPerYear > 0">
        <div class="text-sm font-semibold text-foreground mb-1">{{ cellFor(item, c.leaveTypeId)!.balance }}j</div>
        <div class="h-1 bg-border rounded-sm overflow-hidden mb-[3px]"><div class="h-full rounded-sm" :style="barStyle(cellFor(item, c.leaveTypeId)!)"></div></div>
        <div class="text-[10px] text-muted-foreground">{{ cellFor(item, c.leaveTypeId)!.balance }}j / {{ cellFor(item, c.leaveTypeId)!.daysPerYear }}j</div>
      </template>
      <span v-else class="text-[13px] text-muted-foreground">—</span>
    </template>

    <!-- Aperçu rapide -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div class="flex items-center gap-2.5">
          <UserAvatar :name="item.employeeName" size="md" />
          <div class="min-w-0">
            <div class="text-sm font-semibold text-foreground truncate">{{ item.employeeName }}</div>
            <div class="text-[11px] text-muted-foreground">{{ item.entityName }}</div>
          </div>
        </div>
        <div v-for="c in TYPE_COLS" :key="c.leaveTypeId" class="text-[12px]">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{{ c.leaveTypeName }}</span>
            <span class="font-semibold text-foreground">{{ cellFor(item, c.leaveTypeId)?.balance ?? 0 }}j / {{ cellFor(item, c.leaveTypeId)?.daysPerYear ?? 0 }}j</span>
          </div>
          <div v-if="cellFor(item, c.leaveTypeId) && cellFor(item, c.leaveTypeId)!.daysPerYear > 0" class="h-1 bg-border rounded-sm overflow-hidden mt-1"><div class="h-full rounded-sm" :style="barStyle(cellFor(item, c.leaveTypeId)!)"></div></div>
        </div>
      </div>
    </template>

    <template #empty>
      <Users class="w-8 h-8" />
      <p class="text-[13px]">Aucun résultat</p>
    </template>
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { FileDown, Users, Sun, RefreshCw, Home } from 'lucide-vue-next'
import { UserAvatar, ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import * as L from '../../lib/listClasses'
import { useLeaveTransactionStore } from '../../stores/leaveTransactions'
import type { EmployeeLeaveBalances } from '../../stores/leaveTransactions'
import { useEntityStore }  from '../../stores/entities'
import type { LeaveBalance } from '../../types'

const balanceStore = useLeaveTransactionStore()
const entityStore  = useEntityStore()

onMounted(() => {
  balanceStore.fetchAllBalances()
  if (entityStore.entities.length === 0) entityStore.fetchAll()
})

const kpiCard = 'bg-card border border-border rounded-[10px] p-3.5 flex items-center gap-3'
const kpiIcon = 'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold text-foreground leading-none'
const kpiLabel = 'text-[11px] text-muted-foreground mt-0.5'

// Colonnes dérivées des types de congé réellement présents dans les soldes
// (tous les types actifs, chaque employé porte la même liste).
const TYPE_COLS = computed(() => balanceStore.allBalances[0]?.balances ?? [])

// Les 3 cartes KPI reprennent les 3 premiers types réels (par leaveTypeId,
// jamais par code) — un code fixe ('ANNUAL'/'RECOVERY'/'REMOTE') ne
// correspond a rien puisque le code d'un type de conge est libre (choisi par
// le RH a la creation, y compris depuis l'onboarding).
const KPI_STYLES = [
  { icon: Sun,       bg: 'bg-primary/10', text: 'text-primary' },
  { icon: RefreshCw, bg: 'bg-warning-bg', text: 'text-warning' },
  { icon: Home,      bg: 'bg-info-bg',    text: 'text-info' },
]
const kpiTypeCols = computed(() => TYPE_COLS.value.slice(0, 3))

function cellSlot(leaveTypeId: string) { return `cell-${leaveTypeId}` }
function cellFor(item: EmployeeLeaveBalances, leaveTypeId: string): LeaveBalance | undefined {
  return item.balances.find(b => b.leaveTypeId === leaveTypeId)
}
function totalForType(leaveTypeId: string): number {
  return balanceStore.allBalances.reduce((sum, e) => sum + (e.balances.find(b => b.leaveTypeId === leaveTypeId)?.balance ?? 0), 0)
}

const search       = ref('')
const filterEntity = ref('')
const filterType   = ref('')
const page         = ref(1)
const pageSize     = ref(10)

watch([search, filterEntity, filterType, pageSize], () => { page.value = 1 })
function resetFilters() { search.value = ''; filterEntity.value = ''; filterType.value = ''; page.value = 1 }

const columns = computed<ListColumn[]>(() => {
  const cols = filterType.value ? TYPE_COLS.value.filter(c => c.leaveTypeId === filterType.value) : TYPE_COLS.value
  return [
    { key: 'employee', label: 'Employé', hideable: false, width: 230 },
    ...cols.map(c => ({ key: c.leaveTypeId, label: c.leaveTypeName, align: 'center' as const, width: 130 })),
  ]
})

const filteredBalances = computed(() => {
  let list = balanceStore.allBalances
  if (filterEntity.value) list = list.filter(r => r.entityName === filterEntity.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r => r.employeeName.toLowerCase().includes(q))
  }
  return list
})

const totalCount = computed(() => filteredBalances.value.length)
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredBalances.value.slice(start, start + pageSize.value)
})

function barStyle(b: LeaveBalance) {
  if (!b || b.daysPerYear === 0) return {}
  const remainRatio = b.balance / b.daysPerYear
  const usedPct = Math.max(0, Math.min(100, (1 - remainRatio) * 100))
  const color   = remainRatio > 0.5 ? 'var(--color-success)' : remainRatio > 0.2 ? 'var(--color-warning)' : 'var(--color-danger)'
  return { width: `${usedPct}%`, background: color }
}
</script>
