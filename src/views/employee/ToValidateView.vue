<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <!-- ── En-tête ── -->
        <div class="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 class="text-xl font-bold text-foreground">Demandes à valider</h1>
            <p class="text-[13px] text-muted-foreground mt-0.5">Demandes en attente de votre validation</p>
          </div>
          <span v-if="totalPending > 0" class="bg-warning-bg text-warning text-xs font-semibold px-3 py-1 rounded-full">{{ totalPending }} en attente</span>
        </div>

        <!-- ── Tabs ── -->
        <div class="flex gap-1 mb-4 border-b border-border">
          <button :class="[tabBtn, activeTab === 'absences' && tabActive]" @click="activeTab = 'absences'">
            <CalendarOff class="w-4 h-4" />
            Absences
            <span v-if="pendingAbsences.length > 0" :class="tabBadge">{{ pendingAbsences.length }}</span>
          </button>
          <button :class="[tabBtn, activeTab === 'missions' && tabActive]" @click="activeTab = 'missions'">
            <Plane class="w-4 h-4" />
            Missions
            <span v-if="pendingMissions.length > 0" :class="tabBadge">{{ pendingMissions.length }}</span>
          </button>
        </div>

        <!-- ── Tab Absences ── -->
        <template v-if="activeTab === 'absences'">
          <DataTable
            :columns="absenceColumns"
            :rows="displayedAbsences"
            empty-message="Aucune demande d'absence en attente"
            row-key="id"
          >
            <template #filters>
              <select v-model="filterType" class="h-[34px] px-2.5 border border-border rounded-md bg-card text-[13px] text-foreground outline-none focus:border-primary">
                <option value="">Tous les types</option>
                <option v-for="lt in LEAVE_TYPES" :key="lt" :value="lt">{{ lt }}</option>
              </select>
            </template>

            <template #cell-employeeName="{ row }">
              <div class="flex items-center gap-2">
                <UserAvatar :name="row.employeeName" size="sm" />
                <span>{{ row.employeeName }}</span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <StatusPill :status="row.status" />
            </template>

            <template #cell-actions="{ row }">
              <div class="flex gap-1 flex-wrap">
                <button v-if="row.status === 'pending'" :class="L.actApprove" @click="approveAbsence(row.id)">
                  <Check class="w-3.5 h-3.5" /> Approuver
                </button>
                <button v-if="row.status === 'pending'" :class="L.actReturn" @click="openReturnModal(row)">
                  <Undo2 class="w-3.5 h-3.5" /> Retourner
                </button>
                <button v-if="row.status === 'pending'" :class="L.actReject" @click="openRejectModal(row)">
                  <X class="w-3.5 h-3.5" /> Refuser
                </button>
                <button :class="L.actView" @click="toggleAbsenceDetail(row.id)">
                  {{ expandedAbsence === row.id ? '↑' : 'Voir' }}
                </button>
              </div>
            </template>

            <template #row-after="{ row }">
              <tr v-if="expandedAbsence === row.id">
                <td :colspan="absenceColumns.length" class="p-0">
                  <div class="bg-background border-t border-border p-4 flex flex-col gap-2.5 text-xs">
                    <div class="flex gap-4 text-[11px] text-muted-foreground flex-wrap">
                      <span>Début : {{ row.startDate }}</span>
                      <span>Fin : {{ row.endDate }}</span>
                      <span>{{ row.workingDays }} jour(s)</span>
                      <span>Soumis le {{ row.submittedAt }}</span>
                    </div>
                    <div v-if="row.reason" class="text-muted-foreground"><span class="font-medium text-[11px]">Motif :</span> {{ row.reason }}</div>
                    <div v-if="row.returnComment" class="flex items-center gap-1.5 text-warning bg-warning-bg rounded-md px-2.5 py-1.5">
                      <CornerUpLeft class="w-3.5 h-3.5" />
                      <span class="font-medium text-[11px]">Retour :</span> {{ row.returnComment }}
                    </div>
                    <div v-if="row.validationHistory?.length" class="mt-1">
                      <div class="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.06em] mb-2.5">Historique</div>
                      <ValidationTimeline :history="row.validationHistory" />
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </DataTable>
        </template>

        <!-- ── Tab Missions ── -->
        <template v-else>
          <DataTable
            :columns="missionColumns"
            :rows="displayedMissions"
            empty-message="Aucun ordre de mission en attente"
            row-key="id"
          >
            <template #cell-employeeName="{ row }">
              <div class="flex items-center gap-2">
                <UserAvatar :name="row.employeeName" size="sm" />
                <span>{{ row.employeeName }}</span>
              </div>
            </template>

            <template #cell-dates="{ row }">
              <span class="text-xs whitespace-nowrap">{{ row.departureDate?.slice(0,10) }} → {{ row.returnDate?.slice(0,10) }}</span>
            </template>

            <template #cell-totalMission="{ row }">
              <span class="font-semibold">{{ fmt(row.totalMission) }} {{ row.hotelAllowance > 0 ? 'MGA' : '' }}</span>
            </template>

            <template #cell-status="{ row }">
              <StatusPill :status="row.status" />
            </template>

            <template #cell-actions="{ row }">
              <div class="flex gap-1 flex-wrap">
                <button v-if="row.status === 'pending'" :class="L.actApprove" @click="approveMission(row.id)">
                  <Check class="w-3.5 h-3.5" /> Approuver
                </button>
                <button v-if="row.status === 'pending'" :class="L.actReturn" @click="openMissionReturnModal(row)">
                  <Undo2 class="w-3.5 h-3.5" /> Retourner
                </button>
                <button v-if="row.status === 'pending'" :class="L.actReject" @click="openMissionRejectModal(row)">
                  <X class="w-3.5 h-3.5" /> Refuser
                </button>
              </div>
            </template>
          </DataTable>
        </template>

      </main>
    </div>
  </div>

  <!-- ── Modal Retourner (absence) ── -->
  <ModalShell :open="returnModal.open" :title="`Retourner la demande de ${returnModal.employeeName}`" max-width="max-w-[440px]" @close="closeReturnModal">
    <p class="text-xs text-muted-foreground -mt-2">La demande sera renvoyée à l'employé pour corrections.</p>
    <label :class="cls.field">
      <span :class="cls.fieldLabel">Commentaire *</span>
      <textarea v-model="returnModal.comment" :class="cls.fieldTextarea" rows="4" placeholder="Expliquez ce qui doit être corrigé..."></textarea>
      <span v-if="returnModal.error" :class="cls.fieldError">{{ returnModal.error }}</span>
    </label>
    <template #footer>
      <button :class="cls.btnOutline" @click="closeReturnModal">Annuler</button>
      <button :class="cls.btnPrimary" @click="confirmReturn"><Undo2 class="w-4 h-4" /> Retourner</button>
    </template>
  </ModalShell>

  <!-- ── Modal Refuser (absence) ── -->
  <ModalShell :open="rejectModal.open" :title="`Refuser la demande de ${rejectModal.employeeName}`" max-width="max-w-[440px]" @close="closeRejectModal">
    <label :class="cls.field">
      <span :class="cls.fieldLabel">Motif *</span>
      <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" rows="4" placeholder="Indiquez le motif du refus..."></textarea>
      <span v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</span>
    </label>
    <template #footer>
      <button :class="cls.btnOutline" @click="closeRejectModal">Annuler</button>
      <button :class="cls.btnDestructive" @click="confirmReject"><X class="w-4 h-4" /> Confirmer le refus</button>
    </template>
  </ModalShell>

  <!-- ── Modal Retourner (mission) ── -->
  <ModalShell :open="missionReturnModal.open" :title="`Retourner la mission de ${missionReturnModal.employeeName}`" max-width="max-w-[440px]" @close="missionReturnModal.open = false">
    <label :class="cls.field">
      <span :class="cls.fieldLabel">Commentaire *</span>
      <textarea v-model="missionReturnModal.comment" :class="cls.fieldTextarea" rows="4" placeholder="Expliquez les corrections requises..."></textarea>
      <span v-if="missionReturnModal.error" :class="cls.fieldError">{{ missionReturnModal.error }}</span>
    </label>
    <template #footer>
      <button :class="cls.btnOutline" @click="missionReturnModal.open = false">Annuler</button>
      <button :class="cls.btnPrimary" @click="confirmMissionReturn"><Undo2 class="w-4 h-4" /> Retourner</button>
    </template>
  </ModalShell>

  <!-- ── Modal Refuser (mission) ── -->
  <ModalShell :open="missionRejectModal.open" :title="`Refuser la mission de ${missionRejectModal.employeeName}`" max-width="max-w-[440px]" @close="missionRejectModal.open = false">
    <label :class="cls.field">
      <span :class="cls.fieldLabel">Motif *</span>
      <textarea v-model="missionRejectModal.reason" :class="cls.fieldTextarea" rows="4" placeholder="Indiquez le motif du refus..."></textarea>
      <span v-if="missionRejectModal.error" :class="cls.fieldError">{{ missionRejectModal.error }}</span>
    </label>
    <template #footer>
      <button :class="cls.btnOutline" @click="missionRejectModal.open = false">Annuler</button>
      <button :class="cls.btnDestructive" @click="confirmMissionReject"><X class="w-4 h-4" /> Confirmer</button>
    </template>
  </ModalShell>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { CalendarOff, Plane, Check, Undo2, X, CornerUpLeft } from 'lucide-vue-next'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import DataTable          from '../../components/ui/DataTable.vue'
import UserAvatar         from '../../components/ui/UserAvatar.vue'
import StatusPill         from '../../components/ui/StatusPill.vue'
import ValidationTimeline from '../../components/ui/ValidationTimeline.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useAuthStore }    from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import { useMissionStore } from '../../stores/missions'
import type { LeaveRequest, LeaveType, MissionOrder } from '../../types'

const auth         = useAuthStore()
const absenceStore = useAbsenceStore()
const missionStore = useMissionStore()

// ── Classes du design system ─────────────────────────────────
const tabBtn = 'inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-muted-foreground bg-transparent border-0 border-b-2 border-transparent cursor-pointer -mb-px transition-colors hover:text-foreground hover:bg-background'
const tabActive = '!text-primary !border-primary font-semibold'
const tabBadge = 'bg-warning-bg text-warning text-[10px] font-bold px-1.5 py-px rounded-full'

const activeTab = ref<'absences' | 'missions'>('absences')

const LEAVE_TYPES: LeaveType[] = [
  'Congé annuel', 'Congé maladie', 'Congé maternité',
  'Récupération', 'Télétravail', 'Assistance parentale', 'Permission exceptionnelle',
]

// ── Absences ───────────────────────────────────────────────────
const filterType     = ref<LeaveType | ''>('')
const expandedAbsence = ref<number | null>(null)
function toggleAbsenceDetail(id: number) { expandedAbsence.value = expandedAbsence.value === id ? null : id }

const absenceColumns = [
  { key: 'employeeName', label: 'Employé',    sortable: true },
  { key: 'type',         label: 'Type',        sortable: true },
  { key: 'startDate',    label: 'Début',        sortable: true },
  { key: 'endDate',      label: 'Fin',          sortable: false },
  { key: 'workingDays',  label: 'Jours',        sortable: false },
  { key: 'submittedAt',  label: 'Soumis le',    sortable: true },
  { key: 'status',       label: 'Statut',       sortable: false },
  { key: 'actions',      label: 'Actions',      sortable: false },
]

const pendingAbsences = computed(() =>
  absenceStore.allLeaves.filter(l => l.status === 'pending')
)

const displayedAbsences = computed(() => {
  let rows = absenceStore.allLeaves.filter(
    l => l.status === 'pending' || l.status === 'returned' || l.status === 'approved' || l.status === 'rejected'
  )
  if (filterType.value) rows = rows.filter(l => l.type === filterType.value)
  return rows
})

function approveAbsence(id: number) { absenceStore.approveLeave(id) }

// ── Missions ───────────────────────────────────────────────────
const missionColumns = [
  { key: 'employeeName',  label: 'Employé',     sortable: true },
  { key: 'destination',   label: 'Destination',  sortable: true },
  { key: 'dates',         label: 'Dates',        sortable: false },
  { key: 'totalMission',  label: 'Total',        sortable: true },
  { key: 'status',        label: 'Statut',       sortable: false },
  { key: 'actions',       label: 'Actions',      sortable: false },
]

const pendingMissions = computed(() =>
  missionStore.missions.filter(m => m.status === 'pending')
)

const displayedMissions = computed(() =>
  missionStore.missions.filter(m =>
    m.status === 'pending' || m.status === 'returned' || m.status === 'approved' || m.status === 'rejected'
  )
)

const totalPending = computed(() => pendingAbsences.value.length + pendingMissions.value.length)

function approveMission(id: string) { missionStore.approveMission(id, 'Approuvé') }

function fmt(n: number) { return n.toLocaleString('fr-FR') }

// ── Modal Retourner (absence) ──────────────────────────────────
const returnModal = reactive({ open: false, id: 0, employeeName: '', comment: '', error: '' })
function openReturnModal(row: LeaveRequest) {
  Object.assign(returnModal, { open: true, id: row.id, employeeName: row.employeeName, comment: '', error: '' })
}
function closeReturnModal() { returnModal.open = false }
function confirmReturn() {
  if (!returnModal.comment.trim() || returnModal.comment.trim().length < 10) {
    returnModal.error = 'Le commentaire doit comporter au moins 10 caractères'; return
  }
  absenceStore.returnLeave(returnModal.id, returnModal.comment.trim())
  closeReturnModal()
}

// ── Modal Refuser (absence) ────────────────────────────────────
const rejectModal = reactive({ open: false, id: 0, employeeName: '', reason: '', error: '' })
function openRejectModal(row: LeaveRequest) {
  Object.assign(rejectModal, { open: true, id: row.id, employeeName: row.employeeName, reason: '', error: '' })
}
function closeRejectModal() { rejectModal.open = false }
function confirmReject() {
  if (!rejectModal.reason.trim()) { rejectModal.error = 'Le motif est obligatoire'; return }
  absenceStore.rejectLeave(rejectModal.id, rejectModal.reason.trim())
  closeRejectModal()
}

// ── Modal Retourner (mission) ──────────────────────────────────
const missionReturnModal = reactive({ open: false, id: '', employeeName: '', comment: '', error: '' })
function openMissionReturnModal(row: MissionOrder) {
  Object.assign(missionReturnModal, { open: true, id: row.id, employeeName: row.employeeName, comment: '', error: '' })
}
function confirmMissionReturn() {
  if (!missionReturnModal.comment.trim() || missionReturnModal.comment.trim().length < 10) {
    missionReturnModal.error = 'Le commentaire doit comporter au moins 10 caractères'; return
  }
  missionStore.returnMission(missionReturnModal.id, missionReturnModal.comment.trim())
  missionReturnModal.open = false
}

// ── Modal Refuser (mission) ────────────────────────────────────
const missionRejectModal = reactive({ open: false, id: '', employeeName: '', reason: '', error: '' })
function openMissionRejectModal(row: MissionOrder) {
  Object.assign(missionRejectModal, { open: true, id: row.id, employeeName: row.employeeName, reason: '', error: '' })
}
function confirmMissionReject() {
  if (!missionRejectModal.reason.trim()) { missionRejectModal.error = 'Le motif est obligatoire'; return }
  missionStore.rejectMission(missionRejectModal.id, missionRejectModal.reason.trim())
  missionRejectModal.open = false
}
</script>
