<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <!-- ── En-tête ── -->
        <div class="flex items-start justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 class="text-xl font-bold text-foreground">{{ isRh ? 'Gestion des missions' : 'Mes missions' }}</h1>
            <p class="text-[13px] text-muted-foreground mt-0.5">
              {{ isRh ? 'Toutes les ordres de mission' : 'Vos ordres de mission' }}
            </p>
          </div>
          <button :class="L.btnPrimary" @click="openCreate">
            <Plus class="w-4 h-4" /> Nouvelle mission
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
            <select v-model="filterStatus" class="h-[34px] px-2.5 border border-border rounded-md bg-card text-[13px] text-foreground outline-none focus:border-primary">
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
            <span class="font-mono text-xs font-semibold text-primary">{{ row.code }}</span>
          </template>

          <template #cell-employeeName="{ row }" v-if="isRh">
            <div class="flex items-center gap-2">
              <UserAvatar :name="row.employeeName" size="sm" />
              <span>{{ row.employeeName }}</span>
            </div>
          </template>

          <template #cell-dates="{ row }">
            <div class="flex items-center gap-1 text-xs">
              <span>{{ shortDate(row.departureDate) }}</span>
              <span class="text-muted-foreground">→</span>
              <span>{{ shortDate(row.returnDate) }}</span>
            </div>
          </template>

          <template #cell-numberOfDays="{ row }">
            <span class="bg-info-bg text-info text-[11px] font-semibold px-2 py-0.5 rounded-full">{{ row.numberOfDays }}j</span>
          </template>

          <template #cell-totalMission="{ row }">
            <span class="text-xs font-semibold text-foreground whitespace-nowrap">{{ fmtNum(row.totalMission) }} MGA</span>
          </template>

          <template #cell-status="{ row }">
            <StatusPill :status="row.status" />
          </template>

          <template #cell-actions="{ row }">
            <div class="flex gap-1 flex-wrap">
              <button :class="actView" @click="openDetail(row.id)">
                <Eye class="w-3.5 h-3.5" /> Voir
              </button>
              <template v-if="isRh && row.status === 'pending'">
                <button :class="L.actApprove" @click="approve(row.id)">
                  <Check class="w-3.5 h-3.5" /> Approuver
                </button>
                <button :class="L.actReject" @click="openRejectModal(row.id)">
                  <X class="w-3.5 h-3.5" /> Refuser
                </button>
              </template>
              <template v-if="!isRh">
                <button v-if="row.status === 'draft'" :class="L.actBtn" class="bg-info-bg text-primary" @click="submitMission(row.id)">
                  <Send class="w-3.5 h-3.5" /> Soumettre
                </button>
                <button v-if="row.status === 'draft' || row.status === 'returned'" :class="L.actReject" @click="cancelMission(row.id)">
                  <Trash2 class="w-3.5 h-3.5" />
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
  <ModalShell :open="rejectModal.open" title="Refuser la mission" max-width="max-w-[440px]" @close="rejectModal.open = false">
    <div :class="cls.field">
      <span :class="cls.fieldLabel">Motif de refus *</span>
      <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" rows="4" placeholder="Indiquez le motif du refus..."></textarea>
      <span v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</span>
    </div>
    <template #footer>
      <button :class="cls.btnOutline" @click="rejectModal.open = false">Annuler</button>
      <button :class="cls.btnDestructive" @click="confirmReject"><X class="w-4 h-4" /> Confirmer le refus</button>
    </template>
  </ModalShell>

  <!-- ── Modal Retour ── -->
  <ModalShell :open="returnModal.open" title="Retourner la mission" max-width="max-w-[440px]" @close="returnModal.open = false">
    <div :class="cls.field">
      <span :class="cls.fieldLabel">Commentaire obligatoire *</span>
      <textarea v-model="returnModal.comment" :class="cls.fieldTextarea" rows="4" placeholder="Expliquez ce qui doit être corrigé..."></textarea>
      <span v-if="returnModal.error" :class="cls.fieldError">{{ returnModal.error }}</span>
    </div>
    <template #footer>
      <button :class="cls.btnOutline" @click="returnModal.open = false">Annuler</button>
      <button :class="cls.btnInfo" @click="confirmReturn"><Undo2 class="w-4 h-4" /> Retourner</button>
    </template>
  </ModalShell>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute }         from 'vue-router'
import { Plus, Eye, Check, X, Send, Trash2, Undo2 } from 'lucide-vue-next'
import AppTopNav            from '../../components/AppTopNav.vue'
import AppSidebar           from '../../components/AppSidebar.vue'
import DataTable            from '../../components/ui/DataTable.vue'
import UserAvatar           from '../../components/ui/UserAvatar.vue'
import StatusPill           from '../../components/ui/StatusPill.vue'
import MissionFormModal     from '../../components/missions/MissionFormModal.vue'
import MissionDetailModal   from '../../components/missions/MissionDetailModal.vue'
import ModalShell           from '../../components/ui/ModalShell.vue'
import * as cls             from '../../lib/formClasses'
import * as L               from '../../lib/listClasses'
import { useAuthStore }     from '../../stores/auth'
import { useMissionStore }  from '../../stores/missions'
import type { MissionStatus } from '../../types'

const auth         = useAuthStore()
const missionStore = useMissionStore()
const route        = useRoute()

const actView = L.actBtn + ' bg-background text-muted-foreground border border-border hover:bg-border'

const isRh = computed(() =>
  route.path.startsWith('/hr') ||
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
