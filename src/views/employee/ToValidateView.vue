<template>
  <ListPageLayout
    title="Demandes à valider"
    :subtitle="`${pendingAbsences.length + pendingMissions.length} en attente de validation`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} élément(s)`"
    :search-placeholder="scope === 'absences' ? 'Rechercher une demande…' : 'Rechercher une mission…'"
    scope-label="À valider :"
    :scope-options="scopeOptions"
    v-model:scope="scope"
    v-model:search-query="searchQuery"
    v-model:page="page"
    v-model:page-size="pageSize"
    @open-card="openCard"
  >
    <!-- Actions contextuelles -->
    <template #row-actions="{ item }">
      <AbsenceWorkflowActions v-if="scope === 'absences'" :leave="item" />
      <MissionWorkflowActions v-else :mission="item" />
    </template>

    <!-- Cellules ABSENCES -->
    <template #cell-employeeName="{ item }">
      <div class="flex items-center gap-2"><UserAvatar :name="item.employeeName" size="sm" /><span class="truncate">{{ item.employeeName }}</span></div>
    </template>
    <template #cell-type="{ item }"><span class="whitespace-nowrap">{{ item.type }}</span></template>
    <template #cell-dates="{ item }"><span class="whitespace-nowrap text-[11px]">{{ item.startDate }} → {{ item.endDate }}</span></template>
    <template #cell-workingDays="{ item }"><span class="font-medium">{{ item.workingDays }}j</span></template>
    <!-- Cellules MISSIONS -->
    <template #cell-code="{ item }"><span class="font-mono text-xs font-semibold text-primary">{{ item.code }}</span></template>
    <template #cell-destination="{ item }"><span class="truncate">{{ item.destination }}</span></template>
    <template #cell-missionDates="{ item }"><span class="whitespace-nowrap text-[11px]">{{ shortDate(item.departureDate) }} → {{ shortDate(item.returnDate) }}</span></template>
    <template #cell-totalMission="{ item }"><span class="font-semibold tabular-nums whitespace-nowrap">{{ fmtNum(item.totalMission) }} MGA</span></template>
    <!-- Commun -->
    <template #cell-status="{ item }"><StatusPill :status="item.status" /></template>

    <template #empty>
      <ClipboardCheck class="w-8 h-8" />
      <p class="text-[13px]">{{ scope === 'absences' ? 'Aucune demande d\'absence' : 'Aucun ordre de mission' }}</p>
    </template>

    <AbsenceCard v-if="scope === 'absences' && openAbsenceId !== null" :leaves="(filtered as LeaveRequest[])" :request-id="openAbsenceId" @close="openAbsenceId = null" />
    <MissionCard v-if="scope === 'missions' && openMissionId !== null" :missions="(filtered as unknown as MissionOrder[])" :mission-id="openMissionId" @close="openMissionId = null" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ClipboardCheck } from 'lucide-vue-next'
import { StatusPill, UserAvatar, ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import AbsenceCard from '../../components/absences/AbsenceCard.vue'
import AbsenceWorkflowActions from '../../components/absences/AbsenceWorkflowActions.vue'
import MissionCard from '../../components/missions/MissionCard.vue'
import MissionWorkflowActions from '../../components/missions/MissionWorkflowActions.vue'
import { useAbsenceStore } from '../../stores/absences'
import { useMissionStore } from '../../stores/missions'
import type { LeaveRequest, MissionOrder } from '../../types'

const absenceStore = useAbsenceStore()
const missionStore = useMissionStore()

const scope = ref<'absences' | 'missions'>('absences')
const scopeOptions = [
  { value: 'absences', label: 'Absences' },
  { value: 'missions', label: 'Missions' },
]

const openAbsenceId = ref<number | null>(null)
const openMissionId = ref<string | null>(null)
function openCard(item: LeaveRequest | MissionOrder) {
  if (scope.value === 'absences') openAbsenceId.value = (item as LeaveRequest).id
  else openMissionId.value = (item as MissionOrder).id
}

function shortDate(iso: string): string { return iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—' }
function fmtNum(n: number) { return n.toLocaleString('fr-FR') }

const absenceColumns: ListColumn[] = [
  { key: 'employeeName', label: 'Employé', hideable: false, width: 220 },
  { key: 'type', label: 'Type', width: 160 },
  { key: 'dates', label: 'Dates', width: 200 },
  { key: 'workingDays', label: 'Jours', align: 'center', width: 90 },
  { key: 'submittedAt', label: 'Soumis le', width: 120 },
  { key: 'status', label: 'Statut', width: 130 },
]
const missionColumns: ListColumn[] = [
  { key: 'code', label: 'Code', hideable: false, width: 130 },
  { key: 'employeeName', label: 'Employé', width: 200 },
  { key: 'destination', label: 'Destination', width: 170 },
  { key: 'missionDates', label: 'Dates', width: 170 },
  { key: 'totalMission', label: 'Total', align: 'right', width: 150 },
  { key: 'status', label: 'Statut', width: 130 },
]
const columns = computed(() => scope.value === 'absences' ? absenceColumns : missionColumns)

const searchQuery = ref('')
const page = ref(1)
const pageSize = ref(10)
watch([scope, searchQuery, pageSize], () => { page.value = 1 })

const pendingAbsences = computed(() => absenceStore.allLeaves.filter(l => l.status === 'pending'))
const pendingMissions = computed(() => missionStore.missions.filter(m => m.status === 'pending'))

const displayedAbsences = computed(() =>
  absenceStore.allLeaves.filter(l => ['pending', 'returned', 'approved', 'rejected'].includes(l.status)),
)
const displayedMissions = computed(() =>
  missionStore.missions.filter(m => ['pending', 'returned', 'approved', 'rejected'].includes(m.status)),
)

const filtered = computed<(LeaveRequest | MissionOrder)[]>(() => {
  if (scope.value === 'absences') {
    let rows = displayedAbsences.value
    if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); rows = rows.filter(l => l.employeeName.toLowerCase().includes(q) || l.type.toLowerCase().includes(q)) }
    return rows
  }
  let rows = displayedMissions.value
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); rows = rows.filter(m => m.code.toLowerCase().includes(q) || m.employeeName.toLowerCase().includes(q) || m.destination.toLowerCase().includes(q)) }
  return rows
})

const totalCount = computed(() => filtered.value.length)
// items typés any[] : la vue mixe légitimement deux types (absences / missions)
// selon le scope ; les slots #cell-* lisent les champs propres à chaque type.
/* eslint-disable @typescript-eslint/no-explicit-any */
const pageItems = computed<any[]>(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
</script>
