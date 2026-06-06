<template>
  <!-- ── Barre d'onglets ── -->
  <div class="tabs-bar">
    <div
      v-for="tab in TABS" :key="tab.key"
      class="tab" :class="{ active: navStore.activeEntityTab === tab.key }"
      @click="changeTab(tab.key)"
    >
      <i :class="tab.icon"></i> {{ tab.label }}
      <span v-if="tab.key === 'pending' && store.pendingEntities.length > 0" class="tab-badge">
        {{ store.pendingEntities.length }}
      </span>
    </div>
  </div>

  <!-- ════════════ ONGLET : VUE HIÉRARCHIQUE ════════════ -->
  <template v-if="navStore.activeEntityTab === 'tree'">
    <div class="org-toolbar">
      <button class="btn btn-outline btn-sm" @click="expandAll">
        <i class="ti ti-arrows-maximize"></i> Tout déplier
      </button>
      <button class="btn btn-outline btn-sm" @click="collapseAll">
        <i class="ti ti-arrows-minimize"></i> Tout replier
      </button>
      <span class="org-hint">
        <i class="ti ti-info-circle"></i>
        Cliquez sur ▾/▸ pour replier/déplier un nœud
      </span>
      <div class="view-switcher">
        <button class="switcher-btn active" title="Vue hiérarchique">
          <i class="ti ti-list-tree"></i>
        </button>
        <button class="switcher-btn" title="Organigramme" @click="changeTab('orgchart')">
          <i class="ti ti-hierarchy"></i>
        </button>
      </div>
    </div>
    <div class="org-container">
      <OrgNode
        v-for="root in store.buildTree"
        :key="root.id"
        :entity="root"
      />
    </div>
  </template>

  <!-- ════════════ ONGLET : ORGANIGRAMME ════════════ -->
  <template v-else-if="navStore.activeEntityTab === 'orgchart'">
    <div class="org-toolbar">
      <span class="org-hint">
        <i class="ti ti-info-circle"></i>
        Faites glisser · Clic sur un nœud pour le détail
      </span>
      <div class="view-switcher">
        <button class="switcher-btn" title="Vue hiérarchique" @click="changeTab('tree')">
          <i class="ti ti-list-tree"></i>
        </button>
        <button class="switcher-btn active" title="Organigramme">
          <i class="ti ti-hierarchy"></i>
        </button>
      </div>
    </div>
    <OrgChartView />
  </template>

  <!-- ════════════ ONGLET : LISTE ════════════ -->
  <template v-if="navStore.activeEntityTab === 'list'">
    <div class="table-card">
      <div class="filter-bar">
        <select v-model="fType" class="filter-sel">
          <option value="">Tous les types</option>
          <option value="direction">Direction</option>
          <option value="department">Département</option>
          <option value="service">Service</option>
        </select>
        <select v-model="fStatus" class="filter-sel">
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="pending_approval">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="inactive">Inactif</option>
        </select>
        <div class="search-box">
          <i class="ti ti-search"></i>
          <input v-model="fSearch" placeholder="Rechercher…" class="search-input" />
        </div>
        <button v-if="fType || fStatus || fSearch" class="btn btn-outline btn-sm" @click="resetFilters">
          <i class="ti ti-refresh"></i> Réinitialiser
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Nom</th>
            <th>Type</th>
            <th>Entité parente</th>
            <th>Responsable</th>
            <th>Effectif</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in listPageItems" :key="e.id">
            <td><span class="code-chip">{{ e.code }}</span></td>
            <td class="td-name">{{ e.name }}</td>
            <td>
              <span class="type-badge" :class="`type-${e.type}`">{{ typeLabel(e.type) }}</span>
            </td>
            <td class="td-muted">{{ parentName(e.parentId) }}</td>
            <td class="td-muted">{{ e.responsibleName || '—' }}</td>
            <td class="td-center">
              <span class="headcount-chip"><i class="ti ti-users"></i> {{ e.headcount }}</span>
            </td>
            <td><StatusPill :status="e.status" /></td>
            <td>
              <div class="actions-cell">
                <button class="act-btn" @click="navigateTo(e.id)">Voir →</button>
                <button v-if="e.status === 'draft'"            class="act-btn act-warning" @click="store.submitEntity(e.id)">Soumettre</button>
                <button v-if="e.status === 'pending_approval'" class="act-btn act-success" @click="store.approveEntity(e.id)">Approuver</button>
                <button v-if="e.status === 'pending_approval'" class="act-btn act-danger"  @click="store.rejectEntity(e.id)">Rejeter</button>
              </div>
            </td>
          </tr>
          <tr v-if="listPageItems.length === 0">
            <td colspan="8" class="empty-row">Aucune entité trouvée</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="listTotalPages > 1">
        <span class="pag-total">{{ filteredList.length }} entité(s)</span>
        <div class="pag-pages">
          <button class="pag-btn" :disabled="listPage === 1" @click="listPage--">
            <i class="ti ti-chevron-left"></i>
          </button>
          <button
            v-for="p in listTotalPages" :key="p"
            class="pag-btn" :class="{ active: p === listPage }"
            @click="listPage = p"
          >{{ p }}</button>
          <button class="pag-btn" :disabled="listPage === listTotalPages" @click="listPage++">
            <i class="ti ti-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </template>

  <!-- ════════════ ONGLET : EN ATTENTE ════════════ -->
  <template v-if="navStore.activeEntityTab === 'pending'">
    <div v-if="store.pendingEntities.length === 0" class="empty-state">
      <i class="ti ti-check-circle"></i>
      <p>Aucune entité en attente d'approbation</p>
    </div>
    <div v-else class="table-card">
      <table class="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Nom</th>
            <th>Type</th>
            <th>Responsable</th>
            <th>Soumis le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in store.pendingEntities" :key="e.id">
            <td><span class="code-chip">{{ e.code }}</span></td>
            <td class="td-name">{{ e.name }}</td>
            <td>
              <span class="type-badge" :class="`type-${e.type}`">{{ typeLabel(e.type) }}</span>
            </td>
            <td class="td-muted">{{ e.responsibleName || '—' }}</td>
            <td class="td-muted">{{ e.submittedAt || '—' }}</td>
            <td>
              <div class="actions-cell">
                <button class="act-btn" @click="navigateTo(e.id)">Voir →</button>
                <button class="act-btn act-success" @click="store.approveEntity(e.id)">
                  <i class="ti ti-check"></i> Approuver
                </button>
                <button class="act-btn act-danger" @click="store.rejectEntity(e.id)">
                  <i class="ti ti-x"></i> Rejeter
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEntityStore }     from '../../stores/entities'
import { useNavigationStore } from '../../stores/navigation'
import OrgNode      from '../../views/entities/OrgNode.vue'
import OrgChartView from '../OrgChartView.vue'
import StatusPill   from '../ui/StatusPill.vue'
import type { EntityType } from '../../types'

const router   = useRouter()
const route    = useRoute()
const store    = useEntityStore()
const navStore = useNavigationStore()

// ── Onglets ────────────────────────────────────────────────────
const VALID_TABS = ['tree', 'orgchart', 'list', 'pending'] as const
type TabKey = typeof VALID_TABS[number]

const TABS = [
  { key: 'tree'     as TabKey, label: 'Vue hiérarchique', icon: 'ti ti-list-tree' },
  { key: 'orgchart' as TabKey, label: 'Organigramme',     icon: 'ti ti-hierarchy' },
  { key: 'list'     as TabKey, label: 'Liste',            icon: 'ti ti-list' },
  { key: 'pending'  as TabKey, label: 'En attente',       icon: 'ti ti-clock' },
]

function changeTab(key: TabKey) {
  navStore.setEntityTab(key)
}

// Sync depuis query param au montage
onMounted(() => {
  const q = route.query.tab as string
  if (q && (VALID_TABS as readonly string[]).includes(q)) {
    navStore.setEntityTab(q)
  }
})

// ── Navigation contextuelle ───────────────────────────────────
function navigateTo(id: string) {
  navStore.setPreviousRoute(`/rh/entites?tab=${navStore.activeEntityTab}`)
  router.push({ name: 'entity-detail', params: { id } })
}

// Fournit la navigation aux OrgNodes enfants
provide('navigate-to-detail', (id: string) => navigateTo(id))

// ── Provide pour OrgNode (collapse) ──────────────────────────
const collapsedIds = ref<string[]>([])
provide('entity-collapsed', collapsedIds)
provide('entity-toggle', (id: string) => {
  if (collapsedIds.value.includes(id)) {
    collapsedIds.value = collapsedIds.value.filter(x => x !== id)
  } else {
    collapsedIds.value = [...collapsedIds.value, id]
  }
})

function expandAll()  { collapsedIds.value = [] }
function collapseAll() {
  collapsedIds.value = store.entities
    .filter(e => store.entities.some(c => c.parentId === e.id))
    .map(e => e.id)
}

// ── Filtres liste ──────────────────────────────────────────────
const fType   = ref('')
const fStatus = ref('')
const fSearch = ref('')
const listPage = ref(1)
const LIST_SIZE = 15

function resetFilters() { fType.value = ''; fStatus.value = ''; fSearch.value = ''; listPage.value = 1 }

const filteredList = computed(() =>
  store.entities.filter(e => {
    if (fType.value   && e.type   !== fType.value)   return false
    if (fStatus.value && e.status !== fStatus.value) return false
    if (fSearch.value) {
      const q = fSearch.value.toLowerCase()
      if (!e.name.toLowerCase().includes(q) && !e.code.toLowerCase().includes(q)) return false
    }
    return true
  })
)

const listTotalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / LIST_SIZE)))
const listPageItems  = computed(() => {
  const start = (listPage.value - 1) * LIST_SIZE
  return filteredList.value.slice(start, start + LIST_SIZE)
})

watch(filteredList, () => { listPage.value = 1 })

// ── Helpers ────────────────────────────────────────────────────
function typeLabel(t: EntityType | string): string {
  const map: Record<string, string> = { direction: 'Direction', department: 'Département', service: 'Service' }
  return map[t] ?? t
}

function parentName(parentId: string | null): string {
  if (!parentId) return '— Racine —'
  return store.getEntityById(parentId)?.name ?? '—'
}
</script>

<style scoped>
/* ── Onglets ── */
.tabs-bar {
  display: flex; border-bottom: 0.5px solid var(--color-border);
  margin-bottom: 16px; background: var(--color-surface);
  border-radius: 8px 8px 0 0; padding: 0 4px;
  border: 0.5px solid var(--color-border);
}
.tab {
  padding: 10px 18px; font-size: 13px; color: var(--color-text-muted);
  cursor: pointer; border-bottom: 2px solid transparent;
  display: flex; align-items: center; gap: 6px; transition: color .1s;
}
.tab:hover { color: var(--color-text); }
.tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 500; }
.tab-badge { background: var(--color-danger); color: white; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 10px; }

/* ── Org toolbar ── */
.org-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.org-hint { font-size: 11px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; margin-left: auto; }
.org-hint i { font-size: 13px; }

/* ── Switcher ── */
.view-switcher { display: flex; gap: 4px; margin-left: 8px; }
.switcher-btn {
  padding: 6px 8px; border-radius: 6px; border: none;
  cursor: pointer; font-size: 16px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  background: transparent; color: var(--color-text-muted); transition: all .12s;
}
.switcher-btn:hover { background: var(--color-primary-light); color: var(--color-primary); }
.switcher-btn.active { background: var(--color-primary-light); color: var(--color-primary); }

/* ── Org container ── */
.org-container { overflow-x: auto; padding: 4px 4px 16px; min-width: 0; }

/* ── Buttons ── */
.btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; }
.btn-sm { padding: 5px 12px; font-size: 12px; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

/* ── Table card ── */
.table-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 8px; overflow: hidden; }

/* ── Filter bar ── */
.filter-bar { display: flex; gap: 8px; align-items: center; padding: 10px 14px; border-bottom: 0.5px solid var(--color-border); flex-wrap: wrap; }
.filter-sel { height: 30px; padding: 0 8px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 12px; color: var(--color-text); background: var(--color-surface); outline: none; }
.filter-sel:focus { border-color: var(--color-primary); }
.search-box { display: flex; align-items: center; gap: 6px; border: 0.5px solid var(--color-border); border-radius: 6px; padding: 0 8px; height: 30px; background: var(--color-surface); }
.search-box i { color: var(--color-text-muted); font-size: 13px; }
.search-input { border: none; outline: none; font-size: 12px; width: 160px; background: transparent; }

/* ── Table ── */
.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th { padding: 10px 13px; text-align: left; font-size: 11px; font-weight: 600; color: var(--color-text-muted); background: var(--color-bg); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
.table td { padding: 10px 13px; border-bottom: 0.5px solid var(--color-border); vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover td { background: var(--color-primary-light); }

/* ── Cellules ── */
.td-name   { font-weight: 500; }
.td-muted  { color: var(--color-text-muted); font-size: 12px; }
.td-center { text-align: center; }
.empty-row { text-align: center; color: var(--color-text-muted); padding: 32px; font-size: 13px; }

.code-chip { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: var(--color-primary-light); color: var(--color-primary); letter-spacing: .04em; }

.type-badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 12px; white-space: nowrap; }
.type-badge.type-direction  { background: var(--galana-red-light);   color: var(--galana-red); }
.type-badge.type-department { background: var(--galana-green-light); color: var(--galana-green); }
.type-badge.type-service    { background: var(--color-primary-light); color: var(--color-primary); }

.headcount-chip { font-size: 11px; color: var(--color-text-muted); display: inline-flex; align-items: center; gap: 3px; }

/* ── Actions ── */
.actions-cell { display: flex; gap: 4px; flex-wrap: wrap; }
.act-btn { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; background: var(--color-bg); color: var(--color-text-muted); transition: all .1s; }
.act-btn:hover { background: var(--color-border); color: var(--color-text); }
.act-success   { background: var(--color-success-bg); color: var(--color-success); }
.act-danger    { background: var(--color-danger-bg);  color: var(--color-danger); }
.act-warning   { background: var(--color-warning-bg); color: var(--color-warning); }

/* ── Pagination ── */
.pagination { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-top: 0.5px solid var(--color-border); font-size: 12px; color: var(--color-text-muted); }
.pag-total  { flex: 1; }
.pag-pages  { display: flex; gap: 3px; }
.pag-btn    { min-width: 28px; height: 28px; padding: 0 6px; border-radius: 5px; font-size: 12px; font-weight: 500; cursor: pointer; border: 0.5px solid var(--color-border); background: var(--color-surface); color: var(--color-text); display: flex; align-items: center; justify-content: center; }
.pag-btn:hover:not(:disabled) { background: var(--color-bg); }
.pag-btn.active   { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.pag-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Empty state ── */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 10px; color: var(--color-text-muted); background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 8px; }
.empty-state i { font-size: 40px; color: var(--color-success); }
.empty-state p { font-size: 14px; }
</style>
