<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <div class="flex items-start justify-between mb-4 gap-3 flex-wrap">
          <div>
            <div class="text-xl font-bold text-foreground">Notes de frais</div>
            <div class="text-[13px] text-muted-foreground mt-0.5">{{ totalCount }} note(s) · {{ pendingCount }} en attente</div>
          </div>
          <div class="flex gap-2 items-center flex-wrap">
            <div :class="L.searchBox" class="!h-[34px]">
              <Search class="w-3.5 h-3.5 text-muted-foreground" />
              <input v-model="search" type="text" placeholder="Rechercher..." :class="L.searchInput" class="!w-[150px]" />
            </div>
            <select v-model="filterStatus" class="h-[34px] px-2 border border-border rounded-md text-[13px] text-foreground bg-card outline-none focus:border-primary">
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvée</option>
              <option value="rejected">Refusée</option>
            </select>
            <button :class="L.btnPrimary" @click="openCreate">
              <Plus class="w-4 h-4" /> Nouvelle note
            </button>
          </div>
        </div>

        <!-- Table -->
        <div :class="L.tableCard">
          <table class="w-full border-collapse text-[13px]" v-if="pageItems.length > 0">
            <thead>
              <tr>
                <th v-if="isRH" :class="thUpper">Employé</th>
                <th :class="thUpper">Code</th>
                <th :class="thUpper">Titre</th>
                <th :class="thUpper">Lignes</th>
                <th :class="thUpper">Montant total</th>
                <th :class="thUpper">Soumis le</th>
                <th :class="thUpper">Statut</th>
                <th :class="thUpper">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="r in pageItems" :key="r.id">
                <tr class="hover:bg-background">
                  <td v-if="isRH" :class="L.td">
                    <div class="flex items-center gap-2">
                      <UserAvatar :name="r.employeeName" size="sm" />
                      <span>{{ r.employeeName }}</span>
                    </div>
                  </td>
                  <td :class="[L.td, 'font-mono text-xs text-muted-foreground']">{{ r.code }}</td>
                  <td :class="[L.td, 'font-medium']">{{ r.title }}</td>
                  <td :class="[L.td, 'text-center']">{{ r.lines.length }}</td>
                  <td :class="[L.td, 'font-semibold text-right']">{{ fmt(r.totalAmount) }} {{ r.currency }}</td>
                  <td :class="[L.td, 'text-xs text-muted-foreground']">{{ r.submittedAt ?? '—' }}</td>
                  <td :class="L.td"><StatusPill :status="r.status" /></td>
                  <td :class="L.td">
                    <div class="flex gap-1 flex-wrap">
                      <button :class="L.actView" @click="toggleDetail(r.id)">
                        {{ expanded === r.id ? '↑' : 'Voir' }}
                      </button>
                      <button v-if="r.status === 'draft'" :class="L.actApprove" @click="openEdit(r.id)">
                        <Pencil class="w-3.5 h-3.5" /> Éditer
                      </button>
                      <button v-if="r.status === 'draft'" :class="L.actBtn" class="bg-info-bg text-info" @click="expenseStore.submitReport(r.id)">
                        <Send class="w-3.5 h-3.5" /> Soumettre
                      </button>
                      <button v-if="isRH && r.status === 'pending'" :class="L.actApprove" @click="expenseStore.approveReport(r.id)">
                        <Check class="w-3.5 h-3.5" /> Approuver
                      </button>
                      <button v-if="isRH && r.status === 'pending'" :class="L.actReject" @click="openReject(r)">
                        <X class="w-3.5 h-3.5" /> Refuser
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Detail expand -->
                <tr v-if="expanded === r.id">
                  <td :colspan="isRH ? 8 : 7" class="p-0">
                    <div class="bg-background p-4 border-t border-border">
                      <div class="text-xs font-bold text-muted-foreground uppercase mb-2.5">Lignes de dépense</div>
                      <table class="w-full border-collapse text-xs">
                        <thead>
                          <tr>
                            <th :class="thSub">Date</th>
                            <th :class="thSub">Catégorie</th>
                            <th :class="thSub">Description</th>
                            <th :class="thSub">Montant</th>
                            <th :class="thSub">Justif.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="l in r.lines" :key="l.id">
                            <td :class="tdSub">{{ l.date }}</td>
                            <td :class="tdSub">{{ CATEGORY_LABELS[l.category] }}</td>
                            <td :class="tdSub">{{ l.description }}</td>
                            <td :class="[tdSub, 'font-semibold text-right']">{{ fmt(l.amount) }} {{ l.currency }}</td>
                            <td :class="tdSub">
                              <Check v-if="l.receipt" class="w-3.5 h-3.5 text-success" />
                              <X v-else class="w-3.5 h-3.5 text-neutral" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div v-if="r.rejectionReason" class="mt-2.5 text-danger text-xs flex items-center gap-1.5">
                        <CircleAlert class="w-3.5 h-3.5" /> {{ r.rejectionReason }}
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-else :class="L.emptyState">
            <ReceiptText class="w-9 h-9" />
            <p>Aucune note de frais</p>
          </div>

          <!-- Pagination -->
          <div :class="L.pagination">
            <span class="flex-1">{{ totalCount }} résultats</span>
            <div class="flex items-center gap-1.5">
              Afficher
              <select v-model.number="pageSize" :class="L.pagSizeSelect">
                <option :value="10">10</option>
                <option :value="25">25</option>
              </select>
            </div>
            <div class="flex items-center gap-[3px]">
              <button :class="L.pagBtn" :disabled="page === 1" @click="page--"><ChevronLeft class="w-3.5 h-3.5" /></button>
              <button v-for="p in totalPages" :key="p" :class="[L.pagBtn, p === page && L.pagBtnActive]" @click="page = p">{{ p }}</button>
              <button :class="L.pagBtn" :disabled="page === totalPages" @click="page++"><ChevronRight class="w-3.5 h-3.5" /></button>
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
  <ModalShell :open="rejectModal.open" :title="`Refuser la note ${rejectModal.code}`" max-width="max-w-[420px]" @close="rejectModal.open = false">
    <label :class="cls.fieldLabel">Motif *</label>
    <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" placeholder="Motif du refus..." rows="4"></textarea>
    <div v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</div>
    <template #footer>
      <button :class="cls.btnDestructive" @click="confirmReject"><X class="w-4 h-4" /> Confirmer</button>
      <button :class="cls.btnOutline" @click="rejectModal.open = false">Annuler</button>
    </template>
  </ModalShell>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Search, Pencil, Send, Check, X, CircleAlert, ReceiptText, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { AppSidebar, AppTopNav, StatusPill, UserAvatar } from '../../components'
import ExpenseFormModal from '../../components/expenses/ExpenseFormModal.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useAuthStore }    from '../../stores/auth'
import { useExpenseStore } from '../../stores/expenses'
import type { ExpenseReport, ExpenseCategory } from '../../types'

const auth         = useAuthStore()
const expenseStore = useExpenseStore()
const route        = useRoute()

// ── Classes du design system ─────────────────────────────────
const thUpper = 'px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border whitespace-nowrap'
const thSub = 'px-2.5 py-1.5 text-left text-[11px] font-semibold text-muted-foreground bg-card border-b border-border'
const tdSub = 'px-2.5 py-1.5 border-b border-border text-foreground'

const isRH = computed(() => route.path.startsWith('/hr') || auth.user?.role === 'hr_admin' || auth.user?.role === 'hr_director')

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
