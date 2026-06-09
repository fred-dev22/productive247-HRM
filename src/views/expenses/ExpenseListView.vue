<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <div class="page-header">
          <div>
            <div class="page-title">Notes de frais</div>
            <div class="page-sub">{{ totalCount }} note(s) · {{ pendingCount }} en attente</div>
          </div>
          <div class="header-actions">
            <div class="search-box">
              <i class="ti ti-search search-icon"></i>
              <input v-model="search" type="text" placeholder="Rechercher..." class="search-input" />
            </div>
            <select v-model="filterStatus" class="filter-select">
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvée</option>
              <option value="rejected">Refusée</option>
            </select>
            <button class="btn btn-primary" @click="openCreate">
              <i class="ti ti-plus"></i> Nouvelle note
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-card">
          <table class="table" v-if="pageItems.length > 0">
            <thead>
              <tr>
                <th v-if="isRH">Employé</th>
                <th>Code</th>
                <th>Titre</th>
                <th>Lignes</th>
                <th>Montant total</th>
                <th>Soumis le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="r in pageItems" :key="r.id">
                <tr>
                  <td v-if="isRH">
                    <div class="emp-cell">
                      <UserAvatar :name="r.employeeName" size="sm" />
                      <span>{{ r.employeeName }}</span>
                    </div>
                  </td>
                  <td class="code-cell">{{ r.code }}</td>
                  <td class="title-cell">{{ r.title }}</td>
                  <td class="center">{{ r.lines.length }}</td>
                  <td class="amount-cell">{{ fmt(r.totalAmount) }} {{ r.currency }}</td>
                  <td class="date-cell">{{ r.submittedAt ?? '—' }}</td>
                  <td><StatusPill :status="r.status" /></td>
                  <td>
                    <div class="action-btns">
                      <button class="act-btn act-view" @click="toggleDetail(r.id)">
                        {{ expanded === r.id ? '↑' : 'Voir' }}
                      </button>
                      <button v-if="r.status === 'draft'" class="act-btn act-approve" @click="openEdit(r.id)">
                        <i class="ti ti-edit"></i> Éditer
                      </button>
                      <button v-if="r.status === 'draft'" class="act-btn act-submit" @click="expenseStore.submitReport(r.id)">
                        <i class="ti ti-send"></i> Soumettre
                      </button>
                      <button v-if="isRH && r.status === 'pending'" class="act-btn act-approve" @click="expenseStore.approveReport(r.id)">
                        <i class="ti ti-check"></i> Approuver
                      </button>
                      <button v-if="isRH && r.status === 'pending'" class="act-btn act-reject" @click="openReject(r)">
                        <i class="ti ti-x"></i> Refuser
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Detail expand -->
                <tr v-if="expanded === r.id" class="detail-row">
                  <td :colspan="isRH ? 8 : 7">
                    <div class="detail-panel">
                      <div class="lines-title">Lignes de dépense</div>
                      <table class="lines-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Catégorie</th>
                            <th>Description</th>
                            <th>Montant</th>
                            <th>Justif.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="l in r.lines" :key="l.id">
                            <td>{{ l.date }}</td>
                            <td>{{ CATEGORY_LABELS[l.category] }}</td>
                            <td>{{ l.description }}</td>
                            <td class="amount-cell">{{ fmt(l.amount) }} {{ l.currency }}</td>
                            <td>
                              <span v-if="l.receipt" class="receipt-yes"><i class="ti ti-check"></i></span>
                              <span v-else class="receipt-no"><i class="ti ti-x"></i></span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div v-if="r.rejectionReason" class="rejection">
                        <i class="ti ti-alert-circle"></i> {{ r.rejectionReason }}
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <i class="ti ti-receipt-off"></i>
            <p>Aucune note de frais</p>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <span class="pag-total">{{ totalCount }} résultats</span>
            <div class="pag-perpage">
              Afficher
              <select v-model.number="pageSize" class="pag-size-select">
                <option :value="10">10</option>
                <option :value="25">25</option>
              </select>
            </div>
            <div class="pag-pages">
              <button class="pag-btn pag-arrow" :disabled="page === 1" @click="page--"><i class="ti ti-chevron-left"></i></button>
              <button v-for="p in totalPages" :key="p" class="pag-btn" :class="{ active: p === page }" @click="page = p">{{ p }}</button>
              <button class="pag-btn pag-arrow" :disabled="page === totalPages" @click="page++"><i class="ti ti-chevron-right"></i></button>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- Form modal -->
  <ExpenseFormModal
    v-if="formModal.open"
    v-model="formModal.open"
    :edit-id="formModal.editId"
    @submitted="formModal.open = false"
  />

  <!-- Reject modal -->
  <Teleport to="body">
    <div v-if="rejectModal.open" class="overlay" @click.self="rejectModal.open = false">
      <div class="modal-card">
        <div class="modal-title">Refuser la note {{ rejectModal.code }}</div>
        <label class="modal-label">Motif *</label>
        <textarea v-model="rejectModal.reason" class="modal-textarea" placeholder="Motif du refus..." rows="4"></textarea>
        <div v-if="rejectModal.error" class="modal-error">{{ rejectModal.error }}</div>
        <div class="modal-actions">
          <button class="btn btn-danger" @click="confirmReject"><i class="ti ti-x"></i> Confirmer</button>
          <button class="btn btn-outline" @click="rejectModal.open = false">Annuler</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { AppSidebar, AppTopNav, StatusPill, UserAvatar } from '../../components'
import ExpenseFormModal from '../../components/expenses/ExpenseFormModal.vue'
import { useAuthStore }    from '../../stores/auth'
import { useExpenseStore } from '../../stores/expenses'
import type { ExpenseReport, ExpenseCategory } from '../../types'

const auth         = useAuthStore()
const expenseStore = useExpenseStore()
const route        = useRoute()

const isRH = computed(() => route.path.startsWith('/rh') || auth.user?.role === 'hr_admin' || auth.user?.role === 'hr_director')

const search       = ref('')
const filterStatus = ref('')
const page         = ref(1)
const pageSize     = ref(10)
const expanded     = ref<string | null>(null)

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport:       'Transport',
  hebergement:     'Hébergement',
  repas:           'Repas',
  carburant:       'Carburant',
  fournitures:     'Fournitures',
  communication:   'Communication',
  representation:  'Représentation',
  autre:           'Autre',
}

const filtered = computed(() => {
  let list = isRH.value
    ? expenseStore.reports
    : expenseStore.reports.filter(r => r.employeeId === auth.user?.id)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r => r.title.toLowerCase().includes(q) || r.employeeName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
  }
  if (filterStatus.value) list = list.filter(r => r.status === filterStatus.value)
  return list
})

const totalCount   = computed(() => filtered.value.length)
const pendingCount = computed(() => filtered.value.filter(r => r.status === 'pending').length)
const totalPages   = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pageItems    = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function toggleDetail(id: string) { expanded.value = expanded.value === id ? null : id }
function fmt(n: number) { return n.toLocaleString('fr-FR') }

const formModal = reactive({ open: false, editId: '' })
function openCreate() { formModal.editId = ''; formModal.open = true }
function openEdit(id: string) { formModal.editId = id; formModal.open = true }

const rejectModal = reactive({ open: false, id: '', code: '', reason: '', error: '' })
function openReject(r: ExpenseReport) {
  Object.assign(rejectModal, { open: true, id: r.id, code: r.code, reason: '', error: '' })
}
function confirmReject() {
  if (!rejectModal.reason.trim()) { rejectModal.error = 'Le motif est obligatoire'; return }
  expenseStore.rejectReport(rejectModal.id, rejectModal.reason.trim())
  rejectModal.open = false
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.page-title   { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub     { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-danger  { background: var(--color-danger); color: #fff; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }

.search-box { display: flex; align-items: center; gap: 6px; border: 0.5px solid var(--color-border); border-radius: 6px; padding: 0 8px; height: 34px; background: var(--color-surface); }
.search-icon { color: var(--color-text-muted); font-size: 13px; }
.search-input { border: none; outline: none; font-size: 12px; color: var(--color-text); background: transparent; width: 150px; }
.filter-select { height: 34px; padding: 0 8px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 13px; color: var(--color-text); background: var(--color-surface); outline: none; }

.table-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th { padding: 10px 13px; text-align: left; font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; background: var(--color-bg); border-bottom: 0.5px solid var(--color-border); white-space: nowrap; }
.table td { padding: 10px 13px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text); vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover td { background: var(--color-bg); }

.emp-cell  { display: flex; align-items: center; gap: 8px; }
.code-cell { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
.title-cell { font-weight: 500; }
.amount-cell { font-weight: 600; text-align: right; }
.date-cell { font-size: 12px; color: var(--color-text-muted); }
.center { text-align: center; }

.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.act-btn { padding: 4px 9px; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 3px; }
.act-view    { background: var(--color-bg); color: var(--color-text-muted); }
.act-approve { background: var(--color-success-bg); color: var(--color-success); }
.act-submit  { background: var(--color-info-bg); color: var(--color-info); }
.act-reject  { background: var(--color-danger-bg); color: var(--color-danger); }

/* Detail */
.detail-row td { padding: 0; }
.detail-panel { background: var(--color-bg); padding: 16px; border-top: 0.5px solid var(--color-border); }
.lines-title { font-size: 12px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 10px; }
.lines-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.lines-table th { padding: 6px 10px; text-align: left; font-size: 11px; font-weight: 600; color: var(--color-text-muted); background: var(--color-surface); border-bottom: 0.5px solid var(--color-border); }
.lines-table td { padding: 6px 10px; border-bottom: 0.5px solid var(--color-border); color: var(--color-text); }
.lines-table tbody tr:last-child td { border-bottom: none; }
.receipt-yes { color: var(--color-success); }
.receipt-no  { color: var(--color-neutral); }
.rejection   { margin-top: 10px; color: var(--color-danger); font-size: 12px; display: flex; align-items: center; gap: 6px; }

/* Pagination */
.pagination { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-top: 0.5px solid var(--color-border); font-size: 12px; color: var(--color-text-muted); }
.pag-total  { flex: 1; }
.pag-perpage { display: flex; align-items: center; gap: 6px; }
.pag-size-select { height: 26px; padding: 0 6px; border: 0.5px solid var(--color-border); border-radius: 5px; font-size: 12px; background: var(--color-surface); outline: none; }
.pag-pages { display: flex; gap: 3px; }
.pag-btn { min-width: 28px; height: 28px; padding: 0 6px; border-radius: 5px; font-size: 12px; font-weight: 500; cursor: pointer; border: 0.5px solid var(--color-border); background: var(--color-surface); color: var(--color-text); display: flex; align-items: center; justify-content: center; }
.pag-btn:hover:not(:disabled) { background: var(--color-bg); }
.pag-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.pag-btn:disabled { opacity: .35; cursor: not-allowed; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 8px; color: var(--color-text-muted); }
.empty-state i { font-size: 36px; }

/* Modal */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--color-surface); border-radius: 10px; padding: 24px; width: 420px; max-width: 95vw; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.18); }
.modal-title { font-size: 14px; font-weight: 600; }
.modal-label { font-size: 12px; font-weight: 500; }
.modal-textarea { width: 100%; border: 0.5px solid var(--color-border); border-radius: 6px; padding: 8px 10px; font-size: 12px; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box; }
.modal-error  { font-size: 11px; color: var(--color-danger); }
.modal-actions { display: flex; gap: 8px; }

@media (max-width: 768px) { .content { padding: 16px; } }
</style>
