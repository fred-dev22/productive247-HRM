<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- ── En-tête ── -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Demandes à valider</h1>
            <p class="page-sub">Demandes en attente de votre validation</p>
          </div>
          <span v-if="totalPending > 0" class="count-badge">{{ totalPending }} en attente</span>
        </div>

        <!-- ── Tabs ── -->
        <div class="tabs-bar">
          <button class="tab-btn" :class="{ active: activeTab === 'absences' }" @click="activeTab = 'absences'">
            <i class="ti ti-calendar-off"></i>
            Absences
            <span v-if="pendingAbsences.length > 0" class="tab-badge">{{ pendingAbsences.length }}</span>
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'missions' }" @click="activeTab = 'missions'">
            <i class="ti ti-plane"></i>
            Missions
            <span v-if="pendingMissions.length > 0" class="tab-badge">{{ pendingMissions.length }}</span>
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
              <select v-model="filterType" class="filter-select">
                <option value="">Tous les types</option>
                <option v-for="lt in LEAVE_TYPES" :key="lt" :value="lt">{{ lt }}</option>
              </select>
            </template>

            <template #cell-employeeName="{ row }">
              <div class="emp-cell">
                <UserAvatar :name="row.employeeName" size="sm" />
                <span>{{ row.employeeName }}</span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <StatusPill :status="row.status" />
            </template>

            <template #cell-actions="{ row }">
              <div class="actions-cell">
                <button v-if="row.status === 'pending'" class="act-btn act-approve" @click="approveAbsence(row.id)">
                  <i class="ti ti-check"></i> Approuver
                </button>
                <button v-if="row.status === 'pending'" class="act-btn act-return" @click="openReturnModal(row)">
                  <i class="ti ti-arrow-back-up"></i> Retourner
                </button>
                <button v-if="row.status === 'pending'" class="act-btn act-reject" @click="openRejectModal(row)">
                  <i class="ti ti-x"></i> Refuser
                </button>
                <button class="act-btn act-view" @click="toggleAbsenceDetail(row.id)">
                  {{ expandedAbsence === row.id ? '↑' : 'Voir' }}
                </button>
              </div>
            </template>

            <template #row-after="{ row }">
              <tr v-if="expandedAbsence === row.id" class="detail-row">
                <td :colspan="absenceColumns.length">
                  <div class="detail-panel">
                    <div class="detail-meta">
                      <span>Début : {{ row.startDate }}</span>
                      <span>Fin : {{ row.endDate }}</span>
                      <span>{{ row.workingDays }} jour(s)</span>
                      <span>Soumis le {{ row.submittedAt }}</span>
                    </div>
                    <div v-if="row.reason" class="detail-reason"><span class="detail-label">Motif :</span> {{ row.reason }}</div>
                    <div v-if="row.returnComment" class="return-comment">
                      <i class="ti ti-arrow-back"></i>
                      <span class="detail-label">Retour :</span> {{ row.returnComment }}
                    </div>
                    <div v-if="row.validationHistory?.length" class="timeline-section">
                      <div class="timeline-title">Historique</div>
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
              <div class="emp-cell">
                <UserAvatar :name="row.employeeName" size="sm" />
                <span>{{ row.employeeName }}</span>
              </div>
            </template>

            <template #cell-dates="{ row }">
              <span class="date-range">{{ row.departureDate?.slice(0,10) }} → {{ row.returnDate?.slice(0,10) }}</span>
            </template>

            <template #cell-totalMission="{ row }">
              <span class="amount">{{ fmt(row.totalMission) }} {{ row.hotelAllowance > 0 ? 'MGA' : '' }}</span>
            </template>

            <template #cell-status="{ row }">
              <StatusPill :status="row.status" />
            </template>

            <template #cell-actions="{ row }">
              <div class="actions-cell">
                <button v-if="row.status === 'pending'" class="act-btn act-approve" @click="approveMission(row.id)">
                  <i class="ti ti-check"></i> Approuver
                </button>
                <button v-if="row.status === 'pending'" class="act-btn act-return" @click="openMissionReturnModal(row)">
                  <i class="ti ti-arrow-back-up"></i> Retourner
                </button>
                <button v-if="row.status === 'pending'" class="act-btn act-reject" @click="openMissionRejectModal(row)">
                  <i class="ti ti-x"></i> Refuser
                </button>
              </div>
            </template>
          </DataTable>
        </template>

      </main>
    </div>
  </div>

  <!-- ── Modal Retourner (absence) ── -->
  <Teleport to="body">
    <div v-if="returnModal.open" class="modal-overlay" @click.self="closeReturnModal">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Retourner la demande de {{ returnModal.employeeName }}</span>
          <button class="modal-close" @click="closeReturnModal"><i class="ti ti-x"></i></button>
        </div>
        <p class="modal-sub">La demande sera renvoyée à l'employé pour corrections.</p>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Commentaire *</span>
            <textarea v-model="returnModal.comment" class="field-textarea" rows="4" placeholder="Expliquez ce qui doit être corrigé..."></textarea>
            <span v-if="returnModal.error" class="field-error">{{ returnModal.error }}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeReturnModal">Annuler</button>
          <button class="btn btn-primary" @click="confirmReturn">
            <i class="ti ti-arrow-back-up"></i> Retourner
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Modal Refuser (absence) ── -->
  <Teleport to="body">
    <div v-if="rejectModal.open" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Refuser la demande de {{ rejectModal.employeeName }}</span>
          <button class="modal-close" @click="closeRejectModal"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Motif *</span>
            <textarea v-model="rejectModal.reason" class="field-textarea" rows="4" placeholder="Indiquez le motif du refus..."></textarea>
            <span v-if="rejectModal.error" class="field-error">{{ rejectModal.error }}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeRejectModal">Annuler</button>
          <button class="btn btn-danger" @click="confirmReject"><i class="ti ti-x"></i> Confirmer le refus</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Modal Retourner (mission) ── -->
  <Teleport to="body">
    <div v-if="missionReturnModal.open" class="modal-overlay" @click.self="missionReturnModal.open = false">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Retourner la mission de {{ missionReturnModal.employeeName }}</span>
          <button class="modal-close" @click="missionReturnModal.open = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Commentaire *</span>
            <textarea v-model="missionReturnModal.comment" class="field-textarea" rows="4" placeholder="Expliquez les corrections requises..."></textarea>
            <span v-if="missionReturnModal.error" class="field-error">{{ missionReturnModal.error }}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="missionReturnModal.open = false">Annuler</button>
          <button class="btn btn-primary" @click="confirmMissionReturn"><i class="ti ti-arrow-back-up"></i> Retourner</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Modal Refuser (mission) ── -->
  <Teleport to="body">
    <div v-if="missionRejectModal.open" class="modal-overlay" @click.self="missionRejectModal.open = false">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Refuser la mission de {{ missionRejectModal.employeeName }}</span>
          <button class="modal-close" @click="missionRejectModal.open = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Motif *</span>
            <textarea v-model="missionRejectModal.reason" class="field-textarea" rows="4" placeholder="Indiquez le motif du refus..."></textarea>
            <span v-if="missionRejectModal.error" class="field-error">{{ missionRejectModal.error }}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="missionRejectModal.open = false">Annuler</button>
          <button class="btn btn-danger" @click="confirmMissionReject"><i class="ti ti-x"></i> Confirmer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import DataTable          from '../../components/ui/DataTable.vue'
import UserAvatar         from '../../components/ui/UserAvatar.vue'
import StatusPill         from '../../components/ui/StatusPill.vue'
import ValidationTimeline from '../../components/ui/ValidationTimeline.vue'
import { useAuthStore }    from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import { useMissionStore } from '../../stores/missions'
import type { LeaveRequest, LeaveType, MissionOrder } from '../../types'

const auth         = useAuthStore()
const absenceStore = useAbsenceStore()
const missionStore = useMissionStore()

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

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.page-title  { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub    { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.count-badge { background: var(--color-warning-bg); color: var(--color-warning); font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }

.tabs-bar { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border); }
.tab-btn  { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 500; color: var(--color-text-muted); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; margin-bottom: -1px; transition: all .15s; }
.tab-btn:hover { color: var(--color-text); background: var(--color-bg); }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
.tab-badge { background: var(--color-warning-bg); color: var(--color-warning); font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; }

.filter-select { height: 34px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none; }

.emp-cell { display: flex; align-items: center; gap: 8px; }
.date-range { font-size: 12px; white-space: nowrap; }
.amount { font-weight: 600; }

.actions-cell { display: flex; gap: 4px; flex-wrap: wrap; }
.act-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 5px; font-size: 11px; font-weight: 500; cursor: pointer; border: none; transition: all .12s; white-space: nowrap; }
.act-approve { background: var(--color-success-bg); color: var(--color-success); }
.act-approve:hover { background: var(--color-success); color: #fff; }
.act-return  { background: var(--color-info-bg); color: var(--color-info); }
.act-return:hover { background: var(--color-info); color: #fff; }
.act-reject  { background: var(--color-danger-bg); color: var(--color-danger); }
.act-reject:hover { background: var(--color-danger); color: #fff; }
.act-view    { background: var(--color-bg); color: var(--color-text-muted); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card    { background: var(--color-surface); border-radius: 12px; padding: 24px; max-width: 440px; width: 95%; box-shadow: 0 8px 32px rgba(0,0,0,.16); }
.modal-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.modal-title   { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-sub     { font-size: 12px; color: var(--color-text-muted); margin-bottom: 16px; }
.modal-close   { width: 28px; height: 28px; border: none; background: var(--color-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px; }
.modal-body    { display: flex; flex-direction: column; gap: 14px; }
.modal-footer  { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 0.5px solid var(--color-border); }

.field         { display: flex; flex-direction: column; gap: 4px; }
.field-label   { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-textarea { padding: 8px 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none; resize: vertical; font-family: inherit; width: 100%; box-sizing: border-box; }
.field-textarea:focus { border-color: var(--color-primary); }
.field-error   { font-size: 11px; color: var(--color-danger); }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all .12s; white-space: nowrap; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
.btn-danger  { background: var(--color-danger); color: #fff; }

.detail-row td { padding: 0; }
.detail-panel  { background: var(--color-bg); border-top: 0.5px solid var(--color-border); padding: 16px; display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
.detail-label  { font-weight: 500; font-size: 11px; }
.detail-meta   { display: flex; gap: 16px; font-size: 11px; color: var(--color-text-muted); flex-wrap: wrap; }
.detail-reason { color: var(--color-text-muted); }
.return-comment { display: flex; align-items: center; gap: 6px; color: var(--color-warning); background: var(--color-warning-bg); border-radius: 6px; padding: 6px 10px; }
.timeline-section { margin-top: 4px; }
.timeline-title { font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }

@media (max-width: 768px) {
  .content { padding: 16px; }
  .modal-card { width: 95%; padding: 18px; }
}
</style>
