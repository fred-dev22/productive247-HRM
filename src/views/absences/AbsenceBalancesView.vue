<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- ── En-tête ── -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Soldes de congés</h1>
            <p class="page-sub">Vue d'ensemble des soldes par employé et par type</p>
          </div>
          <div class="header-actions">
            <router-link :to="{ name: 'rh' }" class="btn btn-outline">
              <i class="ti ti-arrow-left"></i> Retour
            </router-link>
            <button class="btn btn-outline"><i class="ti ti-file-export"></i> Exporter</button>
          </div>
        </div>

        <!-- ── KPIs ── -->
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-icon" style="background:var(--color-success-bg)">
              <i class="ti ti-users" style="color:var(--color-success)"></i>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ absenceStore.employeeBalances.length }}</div>
              <div class="kpi-label">Employés suivis</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:var(--color-primary-light)">
              <i class="ti ti-sun" style="color:var(--color-primary)"></i>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ totals['Congé annuel']?.remaining ?? 0 }}j</div>
              <div class="kpi-label">Congés annuels restants</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:var(--color-warning-bg)">
              <i class="ti ti-refresh" style="color:var(--color-warning)"></i>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ totals['Récupération']?.remaining ?? 0 }}j</div>
              <div class="kpi-label">Récupérations restantes</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:var(--color-info-bg)">
              <i class="ti ti-home" style="color:var(--color-info)"></i>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ totals['Télétravail']?.remaining ?? 0 }}j</div>
              <div class="kpi-label">Télétravail restants</div>
            </div>
          </div>
        </div>

        <!-- ── Filtres ── -->
        <div class="filters-bar">
          <div class="search-box">
            <i class="ti ti-search search-icon"></i>
            <input v-model="search" type="text" placeholder="Rechercher un employé..." class="search-input" />
          </div>
          <select v-model="filterEntity" class="filter-select">
            <option value="">Toutes les entités</option>
            <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.name">{{ e.name }}</option>
          </select>
          <select v-model="filterType" class="filter-select">
            <option value="">Tous les types</option>
            <option v-for="type in TYPES" :key="type" :value="type">{{ TYPE_LABELS[type] }}</option>
          </select>
          <button v-if="hasFilters" class="reset-btn" @click="resetFilters">
            <i class="ti ti-x"></i> Réinitialiser
          </button>
        </div>

        <!-- ── Table ── -->
        <div class="table-card">
          <div class="table-wrap">
            <table class="bal-table">
              <thead>
                <tr>
                  <th class="col-emp">Employé</th>
                  <th v-for="type in visibleTypes" :key="type" class="col-type">
                    {{ TYPE_LABELS[type] }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in pageItems" :key="row.employeeId">
                  <td>
                    <div class="emp-cell">
                      <UserAvatar :name="row.employeeName" size="sm" />
                      <div>
                        <div class="emp-name">{{ row.employeeName }}</div>
                        <div class="emp-entity">{{ row.entityName }}</div>
                      </div>
                    </div>
                  </td>
                  <td v-for="type in visibleTypes" :key="type" class="bal-cell">
                    <template v-if="row.balances[type] && row.balances[type].total > 0">
                      <div class="bal-value">{{ row.balances[type].remaining }}j</div>
                      <div class="bal-bar-wrap">
                        <div class="bal-bar" :style="barStyle(row.balances[type])"></div>
                      </div>
                      <div class="bal-sub">{{ row.balances[type].used }}j / {{ row.balances[type].total }}j</div>
                    </template>
                    <span v-else class="bal-na">—</span>
                  </td>
                </tr>
                <tr v-if="pageItems.length === 0">
                  <td :colspan="visibleTypes.length + 1" class="empty-row">Aucun résultat</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <span class="pag-total">{{ filteredBalances.length }} employé(s)</span>
            <div class="pag-perpage">
              Afficher
              <select v-model.number="pageSize" class="pag-size-select">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </div>
            <div class="pag-pages" v-if="totalPages > 1">
              <button class="pag-btn pag-arrow" :disabled="page === 1" @click="page--"><i class="ti ti-chevron-left"></i></button>
              <button v-for="p in totalPages" :key="p" class="pag-btn" :class="{ active: p === page }" @click="page = p">{{ p }}</button>
              <button class="pag-btn pag-arrow" :disabled="page === totalPages" @click="page++"><i class="ti ti-chevron-right"></i></button>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppSidebar, AppTopNav } from '../../components'
import UserAvatar from '../../components/ui/UserAvatar.vue'
import { useAuthStore }    from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import { useEntityStore }  from '../../stores/entities'

const auth         = useAuthStore()
const absenceStore = useAbsenceStore()
const entityStore  = useEntityStore()

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

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.page-title   { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub     { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; align-items: center; }

.btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; text-decoration: none; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

/* KPIs */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
.kpi-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; padding: 14px; display: flex; align-items: center; gap: 12px; }
.kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.kpi-val  { font-size: 22px; font-weight: 700; color: var(--color-text); line-height: 1; }
.kpi-label { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }

/* Filters */
.filters-bar { display: flex; gap: 8px; margin-bottom: 14px; align-items: center; flex-wrap: wrap; }
.search-box  { display: flex; align-items: center; gap: 6px; border: 0.5px solid var(--color-border); border-radius: 6px; padding: 0 8px; height: 34px; background: var(--color-surface); }
.search-icon { color: var(--color-text-muted); font-size: 13px; }
.search-input { border: none; outline: none; font-size: 12px; color: var(--color-text); background: transparent; width: 180px; }
.filter-select { height: 34px; padding: 0 8px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-surface); font-size: 13px; color: var(--color-text); outline: none; }
.reset-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: none; color: var(--color-text-muted); font-size: 12px; cursor: pointer; }
.reset-btn:hover { color: var(--color-danger); border-color: var(--color-danger); }

/* Table */
.table-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.bal-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.bal-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; background: var(--color-bg); border-bottom: 0.5px solid var(--color-border); white-space: nowrap; }
.col-emp  { min-width: 200px; }
.col-type { min-width: 110px; }
.bal-table td { padding: 10px 14px; border-bottom: 0.5px solid var(--color-border); vertical-align: middle; }
.bal-table tbody tr:last-child td { border-bottom: none; }
.bal-table tbody tr:hover td { background: var(--color-bg); }
.empty-row { text-align: center; padding: 32px; color: var(--color-text-muted); font-size: 13px; }

.emp-cell   { display: flex; align-items: center; gap: 8px; }
.emp-name   { font-size: 13px; font-weight: 500; color: var(--color-text); }
.emp-entity { font-size: 11px; color: var(--color-text-muted); }

.bal-cell   { min-width: 110px; }
.bal-value  { font-size: 14px; font-weight: 600; color: var(--color-text); margin-bottom: 4px; }
.bal-bar-wrap { height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; margin-bottom: 3px; }
.bal-bar    { height: 100%; border-radius: 2px; transition: width .3s; }
.bal-sub    { font-size: 10px; color: var(--color-text-muted); }
.bal-na     { font-size: 13px; color: var(--color-text-muted); }

/* Pagination */
.pagination { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-top: 0.5px solid var(--color-border); font-size: 12px; color: var(--color-text-muted); }
.pag-total  { flex: 1; white-space: nowrap; }
.pag-perpage { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.pag-size-select { height: 26px; padding: 0 6px; border: 0.5px solid var(--color-border); border-radius: 5px; font-size: 12px; background: var(--color-surface); outline: none; }
.pag-pages { display: flex; gap: 3px; }
.pag-btn { min-width: 28px; height: 28px; padding: 0 6px; border-radius: 5px; font-size: 12px; cursor: pointer; border: 0.5px solid var(--color-border); background: var(--color-surface); color: var(--color-text); display: flex; align-items: center; justify-content: center; }
.pag-btn:hover:not(:disabled) { background: var(--color-bg); }
.pag-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.pag-btn:disabled { opacity: .35; cursor: not-allowed; }

@media (max-width: 1100px) { .kpi-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px)  { .kpi-row { grid-template-columns: 1fr 1fr; } .content { padding: 16px; } }
</style>
