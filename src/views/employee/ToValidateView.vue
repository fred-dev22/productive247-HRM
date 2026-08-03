<template>
  <ListPageLayout
    title="Demandes à valider"
    :subtitle="`${pendingAbsences.length + pendingMissions.length + pendingExpenses.length} en attente de validation`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} élément(s)`"
    :search-placeholder="scope === 'absences' ? 'Rechercher une demande…' : scope === 'missions' ? 'Rechercher une mission…' : 'Rechercher une note…'"
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
      <MissionWorkflowActions v-else-if="scope === 'missions'" :mission="item" />
      <ExpenseWorkflowActions v-else :report="item" />
    </template>

    <!-- Cellules ABSENCES -->
    <template #cell-employeeName="{ item }">
      <div class="flex items-center gap-2"><UserAvatar :name="item.employeeName" size="sm" /><span class="truncate">{{ item.employeeName }}</span></div>
    </template>
    <template #cell-type="{ item }"><span class="whitespace-nowrap">{{ item.leaveTypeName }}</span></template>
    <template #cell-dates="{ item }"><span class="whitespace-nowrap text-[11px]">{{ formatDate(item.startDate) }} → {{ formatDate(item.endDate) }}</span></template>
    <template #cell-workingDays="{ item }"><span class="font-medium">{{ item.daysCount }}j</span></template>
    <template #cell-createdAt="{ item }"><span class="text-muted-foreground whitespace-nowrap text-[11px]">{{ formatDate(item.createdAt) }}</span></template>
    <!-- Cellules MISSIONS -->
    <template #cell-referenceCode="{ item }"><span class="font-mono text-xs font-semibold text-primary">{{ item.referenceCode }}</span></template>
    <template #cell-destination="{ item }"><span class="truncate">{{ item.destination }}</span></template>
    <template #cell-missionDates="{ item }"><span class="whitespace-nowrap text-[11px]">{{ shortDate(item.departureDate) }} → {{ shortDate(item.returnDate) }}</span></template>
    <template #cell-estimatedTotal="{ item }"><span class="font-semibold tabular-nums whitespace-nowrap">{{ fmtNum(item.estimatedTotal ?? 0) }} MGA</span></template>
    <!-- Cellules NOTES DE FRAIS -->
    <template #cell-title="{ item }"><span class="truncate">{{ item.title }}</span></template>
    <template #cell-totalAmount="{ item }"><span class="font-semibold tabular-nums whitespace-nowrap">{{ fmtNum(item.totalAmount) }} {{ item.currency }}</span></template>
    <!-- Commun -->
    <template #cell-status="{ item }"><StatusPill :status="item.status" /></template>

    <!-- Panneau d'aperçu rapide — mixe les 3 types selon le scope actif,
         comme les cellules #cell-* ci-dessus. -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div class="flex items-center gap-2.5">
          <UserAvatar :name="item.employeeName" size="md" />
          <div class="min-w-0">
            <div class="text-sm font-semibold text-foreground truncate">{{ item.employeeName }}</div>
            <div class="text-[11px] text-muted-foreground">
              {{ scope === 'absences' ? item.leaveTypeName : (item.referenceCode || '') }}
            </div>
          </div>
        </div>
        <div><StatusPill :status="item.status" /></div>

        <template v-if="scope === 'absences'">
          <div class="grid grid-cols-2 gap-2 text-[12px]">
            <div><div class="text-muted-foreground text-[11px]">Début</div>{{ formatDate(item.startDate) }}</div>
            <div><div class="text-muted-foreground text-[11px]">Fin</div>{{ formatDate(item.endDate) }}</div>
            <div><div class="text-muted-foreground text-[11px]">Jours ouvrés</div>{{ item.daysCount }}j</div>
            <div><div class="text-muted-foreground text-[11px]">Soumis le</div>{{ formatDate(item.createdAt) }}</div>
          </div>
          <div v-if="item.reason" class="text-[12px]">
            <div class="text-muted-foreground text-[11px]">Motif</div>{{ item.reason }}
          </div>
        </template>

        <template v-else-if="scope === 'missions'">
          <div class="grid grid-cols-2 gap-2 text-[12px]">
            <div><div class="text-muted-foreground text-[11px]">Destination</div>{{ item.destination }}</div>
            <div><div class="text-muted-foreground text-[11px]">Durée</div>{{ item.daysCount }}j</div>
            <div><div class="text-muted-foreground text-[11px]">Départ</div>{{ shortDate(item.departureDate) }}</div>
            <div><div class="text-muted-foreground text-[11px]">Retour</div>{{ shortDate(item.returnDate) }}</div>
          </div>
          <div class="text-[12px]">
            <div class="text-muted-foreground text-[11px]">Total mission (estimé)</div>
            <span class="font-semibold text-primary">{{ fmtNum(item.estimatedTotal ?? 0) }} MGA</span>
          </div>
        </template>

        <template v-else>
          <div class="text-[12px]">
            <div class="text-muted-foreground text-[11px]">Titre</div>{{ item.title }}
          </div>
          <div class="text-[12px]">
            <div class="text-muted-foreground text-[11px]">Total</div>
            <span class="font-semibold text-primary">{{ fmtNum(item.totalAmount) }} {{ item.currency }}</span>
          </div>
        </template>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item)">Ouvrir la fiche</button>
        <AbsenceWorkflowActions v-if="scope === 'absences'" :leave="item" />
        <MissionWorkflowActions v-else-if="scope === 'missions'" :mission="item" />
        <ExpenseWorkflowActions v-else :report="item" />
      </div>
    </template>

    <template #empty>
      <ClipboardCheck class="w-8 h-8" />
      <p class="text-[13px]">{{ scope === 'absences' ? 'Aucune demande d\'absence' : scope === 'missions' ? 'Aucun ordre de mission' : 'Aucune note de frais' }}</p>
    </template>

    <AbsenceCard v-if="scope === 'absences' && openAbsenceId !== null" :leaves="(filtered as LeaveRequest[])" :request-id="openAbsenceId" @close="openAbsenceId = null" />
    <MissionCard v-if="scope === 'missions' && openMissionId !== null" :missions="(filtered as unknown as MissionOrder[])" :mission-id="openMissionId" @close="openMissionId = null" />
    <ExpenseCard v-if="scope === 'expenses' && openExpenseId !== null" :reports="(filtered as unknown as ExpenseReport[])" :report-id="openExpenseId" @close="openExpenseId = null" />
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
import ExpenseCard from '../../components/expenses/ExpenseCard.vue'
import ExpenseWorkflowActions from '../../components/expenses/ExpenseWorkflowActions.vue'
import { formatDate } from '../../lib/date'
import * as L from '../../lib/listClasses'
import { useLeaveRequestStore } from '../../stores/leaveRequests'
import { useMissionStore } from '../../stores/missions'
import { useExpenseStore } from '../../stores/expenses'
import type { LeaveRequest, MissionOrder, ExpenseReport } from '../../types'

const leaveStore = useLeaveRequestStore()
const missionStore = useMissionStore()
const expenseStore = useExpenseStore()

if (leaveStore.pendingForMe.length === 0) leaveStore.fetchPendingForMe()
if (missionStore.pendingForMe.length === 0) missionStore.fetchPendingForMe()
if (expenseStore.pendingForMe.length === 0) expenseStore.fetchPendingForMe()

const scope = ref<'absences' | 'missions' | 'expenses'>('absences')
const scopeOptions = [
  { value: 'absences', label: 'Absences' },
  { value: 'missions', label: 'Missions' },
  { value: 'expenses', label: 'Notes de frais' },
]

const openAbsenceId = ref<string | null>(null)
const openMissionId = ref<string | null>(null)
const openExpenseId = ref<string | null>(null)
function openCard(item: LeaveRequest | MissionOrder | ExpenseReport) {
  if (scope.value === 'absences') openAbsenceId.value = (item as LeaveRequest).id
  else if (scope.value === 'missions') openMissionId.value = (item as MissionOrder).id
  else openExpenseId.value = (item as ExpenseReport).id
}

function shortDate(iso: string): string { return iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—' }
function fmtNum(n: number) { return n.toLocaleString('fr-FR') }

const absenceColumns: ListColumn[] = [
  { key: 'employeeName', label: 'Employé', hideable: false, width: 220 },
  { key: 'type', label: 'Type', width: 160 },
  { key: 'dates', label: 'Dates', width: 200 },
  { key: 'workingDays', label: 'Jours', align: 'center', width: 90 },
  { key: 'createdAt', label: 'Soumis le', width: 120 },
  { key: 'status', label: 'Statut', width: 130 },
]
const missionColumns: ListColumn[] = [
  { key: 'referenceCode', label: 'Code', hideable: false, width: 130 },
  { key: 'employeeName', label: 'Employé', width: 200 },
  { key: 'destination', label: 'Destination', width: 170 },
  { key: 'missionDates', label: 'Dates', width: 170 },
  { key: 'estimatedTotal', label: 'Total', align: 'right', width: 150 },
  { key: 'status', label: 'Statut', width: 130 },
]
const expenseColumns: ListColumn[] = [
  { key: 'referenceCode', label: 'Code', hideable: false, width: 130 },
  { key: 'employeeName', label: 'Employé', width: 200 },
  { key: 'title', label: 'Titre', width: 200 },
  { key: 'totalAmount', label: 'Total', align: 'right', width: 150 },
  { key: 'status', label: 'Statut', width: 130 },
]
const columns = computed(() => scope.value === 'absences' ? absenceColumns : scope.value === 'missions' ? missionColumns : expenseColumns)

const searchQuery = ref('')
const page = ref(1)
const pageSize = ref(10)
watch([scope, searchQuery, pageSize], () => { page.value = 1 })

const pendingAbsences = computed(() => leaveStore.pendingForMe)
const pendingMissions = computed(() => missionStore.pendingForMe)
const pendingExpenses = computed(() => expenseStore.pendingForMe)

const filtered = computed<(LeaveRequest | MissionOrder | ExpenseReport)[]>(() => {
  if (scope.value === 'absences') {
    let rows = pendingAbsences.value
    if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); rows = rows.filter(l => l.employeeName.toLowerCase().includes(q) || l.leaveTypeName.toLowerCase().includes(q)) }
    return rows
  }
  if (scope.value === 'missions') {
    let rows = pendingMissions.value
    if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); rows = rows.filter(m => m.referenceCode.toLowerCase().includes(q) || m.employeeName.toLowerCase().includes(q) || m.destination.toLowerCase().includes(q)) }
    return rows
  }
  let rows = pendingExpenses.value
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); rows = rows.filter(r => r.referenceCode.toLowerCase().includes(q) || r.employeeName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)) }
  return rows
})

const totalCount = computed(() => filtered.value.length)
// items typés any[] : la vue mixe légitimement trois types (absences /
// missions / notes de frais) selon le scope ; les slots #cell-* lisent les
// champs propres à chaque type.
/* eslint-disable @typescript-eslint/no-explicit-any */
const pageItems = computed<any[]>(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
</script>
