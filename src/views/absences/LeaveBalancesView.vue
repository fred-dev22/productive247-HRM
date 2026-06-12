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
        <div :class="kpiCard"><div :class="kpiIcon" class="bg-success-bg"><Users class="w-[18px] h-[18px] text-success" /></div><div><div :class="kpiVal">{{ absenceStore.employeeBalances.length }}</div><div :class="kpiLabel">Employés suivis</div></div></div>
        <div :class="kpiCard"><div :class="kpiIcon" class="bg-primary/10"><Sun class="w-[18px] h-[18px] text-primary" /></div><div><div :class="kpiVal">{{ totals['Congé annuel']?.remaining ?? 0 }}j</div><div :class="kpiLabel">Congés annuels restants</div></div></div>
        <div :class="kpiCard"><div :class="kpiIcon" class="bg-warning-bg"><RefreshCw class="w-[18px] h-[18px] text-warning" /></div><div><div :class="kpiVal">{{ totals['Récupération']?.remaining ?? 0 }}j</div><div :class="kpiLabel">Récupérations restantes</div></div></div>
        <div :class="kpiCard"><div :class="kpiIcon" class="bg-info-bg"><Home class="w-[18px] h-[18px] text-info" /></div><div><div :class="kpiVal">{{ totals['Télétravail']?.remaining ?? 0 }}j</div><div :class="kpiLabel">Télétravail restants</div></div></div>
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
          <option v-for="c in TYPE_COLS" :key="c.type" :value="c.type">{{ c.label }}</option>
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
    <template v-for="c in TYPE_COLS" :key="c.key" #[cellSlot(c.key)]="{ item }">
      <template v-if="item.balances[c.type] && item.balances[c.type].total > 0">
        <div class="text-sm font-semibold text-foreground mb-1">{{ item.balances[c.type].remaining }}j</div>
        <div class="h-1 bg-border rounded-sm overflow-hidden mb-[3px]"><div class="h-full rounded-sm" :style="barStyle(item.balances[c.type])"></div></div>
        <div class="text-[10px] text-muted-foreground">{{ item.balances[c.type].used }}j / {{ item.balances[c.type].total }}j</div>
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
        <div v-for="c in TYPE_COLS" :key="c.key" class="text-[12px]">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{{ c.label }}</span>
            <span class="font-semibold text-foreground">{{ item.balances[c.type]?.remaining ?? 0 }}j / {{ item.balances[c.type]?.total ?? 0 }}j</span>
          </div>
          <div v-if="item.balances[c.type] && item.balances[c.type].total > 0" class="h-1 bg-border rounded-sm overflow-hidden mt-1"><div class="h-full rounded-sm" :style="barStyle(item.balances[c.type])"></div></div>
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
import { ref, computed, watch } from 'vue'
import { FileDown, Users, Sun, RefreshCw, Home } from 'lucide-vue-next'
import { UserAvatar, ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import * as L from '../../lib/listClasses'
import { useAbsenceStore } from '../../stores/absences'
import { useEntityStore }  from '../../stores/entities'

const absenceStore = useAbsenceStore()
const entityStore  = useEntityStore()

const kpiCard = 'bg-card border border-border rounded-[10px] p-3.5 flex items-center gap-3'
const kpiIcon = 'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold text-foreground leading-none'
const kpiLabel = 'text-[11px] text-muted-foreground mt-0.5'

const TYPE_COLS = [
  { key: 'annual',     type: 'Congé annuel',              label: 'Annuel' },
  { key: 'sick',       type: 'Congé maladie',             label: 'Maladie' },
  { key: 'recovery',   type: 'Récupération',              label: 'Récup.' },
  { key: 'remote',     type: 'Télétravail',               label: 'Télétravail' },
  { key: 'maternity',  type: 'Congé maternité',           label: 'Maternité' },
  { key: 'permission', type: 'Permission exceptionnelle', label: 'Permission' },
] as const

function cellSlot(key: string) { return `cell-${key}` }

const search       = ref('')
const filterEntity = ref('')
const filterType   = ref('')
const page         = ref(1)
const pageSize     = ref(10)

watch([search, filterEntity, filterType, pageSize], () => { page.value = 1 })
function resetFilters() { search.value = ''; filterEntity.value = ''; filterType.value = ''; page.value = 1 }

const columns = computed<ListColumn[]>(() => {
  const cols = filterType.value ? TYPE_COLS.filter(c => c.type === filterType.value) : TYPE_COLS
  return [
    { key: 'employee', label: 'Employé', hideable: false, width: 230 },
    ...cols.map(c => ({ key: c.key, label: c.label, align: 'center' as const, width: 130 })),
  ]
})

const filteredBalances = computed(() => {
  let list = absenceStore.employeeBalances
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

const totals = computed(() => {
  const acc: Record<string, { used: number; total: number; remaining: number }> = {}
  for (const c of TYPE_COLS) {
    acc[c.type] = { used: 0, total: 0, remaining: 0 }
    for (const row of absenceStore.employeeBalances) {
      const b = row.balances[c.type]
      if (b && b.total > 0) { acc[c.type]!.used += b.used; acc[c.type]!.total += b.total; acc[c.type]!.remaining += b.remaining }
    }
  }
  return acc
})

interface BalanceCell { used: number; total: number; remaining: number }
function barStyle(b: BalanceCell) {
  if (!b || b.total === 0) return {}
  const pct    = (b.used / b.total) * 100
  const remain = b.remaining / b.total
  const color  = remain > 0.5 ? 'var(--color-success)' : remain > 0.2 ? 'var(--color-warning)' : 'var(--color-danger)'
  return { width: `${Math.min(100, pct)}%`, background: color }
}
</script>
