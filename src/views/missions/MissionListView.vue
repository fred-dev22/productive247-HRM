<template>
  <ListPageLayout
    :title="isRh ? 'Gestion des missions' : 'Mes missions'"
    :subtitle="isRh ? 'Tous les ordres de mission' : 'Vos ordres de mission'"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} mission(s)`"
    search-placeholder="Rechercher une mission…"
    scope-label="Missions :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @open-card="openCard"
  >
    <!-- Bouton "Nouvelle mission" -->
    <template #header-actions>
      <button :class="L.btnPrimary" @click="showCreate = true">
        <Plus class="w-4 h-4" /> Nouvelle mission
      </button>
    </template>

    <!-- Actions contextuelles (ligne sélectionnée) -->
    <template #row-actions="{ item }">
      <MissionWorkflowActions :mission="item" />
    </template>

    <!-- Cellules -->
    <template #cell-code="{ item }">
      <span class="font-mono text-xs font-semibold text-primary">{{ item.code }}</span>
    </template>
    <template #cell-employeeName="{ item }">
      <div class="flex items-center gap-2">
        <UserAvatar :name="item.employeeName" size="sm" />
        <span class="truncate">{{ item.employeeName }}</span>
      </div>
    </template>
    <template #cell-dates="{ item }">
      <span class="whitespace-nowrap text-[11px]">{{ shortDate(item.departureDate) }} → {{ shortDate(item.returnDate) }}</span>
    </template>
    <template #cell-numberOfDays="{ item }">
      <span class="bg-info-bg text-info text-[11px] font-semibold px-2 py-0.5 rounded-full">{{ item.numberOfDays }}j</span>
    </template>
    <template #cell-totalMission="{ item }">
      <span class="font-semibold whitespace-nowrap tabular-nums">{{ fmtNum(item.totalMission) }} MGA</span>
    </template>
    <template #cell-status="{ item }">
      <StatusPill :status="item.status" />
    </template>

    <!-- Aperçu rapide -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div class="flex items-center gap-2.5">
          <UserAvatar :name="item.employeeName" size="md" />
          <div class="min-w-0">
            <div class="text-sm font-semibold text-foreground truncate">{{ item.employeeName }}</div>
            <div class="text-[11px] text-muted-foreground font-mono">{{ item.code }}</div>
          </div>
        </div>
        <div><StatusPill :status="item.status" /></div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Destination</div>{{ item.destination }}</div>
          <div><div class="text-muted-foreground text-[11px]">Durée</div>{{ item.numberOfDays }}j</div>
          <div><div class="text-muted-foreground text-[11px]">Départ</div>{{ shortDate(item.departureDate) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Retour</div>{{ shortDate(item.returnDate) }}</div>
        </div>
        <div class="text-[12px]">
          <div class="text-muted-foreground text-[11px]">Total mission</div>
          <span class="font-semibold text-primary">{{ fmtNum(item.totalMission) }} MGA</span>
        </div>
        <div v-if="item.purpose" class="text-[12px]">
          <div class="text-muted-foreground text-[11px]">Objet</div>{{ item.purpose }}
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item)">Ouvrir la fiche</button>
        <MissionWorkflowActions :mission="item" />
      </div>
    </template>

    <!-- État vide -->
    <template #empty>
      <Plane class="w-8 h-8" />
      <p class="text-[13px]">Aucune mission trouvée</p>
    </template>

    <!-- Fiche (double-clic) + création -->
    <MissionCard v-if="openCardId !== null" :missions="filtered" :mission-id="openCardId" @close="openCardId = null" />
    <MissionCreate v-if="showCreate" :mode="isRh ? 'for-employee' : 'self'" @close="showCreate = false" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Plane } from 'lucide-vue-next'
import { StatusPill, UserAvatar, ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import MissionCard from '../../components/missions/MissionCard.vue'
import MissionCreate from '../../components/missions/MissionCreate.vue'
import MissionWorkflowActions from '../../components/missions/MissionWorkflowActions.vue'
import * as L from '../../lib/listClasses'
import { useAuthStore } from '../../stores/auth'
import { useMissionStore } from '../../stores/missions'
import type { MissionOrder } from '../../types'

const auth = useAuthStore()
const missionStore = useMissionStore()

const isRh = computed(() => auth.hasAnyPermission(['MISSION_VOIR_TOUT', 'MISSION_VOIR_EQUIPE']))

const showCreate = ref(false)
const openCardId = ref<string | null>(null)
function openCard(item: MissionOrder) { openCardId.value = item.id }

function shortDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function fmtNum(n: number) { return n.toLocaleString('fr-FR') }

/* ── Colonnes (sans colonne Actions) ────────────────────────── */
const columns = computed<ListColumn[]>(() => {
  const base: ListColumn[] = [
    { key: 'code', label: 'Code', sortable: true, hideable: false, width: 130 },
  ]
  if (isRh.value) base.push({ key: 'employeeName', label: 'Employé', sortable: true, width: 200 })
  base.push(
    { key: 'destination', label: 'Destination', sortable: true, width: 170 },
    { key: 'dates', label: 'Dates', width: 170 },
    { key: 'numberOfDays', label: 'Jours', align: 'center', width: 90 },
    { key: 'totalMission', label: 'Total', sortable: true, align: 'right', width: 150 },
    { key: 'status', label: 'Statut', width: 130 },
  )
  return base
})

/* ── Scope (statut) ─────────────────────────────────────────── */
const scopeOptions = [
  { value: '', label: 'Toutes' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvée' },
  { value: 'rejected', label: 'Refusée' },
  { value: 'returned', label: 'Retournée' },
  { value: 'cancelled', label: 'Annulée' },
]
const activeScope = ref('')

/* ── État liste ─────────────────────────────────────────────── */
const searchQuery = ref('')
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = ref(10)

watch([activeScope, searchQuery, pageSize], () => { page.value = 1 })

const sortFieldMap: Record<string, keyof MissionOrder> = {
  code: 'code', employeeName: 'employeeName', destination: 'destination', totalMission: 'totalMission',
}

const filtered = computed(() => {
  let rows = isRh.value ? missionStore.missions : missionStore.myMissions(auth.user?.id ?? '')
  if (activeScope.value) rows = rows.filter(m => m.status === activeScope.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    rows = rows.filter(m => m.code.toLowerCase().includes(q) || m.employeeName.toLowerCase().includes(q) || m.destination.toLowerCase().includes(q))
  }
  if (sortKey.value && sortFieldMap[sortKey.value]) {
    const f = sortFieldMap[sortKey.value]!
    rows = [...rows].sort((a, b) => {
      const va = a[f] ?? '', vb = b[f] ?? ''
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
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
