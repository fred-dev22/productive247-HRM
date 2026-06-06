<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- ── En-tête ── -->
        <div class="page-header">
          <div>
            <div class="page-title">{{ t('absence.my_title') }}</div>
            <div class="page-sub">{{ auth.user?.name }}</div>
          </div>
          <button class="btn btn-primary" @click="showModal = true">
            <i class="ti ti-plus" aria-hidden="true"></i> {{ t('absence.new') }}
          </button>
        </div>

        <!-- ── Soldes rapides ── -->
        <div class="kpi-row">
          <div class="kpi-card" style="border-top: 3px solid var(--color-primary)">
            <div class="kpi-label">{{ t('balances.annual') }}</div>
            <div class="kpi-value" style="color:var(--color-primary)">12</div>
            <div class="kpi-sub">{{ t('balances.on', { total: 24 }) }}</div>
          </div>
          <div class="kpi-card" style="border-top: 3px solid var(--color-success)">
            <div class="kpi-label">{{ t('balances.recovery') }}</div>
            <div class="kpi-value" style="color:var(--color-success)">3</div>
            <div class="kpi-sub">{{ t('balances.acquired') }}</div>
          </div>
          <div class="kpi-card" style="border-top: 3px solid var(--color-success)">
            <div class="kpi-label">{{ t('balances.sick') }}</div>
            <div class="kpi-value" style="color:var(--color-success)">8</div>
            <div class="kpi-sub">{{ t('balances.available') }}</div>
          </div>
          <div class="kpi-card" style="border-top: 3px solid #854F0B">
            <div class="kpi-label">{{ t('balances.remote') }}</div>
            <div class="kpi-value" style="color:#854F0B">5</div>
            <div class="kpi-sub">{{ t('balances.used') }}</div>
          </div>
        </div>

        <!-- ── DataTable ── -->
        <DataTable
          :columns="columns"
          :rows="pageItems"
          :empty-message="t('absence.my_empty')"
          row-key="id"
        >
          <!-- Filtres -->
          <template #filters>
            <select v-model="filterStatus" class="filter-select">
              <option value="">{{ t('absence.filters.all_statuses') }}</option>
              <option value="pending">{{ t('absence.status.pending') }}</option>
              <option value="approved">{{ t('absence.status.approved') }}</option>
              <option value="rejected">{{ t('absence.status.rejected') }}</option>
              <option value="cancelled">{{ t('absence.status.cancelled') }}</option>
              <option value="draft">{{ t('absence.status.draft') }}</option>
            </select>
            <select v-model="filterType" class="filter-select">
              <option value="">{{ t('absence.filters.all_types') }}</option>
              <option v-for="lt in allLeaveTypes" :key="lt" :value="lt">{{ typeLabel(lt) }}</option>
            </select>
            <button class="btn-reset" @click="resetFilters">{{ t('absence.actions.reset_filters') }}</button>
            <span class="total-label" style="margin-left:auto">{{ t('absence.total', { count: totalCount }) }}</span>
          </template>

          <!-- Cellules personnalisées -->
          <template #cell-type="{ row }">
            <span class="td-type">{{ typeLabel(row.type) }}</span>
          </template>
          <template #cell-dates="{ row }">
            <span class="td-dates">{{ row.startDate }} → {{ row.endDate }}</span>
          </template>
          <template #cell-days="{ row }">
            <span class="td-days">{{ row.workingDays }}j</span>
          </template>
          <template #cell-submitted="{ row }">
            <span class="td-muted">{{ row.submittedAt }}</span>
          </template>
          <template #cell-status="{ row }">
            <StatusPill :status="row.status" />
          </template>
          <template #cell-actions="{ row }">
            <div class="action-btns">
              <button v-if="row.status === 'pending'" class="act-btn act-cancel" @click.stop="absenceStore.cancelLeave(row.id)">
                {{ t('absence.actions.cancel') }}
              </button>
              <template v-else-if="row.status === 'draft'">
                <button class="act-btn act-approve" @click.stop="absenceStore.submitDraft(row.id)">
                  {{ t('absence.actions.submit_draft') }}
                </button>
                <button class="act-btn act-reject" @click.stop="absenceStore.deleteLeave(row.id)">
                  {{ t('absence.actions.delete') }}
                </button>
              </template>
              <button v-else class="act-btn act-view" @click.stop="toggleDetail(row.id)">
                {{ expandedId === row.id ? '↑ Fermer' : t('absence.actions.view') }}
              </button>
            </div>
          </template>

          <!-- Ligne détail dépliable -->
          <template #row-after="{ row }">
            <tr v-if="expandedId === row.id" class="detail-row">
              <td :colspan="columns.length">
                <div class="detail-panel">
                  <div v-if="row.reason">
                    <span class="detail-label">{{ t('absence.fields.reason') }} :</span>
                    {{ row.reason }}
                  </div>
                  <div v-if="row.rejectionReason" class="rejection-reason">
                    <i class="ti ti-alert-circle" aria-hidden="true"></i>
                    <span class="detail-label">{{ t('absence.fields.rejection_reason') }} :</span>
                    {{ row.rejectionReason }}
                  </div>
                  <div class="detail-meta">
                    <span>{{ t('absence.fields.start_date') }} : {{ row.startDate }}</span>
                    <span>{{ t('absence.fields.end_date') }} : {{ row.endDate }}</span>
                    <span>{{ t('absence.fields.working_days', { count: row.workingDays }) }}</span>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- Pagination -->
          <template #pagination>
            <div class="pagination">
              <span class="pag-total">{{ t('absence.total', { count: totalCount }) }}</span>
              <div class="pag-perpage">
                {{ t('absence.per_page') }}
                <select v-model.number="pageSize" class="pag-size-select">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                </select>
              </div>
              <div class="pag-pages">
                <button class="pag-btn" :disabled="page === 1" @click="page--">
                  <i class="ti ti-chevron-left" aria-hidden="true"></i>
                </button>
                <button
                  v-for="p in totalPages" :key="p"
                  class="pag-btn" :class="{ active: p === page }"
                  @click="page = p"
                >{{ p }}</button>
                <button class="pag-btn" :disabled="page === totalPages" @click="page++">
                  <i class="ti ti-chevron-right" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </template>
        </DataTable>

      </main>
    </div>
  </div>

  <AbsenceRequestModal
    v-model="showModal"
    @submitted="showToast(t('absence.submitted_toast'))"
    @drafted="showToast(t('absence.draft_saved'))"
  />

  <div v-if="toastMsg" class="toast-fixed">
    <i class="ti ti-check" aria-hidden="true"></i> {{ toastMsg }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppSidebar, AppTopNav, AbsenceRequestModal, StatusPill, DataTable } from '../../components'
import { useAuthStore }    from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import type { LeaveType } from '../../types'

const auth         = useAuthStore()
const absenceStore = useAbsenceStore()
const { t }        = useI18n()

const columns = computed(() => [
  { key: 'type',      label: t('absence.fields.type') },
  { key: 'dates',     label: t('absence.fields.dates') },
  { key: 'days',      label: t('absence.fields.days'),      align: 'center' as const },
  { key: 'submitted', label: t('absence.fields.submitted') },
  { key: 'status',    label: t('absence.fields.status') },
  { key: 'actions',   label: t('absence.fields.actions') },
])

const allLeaveTypes: LeaveType[] = [
  'Congé annuel', 'Congé maladie', 'Congé maternité',
  'Récupération', 'Assistance parentale', 'Permission exceptionnelle', 'Télétravail',
]

const typeI18nKey: Record<string, string> = {
  'Congé annuel':              'absence.types.annual',
  'Congé maladie':             'absence.types.sick',
  'Congé maternité':           'absence.types.maternity',
  'Récupération':              'absence.types.recovery',
  'Assistance parentale':      'absence.types.parental',
  'Permission exceptionnelle': 'absence.types.exceptional',
  'Télétravail':               'absence.types.remote',
}

function typeLabel(type: string): string {
  const key = typeI18nKey[type]
  return key ? t(key) : type
}

const filterStatus = ref('')
const filterType   = ref('')
const page         = ref(1)
const pageSize     = ref(10)
const expandedId   = ref<number | null>(null)

function resetFilters() { filterStatus.value = ''; filterType.value = ''; page.value = 1; expandedId.value = null }
function toggleDetail(id: number) { expandedId.value = expandedId.value === id ? null : id }

const filtered = computed(() =>
  absenceStore.myLeaves.filter(l => {
    if (filterStatus.value && l.status !== filterStatus.value) return false
    if (filterType.value   && l.type   !== filterType.value)   return false
    return true
  })
)

const totalCount = computed(() => filtered.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

const showModal = ref(false)
const toastMsg  = ref('')

function showToast(msg: string) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--color-bg); }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.page-title  { font-size: 18px; font-weight: 600; }
.page-sub    { font-size: 13px; color: var(--color-text-muted); margin-top: 1px; }

.btn         { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-dark); }

.kpi-row  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
.kpi-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 8px; padding: 12px 14px; }
.kpi-label { font-size: 13px; color: var(--color-text-muted); margin-bottom: 4px; }
.kpi-value { font-size: 28px; font-weight: 600; line-height: 1; }
.kpi-sub   { font-size: 12px; color: var(--color-text-muted); margin-top: 3px; }

/* Filtres (dans le slot DataTable#filters) */
.filter-select { height: 30px; padding: 0 8px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 12px; color: var(--color-text); background: var(--color-surface); outline: none; }
.filter-select:focus { border-color: var(--color-primary); }
.btn-reset { height: 30px; padding: 0 12px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 12px; color: var(--color-text-muted); background: var(--color-surface); cursor: pointer; transition: all .12s; }
.btn-reset:hover { color: var(--color-primary); border-color: var(--color-primary); }
.total-label { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }

/* Cellules */
.td-type  { color: var(--color-text-muted); white-space: nowrap; }
.td-dates { white-space: nowrap; font-size: 11px; }
.td-days  { font-weight: 500; white-space: nowrap; }
.td-muted { color: var(--color-text-muted); white-space: nowrap; font-size: 11px; }

/* Actions */
.action-btns { display: flex; gap: 4px; }
.act-btn     { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; border: none; white-space: nowrap; transition: opacity .12s; }
.act-btn:hover { opacity: 0.82; }
.act-approve { background: var(--color-success-bg); color: var(--color-success); }
.act-reject  { background: var(--color-danger-bg);  color: var(--color-danger);  }
.act-cancel  { background: var(--color-warning-bg); color: var(--color-warning); }
.act-view    { background: var(--color-bg);          color: var(--color-text-muted); }

/* Ligne détail */
.detail-row td { padding: 0; }
.detail-panel  { background: var(--color-bg); border-top: 0.5px solid var(--color-border); padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
.detail-label  { font-weight: 500; font-size: 11px; }
.rejection-reason { display: flex; align-items: center; gap: 6px; color: var(--color-danger); font-size: 12px; }
.detail-meta   { display: flex; gap: 16px; font-size: 11px; color: var(--color-text-muted); flex-wrap: wrap; }

/* Pagination */
.pagination     { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--color-text-muted); flex-wrap: wrap; }
.pag-total      { flex: 1; white-space: nowrap; }
.pag-perpage    { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.pag-size-select { height: 26px; padding: 0 6px; border: 0.5px solid var(--color-border); border-radius: 5px; font-size: 12px; color: var(--color-text); background: var(--color-surface); outline: none; cursor: pointer; }
.pag-pages      { display: flex; align-items: center; gap: 3px; }
.pag-btn        { min-width: 28px; height: 28px; padding: 0 6px; border-radius: 5px; font-size: 12px; font-weight: 500; cursor: pointer; border: 0.5px solid var(--color-border); background: var(--color-surface); color: var(--color-text); display: flex; align-items: center; justify-content: center; transition: all .12s; }
.pag-btn:hover:not(:disabled) { background: var(--color-bg); }
.pag-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.pag-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* Toast */
.toast-fixed {
  position: fixed; bottom: 24px; right: 24px;
  background: var(--color-success-bg); color: var(--color-success);
  padding: 12px 18px; border-radius: 8px; font-size: 13px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); z-index: 2000;
}

@media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .kpi-row { grid-template-columns: 1fr; } .content { padding: 16px; } }
</style>
