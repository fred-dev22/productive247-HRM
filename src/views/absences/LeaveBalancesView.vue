<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <!-- ── En-tête ── -->
        <div class="flex items-start justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h1 class="text-xl font-bold text-foreground">Soldes de congés</h1>
            <p class="text-[13px] text-muted-foreground mt-0.5">Vue d'ensemble des soldes par employé et par type</p>
          </div>
          <div class="flex gap-2 items-center">
            <button :class="L.btnOutline"><FileDown class="w-4 h-4" /> Exporter</button>
          </div>
        </div>

        <!-- ── KPIs ── -->
        <div class="grid grid-cols-4 gap-3 mb-3.5 max-[1100px]:grid-cols-2 max-md:grid-cols-2">
          <div :class="kpiCard">
            <div :class="kpiIcon" class="bg-success-bg"><Users class="w-[18px] h-[18px] text-success" /></div>
            <div>
              <div :class="kpiVal">{{ absenceStore.employeeBalances.length }}</div>
              <div :class="kpiLabel">Employés suivis</div>
            </div>
          </div>
          <div :class="kpiCard">
            <div :class="kpiIcon" class="bg-primary/10"><Sun class="w-[18px] h-[18px] text-primary" /></div>
            <div>
              <div :class="kpiVal">{{ totals['Congé annuel']?.remaining ?? 0 }}j</div>
              <div :class="kpiLabel">Congés annuels restants</div>
            </div>
          </div>
          <div :class="kpiCard">
            <div :class="kpiIcon" class="bg-warning-bg"><RefreshCw class="w-[18px] h-[18px] text-warning" /></div>
            <div>
              <div :class="kpiVal">{{ totals['Récupération']?.remaining ?? 0 }}j</div>
              <div :class="kpiLabel">Récupérations restantes</div>
            </div>
          </div>
          <div :class="kpiCard">
            <div :class="kpiIcon" class="bg-info-bg"><Home class="w-[18px] h-[18px] text-info" /></div>
            <div>
              <div :class="kpiVal">{{ totals['Télétravail']?.remaining ?? 0 }}j</div>
              <div :class="kpiLabel">Télétravail restants</div>
            </div>
          </div>
        </div>

        <!-- ── Filtres ── -->
        <div class="flex gap-2 mb-3.5 items-center flex-wrap">
          <div :class="L.searchBox" class="!h-[34px]">
            <Search class="w-3.5 h-3.5 text-muted-foreground" />
            <input v-model="search" type="text" placeholder="Rechercher un employé..." :class="L.searchInput" class="!w-[180px]" />
          </div>
          <select v-model="filterEntity" :class="filterSelect">
            <option value="">Toutes les entités</option>
            <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.name">{{ e.name }}</option>
          </select>
          <select v-model="filterType" :class="filterSelect">
            <option value="">Tous les types</option>
            <option v-for="type in TYPES" :key="type" :value="type">{{ TYPE_LABELS[type] }}</option>
          </select>
          <button v-if="hasFilters" class="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-md bg-transparent text-muted-foreground text-xs cursor-pointer hover:text-danger hover:border-danger" @click="resetFilters">
            <X class="w-3.5 h-3.5" /> Réinitialiser
          </button>
        </div>

        <!-- ── Table ── -->
        <div :class="L.tableCard">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th class="px-3.5 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border whitespace-nowrap min-w-[200px]">Employé</th>
                  <th v-for="type in visibleTypes" :key="type" class="px-3.5 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border whitespace-nowrap min-w-[110px]">
                    {{ TYPE_LABELS[type] }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in pageItems" :key="row.employeeId" class="hover:bg-background">
                  <td class="px-3.5 py-2.5 border-b border-border align-middle">
                    <div class="flex items-center gap-2">
                      <UserAvatar :name="row.employeeName" size="sm" />
                      <div>
                        <div class="text-[13px] font-medium text-foreground">{{ row.employeeName }}</div>
                        <div class="text-[11px] text-muted-foreground">{{ row.entityName }}</div>
                      </div>
                    </div>
                  </td>
                  <td v-for="type in visibleTypes" :key="type" class="px-3.5 py-2.5 border-b border-border align-middle min-w-[110px]">
                    <template v-if="row.balances[type] && row.balances[type].total > 0">
                      <div class="text-sm font-semibold text-foreground mb-1">{{ row.balances[type].remaining }}j</div>
                      <div class="h-1 bg-border rounded-sm overflow-hidden mb-[3px]">
                        <div class="h-full rounded-sm transition-[width] duration-300" :style="barStyle(row.balances[type])"></div>
                      </div>
                      <div class="text-[10px] text-muted-foreground">{{ row.balances[type].used }}j / {{ row.balances[type].total }}j</div>
                    </template>
                    <span v-else class="text-[13px] text-muted-foreground">—</span>
                  </td>
                </tr>
                <tr v-if="pageItems.length === 0">
                  <td :colspan="visibleTypes.length + 1" class="text-center p-8 text-muted-foreground text-[13px]">Aucun résultat</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div :class="L.pagination">
            <span class="flex-1 whitespace-nowrap">{{ filteredBalances.length }} employé(s)</span>
            <div class="flex items-center gap-1.5 whitespace-nowrap">
              Afficher
              <select v-model.number="pageSize" :class="L.pagSizeSelect">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </div>
            <div class="flex items-center gap-[3px]" v-if="totalPages > 1">
              <button :class="L.pagBtn" :disabled="page === 1" @click="page--"><ChevronLeft class="w-3.5 h-3.5" /></button>
              <button v-for="p in totalPages" :key="p" :class="[L.pagBtn, p === page && L.pagBtnActive]" @click="page = p">{{ p }}</button>
              <button :class="L.pagBtn" :disabled="page === totalPages" @click="page++"><ChevronRight class="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileDown, Users, Sun, RefreshCw, Home, Search, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { AppSidebar, AppTopNav } from '../../components'
import UserAvatar from '../../components/ui/UserAvatar.vue'
import * as L from '../../lib/listClasses'
import { useAuthStore }    from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import { useEntityStore }  from '../../stores/entities'

const auth         = useAuthStore()
const absenceStore = useAbsenceStore()
const entityStore  = useEntityStore()

// ── Classes du design system ─────────────────────────────────
const kpiCard = 'bg-card border border-border rounded-[10px] p-3.5 flex items-center gap-3'
const kpiIcon = 'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold text-foreground leading-none'
const kpiLabel = 'text-[11px] text-muted-foreground mt-0.5'
const filterSelect = 'h-[34px] px-2 border border-border rounded-md bg-card text-[13px] text-foreground outline-none focus:border-primary'

const search       = ref('')
const filterEntity = ref('')
const filterType   = ref('')
const page         = ref(1)
const pageSize     = ref(10)

const TYPES = [
  'Congé annuel', 'Congé maladie', 'Récupération',
  'Télétravail', 'Congé maternité', 'Permission exceptionnelle',
] as const
type BalanceType = typeof TYPES[number]

const TYPE_LABELS: Record<string, string> = {
  'Congé annuel':              'Annuel',
  'Congé maladie':             'Maladie',
  'Récupération':              'Récup.',
  'Télétravail':               'Télétravail',
  'Congé maternité':           'Maternité',
  'Permission exceptionnelle': 'Permission',
}

const visibleTypes = computed(() =>
  filterType.value ? [filterType.value as BalanceType] : [...TYPES]
)

const hasFilters = computed(() => !!search.value || !!filterEntity.value || !!filterType.value)
function resetFilters() { search.value = ''; filterEntity.value = ''; filterType.value = ''; page.value = 1 }

const filteredBalances = computed(() => {
  let list = absenceStore.employeeBalances
  if (filterEntity.value) list = list.filter(r => r.entityName === filterEntity.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r => r.employeeName.toLowerCase().includes(q))
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredBalances.value.length / pageSize.value)))
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredBalances.value.slice(start, start + pageSize.value)
})

// KPI totals
const totals = computed(() => {
  const acc: Record<string, { used: number; total: number; remaining: number }> = {}
  for (const type of TYPES) {
    acc[type] = { used: 0, total: 0, remaining: 0 }
    for (const row of absenceStore.employeeBalances) {
      const b = row.balances[type]
      if (b && b.total > 0) {
        acc[type].used      += b.used
        acc[type].total     += b.total
        acc[type].remaining += b.remaining
      }
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
