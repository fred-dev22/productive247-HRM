<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- ── En-tête ── -->
        <div class="page-header">
          <div>
            <h1 class="page-title">{{ isRh ? 'Gestion des missions' : 'Mes missions' }}</h1>
            <p class="page-sub">
              {{ isRh ? 'Toutes les ordres de mission' : 'Vos ordres de mission' }}
            </p>
          </div>
          <button class="btn btn-primary" @click="openCreate">
            <i class="ti ti-plus" aria-hidden="true"></i> Nouvelle mission
          </button>
        </div>

        <!-- ── DataTable ── -->
        <DataTable
          :columns="columns"
          :rows="displayedRows"
          empty-message="Aucune mission trouvée"
          row-key="id"
        >
          <template #filters>
            <select v-model="filterStatus" class="filter-select">
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvée</option>
              <option value="rejected">Refusée</option>
              <option value="returned">Retournée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </template>

          <template #cell-code="{ row }">
            <span class="mission-code">{{ row.code }}</span>
          </template>

          <template #cell-employeeName="{ row }" v-if="isRh">
            <div class="emp-cell">
              <UserAvatar :name="row.employeeName" size="sm" />
              <span>{{ row.employeeName }}</span>
            </div>
          </template>

          <template #cell-dates="{ row }">
            <div class="date-cell">
              <span>{{ shortDate(row.departureDate) }}</span>
              <span class="date-arrow">→</span>
              <span>{{ shortDate(row.returnDate) }}</span>
            </div>
          </template>

          <template #cell-numberOfDays="{ row }">
            <span class="days-badge">{{ row.numberOfDays }}j</span>
          </template>

          <template #cell-totalMission="{ row }">
            <span class="amount-cell">{{ fmtNum(row.totalMission) }} MGA</span>
          </template>

          <template #cell-status="{ row }">
            <StatusPill :status="row.status" />
          </template>

          <template #cell-actions="{ row }">
            <div class="actions-cell">
              <button class="act-btn act-view" @click="openDetail(row.id)">
                <i class="ti ti-eye" aria-hidden="true"></i> Voir
              </button>
              <template v-if="isRh && row.status === 'pending'">
                <button class="act-btn act-approve" @click="approve(row.id)">
                  <i class="ti ti-check" aria-hidden="true"></i> Approuver
                </button>
                <button class="act-btn act-reject" @click="openRejectModal(row.id)">
                  <i class="ti ti-x" aria-hidden="true"></i> Refuser
                </button>
              </template>
              <template v-if="!isRh">
                <button
                  v-if="row.status === 'draft'"
                  class="act-btn act-submit"
                  @click="submitMission(row.id)"
                >
                  <i class="ti ti-send" aria-hidden="true"></i> Soumettre
                </button>
                <button
                  v-if="row.status === 'draft' || row.status === 'returned'"
                  class="act-btn act-cancel"
                  @click="cancelMission(row.id)"
                >
                  <i class="ti ti-trash" aria-hidden="true"></i>
                </button>
              </template>
            </div>
          </template>
        </DataTable>

      </main>
    </div>
  </div>

  <!-- ── Modal Nouvelle mission ── -->
  <MissionFormModal
    v-model="formOpen"
    :mode="isRh ? 'for-employee' : 'self'"
    @submitted="formOpen = false"
    @drafted="formOpen = false"
  />

  <!-- ── Modal Détail ── -->
  <MissionDetailModal
    v-model="detailOpen"
    :mission-id="selectedId"
    :show-actions="isRh"
    @approve="approve"
    @reject="openRejectModal"
    @return="openReturnModal"
    @submit="submitMission"
  />

  <!-- ── Modal Refus ── -->
  <Teleport to="body">
    <div v-if="rejectModal.open" class="modal-overlay" @click.self="rejectModal.open = false">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Refuser la mission</span>
          <button class="modal-close-btn" @click="rejectModal.open = false">
            <i class="ti ti-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Motif de refus *</span>
            <textarea v-model="rejectModal.reason" class="field-textarea" rows="4"
              placeholder="Indiquez le motif du refus..."></textarea>
            <span v-if="rejectModal.error" class="field-error">{{ rejectModal.error }}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="rejectModal.open = false">Annuler</button>
          <button class="btn btn-danger" @click="confirmReject">
            <i class="ti ti-x" aria-hidden="true"></i> Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Modal Retour ── -->
  <Teleport to="body">
    <div v-if="returnModal.open" class="modal-overlay" @click.self="returnModal.open = false">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Retourner la mission</span>
          <button class="modal-close-btn" @click="returnModal.open = false">
            <i class="ti ti-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Commentaire obligatoire *</span>
            <textarea v-model="returnModal.comment" class="field-textarea" rows="4"
              placeholder="Expliquez ce qui doit être corrigé..."></textarea>
            <span v-if="returnModal.error" class="field-error">{{ returnModal.error }}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="returnModal.open = false">Annuler</button>
          <button class="btn btn-return" @click="confirmReturn">
            <i class="ti ti-arrow-back-up" aria-hidden="true"></i> Retourner
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute }         from 'vue-router'
import AppTopNav            from '../../components/AppTopNav.vue'
import AppSidebar           from '../../components/AppSidebar.vue'
import DataTable            from '../../components/ui/DataTable.vue'
import UserAvatar           from '../../components/ui/UserAvatar.vue'
import StatusPill           from '../../components/ui/StatusPill.vue'
import MissionFormModal     from '../../components/missions/MissionFormModal.vue'
import MissionDetailModal   from '../../components/missions/MissionDetailModal.vue'
import { useAuthStore }     from '../../stores/auth'
import { useMissionStore }  from '../../stores/missions'
import type { MissionStatus } from '../../types'

const auth         = useAuthStore()
const missionStore = useMissionStore()
const route        = useRoute()

const isRh = computed(() =>
  route.path.startsWith('/rh') ||
  auth.user?.role === 'hr_admin' ||
  auth.user?.role === 'hr_director'
)

const filterStatus = ref<MissionStatus | ''>('')
const formOpen     = ref(false)
const detailOpen   = ref(false)
const selectedId   = ref('')

const baseColumns = [
  { key: 'code',          label: 'Code',        sortable: true  },
  { key: 'destination',   label: 'Destination',  sortable: true  },
  { key: 'dates',         label: 'Dates',        sortable: false },
  { key: 'numberOfDays',  label: 'Jours',        sortable: false },
  { key: 'totalMission',  label: 'Total',        sortable: true  },
  { key: 'status',        label: 'Statut',       sortable: false },
  { key: 'actions',       label: 'Actions',      sortable: false },
]

const rhColumns = [
  { key: 'code',          label: 'Code',        sortable: true  },
  { key: 'employeeName',  label: 'Employé',      sortable: true  },
  { key: 'destination',   label: 'Destination',  sortable: true  },
  { key: 'dates',         label: 'Dates',        sortable: false },
  { key: 'numberOfDays',  label: 'Jours',        sortable: false },
  { key: 'totalMission',  label: 'Total',        sortable: true  },
  { key: 'status',        label: 'Statut',       sortable: false },
  { key: 'actions',       label: 'Actions',      sortable: false },
]

const columns = computed(() => isRh.value ? rhColumns : baseColumns)

const displayedRows = computed(() => {
  let rows = isRh.value
    ? missionStore.missions
    : missionStore.missions.filter(m => m.employeeId === auth.user?.id)
  if (filterStatus.value) rows = rows.filter(m => m.status === filterStatus.value)
  return rows
})

function shortDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtNum(n: number): string { return n.toLocaleString('fr-FR') }

function openCreate() { formOpen.value = true }
function openDetail(id: string) { selectedId.value = id; detailOpen.value = true }

function approve(id: string) { missionStore.approveMission(id) }
function submitMission(id: string) { missionStore.submitMission(id) }
function cancelMission(id: string) { missionStore.cancelMission(id) }

// ── Modal Refus ────────────────────────────────────────────────
const rejectModal = reactive({ open: false, id: '', reason: '', error: '' })
function openRejectModal(id: string) {
  Object.assign(rejectModal, { open: true, id, reason: '', error: '' })
  detailOpen.value = false
}
function confirmReject() {
  if (!rejectModal.reason.trim()) { rejectModal.error = 'Le motif est obligatoire'; return }
  missionStore.rejectMission(rejectModal.id, rejectModal.reason.trim())
  rejectModal.open = false
}

// ── Modal Retour ───────────────────────────────────────────────
const returnModal = reactive({ open: false, id: '', comment: '', error: '' })
function openReturnModal(id: string) {
  Object.assign(returnModal, { open: true, id, comment: '', error: '' })
  detailOpen.value = false
}
function confirmReturn() {
  if (!returnModal.comment.trim() || returnModal.comment.trim().length < 10) {
    returnModal.error = 'Le commentaire doit comporter au moins 10 caractères'
    return
  }
  missionStore.returnMission(returnModal.id, returnModal.comment.trim())
  returnModal.open = false
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
.page-title  { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub    { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }

.btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; white-space: nowrap; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
.btn-danger  { background: var(--color-danger); color: #fff; }
.btn-danger:hover { opacity: .88; }
.btn-return  { background: var(--color-info-bg); color: var(--color-info); border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.btn-return:hover { background: var(--color-info); color: #fff; }

.filter-select { height: 34px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none; }

.mission-code { font-family: monospace; font-size: 12px; font-weight: 600; color: var(--color-primary); }
.emp-cell     { display: flex; align-items: center; gap: 8px; }
.date-cell    { display: flex; align-items: center; gap: 4px; font-size: 12px; }
.date-arrow   { color: var(--color-text-muted); }
.days-badge   { background: var(--color-info-bg); color: var(--color-info); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.amount-cell  { font-size: 12px; font-weight: 600; color: var(--color-text); white-space: nowrap; }

.actions-cell { display: flex; gap: 4px; flex-wrap: wrap; }
.act-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 5px; font-size: 11px; font-weight: 500; cursor: pointer; border: none; transition: all .12s; white-space: nowrap; }
.act-view    { background: var(--color-bg); color: var(--color-text-muted); border: 0.5px solid var(--color-border); }
.act-view:hover    { background: var(--color-border); }
.act-approve { background: var(--color-success-bg); color: var(--color-success); }
.act-approve:hover { background: var(--color-success); color: #fff; }
.act-reject  { background: var(--color-danger-bg); color: var(--color-danger); }
.act-reject:hover  { background: var(--color-danger); color: #fff; }
.act-submit  { background: var(--color-primary-bg, var(--color-info-bg)); color: var(--color-primary); }
.act-submit:hover  { background: var(--color-primary); color: #fff; }
.act-cancel  { background: var(--color-danger-bg); color: var(--color-danger); }
.act-cancel:hover  { background: var(--color-danger); color: #fff; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card    { background: var(--color-surface); border-radius: 12px; padding: 24px; max-width: 440px; width: 95%; box-shadow: 0 8px 32px rgba(0,0,0,.16); }
.modal-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.modal-title   { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-close-btn { width: 28px; height: 28px; border: none; background: var(--color-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px; }
.modal-close-btn:hover { background: var(--color-border); }
.modal-body    { display: flex; flex-direction: column; gap: 14px; }
.modal-footer  { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 0.5px solid var(--color-border); }

.field         { display: flex; flex-direction: column; gap: 4px; }
.field-label   { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-textarea { padding: 8px 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none; resize: vertical; font-family: inherit; width: 100%; box-sizing: border-box; }
.field-textarea:focus { border-color: var(--color-primary); }
.field-error   { font-size: 11px; color: var(--color-danger); }

@media (max-width: 768px) {
  .content { padding: 16px; }
  .modal-card { width: 95%; padding: 18px; }
}
</style>
