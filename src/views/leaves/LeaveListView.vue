<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar role="rh" />
      <main class="content">

        <div class="page-header">
          <div>
            <div class="page-title">{{ t('absence.title') }}</div>
            <div class="page-sub">{{ t('absence.total', { count: totalCount }) }} · {{ pendingCount }} {{ t('dashboard.pending').toLowerCase() }}</div>
          </div>
        </div>

        <!-- Table card -->
        <div class="table-card">

          <!-- Toolbar -->
          <div class="toolbar">
            <div class="toolbar-left">
              <div class="list-label">
                {{ t('absence.scope_label') }}
                <button class="list-scope-btn">
                  {{ activeFilterLabel }} <i class="ti ti-chevron-down"></i>
                </button>
              </div>
              <div class="search-box">
                <i class="ti ti-search search-icon"></i>
                <input
                  v-model="searchQuery"
                  type="text"
                  :placeholder="t('topbar.search_placeholder')"
                  class="search-input"
                />
              </div>
            </div>
            <div class="toolbar-right">
              <button
                class="tb-icon-btn"
                :class="{ active: showFilters }"
                :title="t('absence.filters.filter_by')"
                @click="showFilters = !showFilters"
              >
                <i class="ti ti-filter"></i>
              </button>
              <button
                class="tb-icon-btn"
                :class="{ active: showColumns }"
                :title="t('absence.columns_title')"
                @click="showColumns = !showColumns"
                ref="colsBtnRef"
              >
                <i class="ti ti-layout-columns"></i>
              </button>
              <button class="btn btn-primary" @click="$router.push({ name: 'hr-dashboard' })">
                <i class="ti ti-plus"></i> {{ t('dashboard.new_request') }}
              </button>
            </div>
          </div>

          <!-- Body: filter panel + table -->
          <div class="table-body-wrap">

            <!-- Filter sidebar -->
            <transition name="slide-filter">
              <div v-if="showFilters" class="filter-panel">
                <div class="fp-header">
                  <span class="fp-title">Filtres</span>
                  <button class="fp-close" @click="showFilters = false"><i class="ti ti-x"></i></button>
                </div>

                <div class="fp-presets">
                  <div
                    v-for="p in filterPresets"
                    :key="p.value"
                    class="fp-preset"
                    :class="{ active: activePreset === p.value }"
                    @click="applyPreset(p.value)"
                  >
                    {{ p.label }}
                  </div>
                </div>

                <div class="fp-section-label">{{ t('absence.filters.filter_by') }}</div>

                <div class="fp-field">
                  <label class="fp-field-label">{{ t('absence.fields.type') }}</label>
                  <select v-model="filterType" class="fp-select">
                    <option value="">{{ t('absence.filters.all_types') }}</option>
                    <option value="Congé annuel">{{ t('absence.types.annual') }}</option>
                    <option value="Congé maladie">{{ t('absence.types.sick') }}</option>
                    <option value="Récupération">{{ t('absence.types.recovery') }}</option>
                    <option value="Télétravail">{{ t('absence.types.remote') }}</option>
                    <option value="Congé maternité">{{ t('absence.types.maternity') }}</option>
                  </select>
                </div>

                <div class="fp-field">
                  <label class="fp-field-label">{{ t('absence.filters.from') }}</label>
                  <input type="date" v-model="filterFrom" class="fp-select" />
                </div>

                <div class="fp-field">
                  <label class="fp-field-label">{{ t('absence.filters.to') }}</label>
                  <input type="date" v-model="filterTo" class="fp-select" :min="filterFrom" />
                </div>

                <button class="fp-reset" @click="resetFilters">{{ t('absence.actions.reset_filters') }}</button>
              </div>
            </transition>

            <!-- Columns dropdown -->
            <div v-if="showColumns" class="cols-dropdown" ref="colsDropRef">
              <div class="cols-title">{{ t('absence.columns_title') }}</div>
              <div v-for="col in columns" :key="col.key" class="cols-row">
                <span class="cols-drag"><i class="ti ti-grip-vertical"></i></span>
                <label class="cols-label">
                  <input type="checkbox" v-model="col.visible" class="cols-check" />
                  {{ getColumnLabel(col.key) }}
                </label>
                <button class="cols-pin" :class="{ pinned: col.pinned }" @click="col.pinned = !col.pinned">
                  <i class="ti ti-pin"></i> Pin
                </button>
              </div>
            </div>

            <!-- Table wrapper -->
            <div class="table-wrap" :class="{ 'with-panel': showFilters }">
              <table class="table" v-if="pageItems.length > 0">
                <thead>
                  <tr>
                    <th v-for="col in visibleColumns" :key="col.key" @click="toggleSort(col.key)">
                      <div class="th-inner">
                        <span class="th-drag"><i class="ti ti-grip-vertical"></i></span>
                        {{ getColumnLabel(col.key) }}
                        <span class="th-sort">
                          <i v-if="sortKey === col.key && sortDir === 'asc'"  class="ti ti-arrow-up sort-active"></i>
                          <i v-else-if="sortKey === col.key && sortDir === 'desc'" class="ti ti-arrow-down sort-active"></i>
                          <i v-else class="ti ti-arrows-sort sort-idle"></i>
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="r in pageItems" :key="r.id">
                    <tr>
                      <td v-if="isVisible('employee')">
                        <div class="emp-cell">
                          <div class="emp-avatar" :style="{ background: r.avatarColor, color: r.avatarTextColor }">
                            {{ r.employeeInitials }}
                          </div>
                          <span class="emp-name">{{ r.employeeName }}</span>
                        </div>
                      </td>
                      <td v-if="isVisible('type')" class="td-type">{{ typeLabel(r.type) }}</td>
                      <td v-if="isVisible('dates')" class="td-dates">{{ r.startDate }} → {{ r.endDate }}</td>
                      <td v-if="isVisible('days')" class="td-days">{{ r.workingDays }}j</td>
                      <td v-if="isVisible('submitted')" class="td-sub">{{ r.submittedAt }}</td>
                      <td v-if="isVisible('status')">
                        <span class="status-pill" :class="pillClass(r.status)">{{ statusLabel(r.status) }}</span>
                      </td>
                      <td v-if="isVisible('actions')">
                        <div v-if="r.status === 'pending'" class="action-btns">
                          <button class="act-btn act-approve" @click="handleApprove(r.id)">{{ t('absence.actions.approve') }}</button>
                          <button class="act-btn act-reject"  @click="openRejectModal(r)">{{ t('absence.actions.reject') }}</button>
                        </div>
                        <button v-else class="act-btn act-view" @click="toggleDetail(r.id)">
                          {{ expandedId === r.id ? '↑ Fermer' : t('absence.actions.view') }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="expandedId === r.id" class="detail-row">
                      <td :colspan="visibleColumns.length">
                        <div class="detail-panel">
                          <div v-if="r.reason"><span class="detail-label">{{ t('absence.fields.reason') }} :</span> {{ r.reason }}</div>
                          <div v-if="r.rejectionReason" class="rejection-reason">
                            <i class="ti ti-alert-circle"></i>
                            <span class="detail-label">{{ t('absence.fields.rejection_reason') }} :</span> {{ r.rejectionReason }}
                          </div>
                          <div class="detail-meta">
                            <span>{{ t('absence.fields.start_date') }} : {{ r.startDate }}</span>
                            <span>{{ t('absence.fields.end_date') }} : {{ r.endDate }}</span>
                            <span>{{ t('absence.fields.working_days', { count: r.workingDays }) }}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <i class="ti ti-calendar-off"></i>
                <p>{{ t('absence.empty') }}</p>
              </div>
            </div>
          </div>

          <!-- Pagination -->
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
              <button class="pag-btn pag-arrow" :disabled="page === 1" @click="page--">
                <i class="ti ti-chevron-left"></i>
              </button>
              <button
                v-for="p in totalPages" :key="p"
                class="pag-btn"
                :class="{ active: p === page }"
                @click="page = p"
              >{{ p }}</button>
              <button class="pag-btn pag-arrow" :disabled="page === totalPages" @click="page++">
                <i class="ti ti-chevron-right"></i>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>

  <!-- Modale de refus -->
  <Teleport to="body">
    <div v-if="rejectModal.open" class="overlay" @click.self="closeRejectModal">
      <div class="modal-card">
        <div class="modal-title">{{ t('absence.reject_modal.title', { name: rejectModal.employeeName }) }}</div>
        <label class="modal-label">{{ t('absence.reject_modal.label') }}</label>
        <textarea
          v-model="rejectModal.reason"
          class="modal-textarea"
          :placeholder="t('absence.reject_modal.placeholder')"
          rows="4"
        ></textarea>
        <div v-if="rejectModal.error" class="modal-error">{{ rejectModal.error }}</div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="confirmReject">{{ t('absence.actions.confirm_reject') }}</button>
          <button class="btn btn-outline" @click="closeRejectModal">{{ t('absence.actions.cancel') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppSidebar, AppTopNav } from '../../components'
import { useAuthStore } from '../../stores/auth'
import { useLeavesStore } from '../../stores/leaves'
import type { LeaveStatus, LeaveRequest } from '../../types'

const auth   = useAuthStore()
const leaves = useLeavesStore()
const { t }  = useI18n()

// ── Toolbar state ────────────────────────────────────────────
const showFilters = ref(false)
const showColumns = ref(false)
const searchQuery = ref('')
const colsBtnRef  = ref<HTMLElement | null>(null)
const colsDropRef = ref<HTMLElement | null>(null)

function onClickOutside(e: MouseEvent) {
  if (
    showColumns.value &&
    colsDropRef.value &&
    !colsDropRef.value.contains(e.target as Node) &&
    colsBtnRef.value &&
    !colsBtnRef.value.contains(e.target as Node)
  ) {
    showColumns.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

// ── Columns config ───────────────────────────────────────────
const columns = reactive([
  { key: 'employee',  visible: true,  pinned: false },
  { key: 'type',      visible: true,  pinned: false },
  { key: 'dates',     visible: true,  pinned: false },
  { key: 'days',      visible: true,  pinned: false },
  { key: 'submitted', visible: true,  pinned: false },
  { key: 'status',    visible: true,  pinned: false },
  { key: 'actions',   visible: true,  pinned: false },
])
const visibleColumns = computed(() => columns.filter(c => c.visible))
function isVisible(key: string) { return columns.find(c => c.key === key)?.visible ?? true }

// Labels de colonnes traduits (réactifs à la locale)
function getColumnLabel(key: string): string {
  const map: Record<string, string> = {
    employee:  t('absence.fields.employee'),
    type:      t('absence.fields.type'),
    dates:     t('absence.fields.dates'),
    days:      t('absence.fields.days'),
    submitted: t('absence.fields.submitted'),
    status:    t('absence.fields.status'),
    actions:   t('absence.fields.actions'),
  }
  return map[key] ?? key
}

// ── Type display helper ──────────────────────────────────────
const typeI18nKey: Record<string, string> = {
  'Congé annuel':    'absence.types.annual',
  'Congé maladie':   'absence.types.sick',
  'Récupération':    'absence.types.recovery',
  'Télétravail':     'absence.types.remote',
  'Congé maternité': 'absence.types.maternity',
}
function typeLabel(type: string): string {
  const key = typeI18nKey[type]
  return key ? t(key) : type
}

// ── Sort ─────────────────────────────────────────────────────
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
function toggleSort(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

// ── Filter presets (computed → réactifs à la locale) ─────────
const filterPresets = computed(() => [
  { label: t('absence.all'),              value: '' },
  { label: t('absence.status.pending'),   value: 'pending' },
  { label: t('absence.status.approved'),  value: 'approved' },
  { label: t('absence.status.rejected'),  value: 'rejected' },
  { label: t('absence.status.draft'),     value: 'draft' },
])

const activePreset     = ref('')
const activeFilterLabel = computed(() =>
  filterPresets.value.find(p => p.value === activePreset.value)?.label ?? t('absence.all')
)
function applyPreset(value: string) {
  activePreset.value  = value
  filterStatus.value  = value
}

// ── Filters ──────────────────────────────────────────────────
const filterStatus = ref('')
const filterType   = ref('')
const filterFrom   = ref('')
const filterTo     = ref('')
const page         = ref(1)
const pageSize     = ref(10)
const expandedId   = ref<number | null>(null)

function resetFilters() {
  filterStatus.value = ''
  filterType.value   = ''
  filterFrom.value   = ''
  filterTo.value     = ''
  searchQuery.value  = ''
  activePreset.value = ''
  page.value = 1
}

const filtered = computed(() => {
  let list = leaves.allLeaves.filter(l => {
    if (filterStatus.value && l.status !== filterStatus.value) return false
    if (filterType.value   && l.type   !== filterType.value)   return false
    if (filterFrom.value   && l.startDate < filterFrom.value)  return false
    if (filterTo.value     && l.endDate   > filterTo.value)    return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!l.employeeName.toLowerCase().includes(q) && !l.type.toLowerCase().includes(q)) return false
    }
    return true
  })

  if (sortKey.value) {
    list = [...list].sort((a, b) => {
      const va = (a as any)[sortKey.value] ?? ''
      const vb = (b as any)[sortKey.value] ?? ''
      const cmp = String(va).localeCompare(String(vb))
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return list
})

const totalCount   = computed(() => filtered.value.length)
const pendingCount = computed(() => filtered.value.filter(l => l.status === 'pending').length)
const totalPages   = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pageItems    = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function toggleDetail(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}
function handleApprove(id: number) { leaves.approveLeave(id) }

const rejectModal = reactive({ open: false, id: 0, employeeName: '', reason: '', error: '' })
function openRejectModal(r: LeaveRequest) {
  Object.assign(rejectModal, { open: true, id: r.id, employeeName: r.employeeName, reason: '', error: '' })
}
function closeRejectModal() { rejectModal.open = false }
function confirmReject() {
  if (!rejectModal.reason.trim())            { rejectModal.error = t('absence.reject_modal.error_empty'); return }
  if (rejectModal.reason.trim().length < 10) { rejectModal.error = t('absence.reject_modal.error_short'); return }
  leaves.rejectLeave(rejectModal.id, rejectModal.reason.trim())
  closeRejectModal()
}

function pillClass(s: LeaveStatus) {
  return {
    'pill-pending':   s === 'pending',
    'pill-approved':  s === 'approved',
    'pill-rejected':  s === 'rejected',
    'pill-cancelled': s === 'cancelled',
    'pill-draft':     s === 'draft',
  }
}
function statusLabel(s: LeaveStatus): string {
  const map: Record<LeaveStatus, string> = {
    draft:       t('absence.status.draft'),
    pending:     t('absence.status.pending'),
    approved:    t('absence.status.approved'),
    rejected:    t('absence.status.rejected'),
    cancelled:   t('absence.status.cancelled'),
    returned:    t('absence.status.returned'),
    registered:  t('absence.status.registered'),
    done:        t('absence.status.done'),
    regularized: t('absence.status.regularized'),
  }
  return map[s]
}
</script>

<style scoped>
/* ── Shell ───────────────────────────────────────────────── */
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--p247-bg); }

/* ── Page header ─────────────────────────────────────────── */
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.page-title  { font-size: 18px; font-weight: 600; }
.page-sub    { font-size: 13px; color: var(--p247-muted); margin-top: 1px; }

/* ── Buttons ─────────────────────────────────────────────── */
.btn          { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-primary  { background: var(--p247-orange); color: white; }
.btn-primary:hover { background: var(--p247-orange-dark); }
.btn-outline  { background: var(--p247-white); color: var(--p247-text); border: 0.5px solid var(--p247-border); }
.btn-outline:hover { background: var(--p247-bg); }

/* ── Table card ──────────────────────────────────────────── */
.table-card {
  background: var(--p247-white);
  border: 0.5px solid var(--p247-border);
  border-radius: 8px;
  overflow: hidden;
}

/* ── Toolbar ─────────────────────────────────────────────── */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; border-bottom: 0.5px solid var(--p247-border); gap: 8px;
}
.toolbar-left  { display: flex; align-items: center; gap: 10px; }
.toolbar-right { display: flex; align-items: center; gap: 6px; }

.list-label     { font-size: 13px; font-weight: 500; color: var(--p247-text); display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.list-scope-btn { background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--p247-orange); display: inline-flex; align-items: center; gap: 3px; padding: 0; }
.list-scope-btn i { font-size: 11px; }

.search-box   { display: flex; align-items: center; gap: 6px; border: 0.5px solid var(--p247-border); border-radius: 6px; padding: 0 8px; height: 30px; background: var(--p247-white); }
.search-icon  { color: var(--p247-muted); font-size: 13px; }
.search-input { border: none; outline: none; font-size: 12px; color: var(--p247-text); background: transparent; width: 160px; }
.search-input::placeholder { color: var(--p247-muted); }

.tb-icon-btn {
  width: 30px; height: 30px; border-radius: 6px; border: 0.5px solid var(--p247-border);
  background: var(--p247-white); color: var(--p247-muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 14px; transition: all .12s; position: relative;
}
.tb-icon-btn:hover { background: var(--p247-bg); color: var(--p247-text); }
.tb-icon-btn.active { background: var(--p247-orange-light); color: var(--p247-orange); border-color: rgba(200, 16, 46, 0.2); }

/* ── Body wrap ───────────────────────────────────────────── */
.table-body-wrap { display: flex; position: relative; }

/* ── Filter panel ────────────────────────────────────────── */
.filter-panel {
  width: 220px; min-width: 220px;
  border-right: 0.5px solid var(--p247-border);
  padding: 14px; display: flex; flex-direction: column; gap: 10px;
  background: var(--p247-white); overflow-y: auto;
}
.fp-header  { display: flex; align-items: center; justify-content: space-between; }
.fp-title   { font-size: 13px; font-weight: 600; }
.fp-close   { background: none; border: none; cursor: pointer; color: var(--p247-muted); font-size: 14px; line-height: 1; }
.fp-close:hover { color: var(--p247-text); }
.fp-presets { display: flex; flex-direction: column; gap: 1px; }
.fp-preset  { font-size: 13px; color: var(--p247-text); padding: 6px 8px; border-radius: 5px; cursor: pointer; }
.fp-preset:hover { background: var(--p247-bg); }
.fp-preset.active { color: var(--p247-orange); font-weight: 500; background: var(--color-primary-light); }
.fp-section-label { font-size: 11px; color: var(--p247-muted); font-weight: 500; margin-top: 4px; }
.fp-field       { display: flex; flex-direction: column; gap: 4px; }
.fp-field-label { font-size: 11px; color: var(--p247-muted); }
.fp-select {
  height: 30px; padding: 0 8px; border: 0.5px solid var(--p247-border); border-radius: 6px;
  font-size: 12px; color: var(--p247-text); background: var(--p247-white); outline: none; width: 100%;
}
.fp-select:focus { border-color: var(--p247-orange); }
.fp-reset {
  margin-top: auto; padding: 7px 0; background: none; border: none;
  font-size: 12px; color: var(--p247-muted); cursor: pointer; text-align: left;
}
.fp-reset:hover { color: var(--p247-orange); }

.slide-filter-enter-active, .slide-filter-leave-active { transition: width .2s ease, opacity .2s ease; overflow: hidden; }
.slide-filter-enter-from, .slide-filter-leave-to { width: 0 !important; opacity: 0; }

/* ── Columns dropdown ────────────────────────────────────── */
.cols-dropdown {
  position: absolute; top: 0; right: 0; z-index: 200;
  width: 220px; background: var(--p247-white);
  border: 0.5px solid var(--p247-border); border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.12); padding: 10px 0;
}
.cols-title { font-size: 11px; font-weight: 600; color: var(--p247-muted); padding: 4px 14px 8px; letter-spacing: .05em; }
.cols-row   { display: flex; align-items: center; padding: 5px 14px; gap: 8px; }
.cols-drag  { color: var(--p247-muted); font-size: 12px; cursor: grab; }
.cols-label { flex: 1; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer; }
.cols-check { accent-color: var(--p247-orange); }
.cols-pin   { font-size: 11px; color: var(--p247-muted); background: var(--p247-bg); border: 0.5px solid var(--p247-border); border-radius: 4px; padding: 2px 7px; cursor: pointer; display: flex; align-items: center; gap: 3px; }
.cols-pin.pinned { color: var(--p247-orange); background: var(--color-primary-light); border-color: rgba(200, 16, 46, 0.2); }

/* ── Table ───────────────────────────────────────────────── */
.table-wrap { flex: 1; overflow-x: auto; }
.table      { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th {
  padding: 10px 13px; text-align: left; font-size: 12px; font-weight: 600;
  color: var(--p247-text); background: var(--p247-orange-light);
  border-bottom: 1px solid rgba(200, 16, 46, 0.2); white-space: nowrap;
  cursor: pointer; user-select: none;
}
.table th:hover { background: var(--color-primary-light); }
.th-inner { display: flex; align-items: center; gap: 5px; }
.th-drag  { color: var(--color-text-light); font-size: 11px; cursor: grab; }
.th-sort  { margin-left: auto; font-size: 11px; }
.sort-idle   { color: var(--color-text-light); }
.sort-active { color: var(--p247-orange); }
.table td { padding: 10px 13px; border-bottom: 0.5px solid var(--p247-border); color: var(--p247-text); vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover td { background: var(--color-primary-light); }

/* ── Cells ───────────────────────────────────────────────── */
.emp-cell   { display: flex; align-items: center; gap: 8px; }
.emp-avatar { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; flex-shrink: 0; }
.emp-name   { font-weight: 500; white-space: nowrap; }
.td-type    { color: var(--p247-muted); white-space: nowrap; }
.td-dates   { white-space: nowrap; font-size: 11px; }
.td-days    { font-weight: 500; white-space: nowrap; }
.td-sub     { color: var(--p247-muted); white-space: nowrap; font-size: 11px; }

/* ── Status pills ────────────────────────────────────────── */
.status-pill  { font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.pill-pending   { background: var(--p247-warning-bg); color: var(--p247-warning); }
.pill-approved  { background: var(--color-success-bg); color: var(--p247-success); }
.pill-rejected  { background: var(--p247-danger-bg);  color: var(--p247-danger); }
.pill-cancelled { background: var(--p247-bg);         color: var(--p247-muted); }
.pill-draft     { background: transparent; color: #555; border: 0.5px solid #bbb; }

/* ── Actions ─────────────────────────────────────────────── */
.action-btns { display: flex; gap: 4px; }
.act-btn     { padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; white-space: nowrap; }
.act-approve { background: var(--color-success-bg); color: var(--p247-success); }
.act-reject  { background: var(--p247-danger-bg);  color: var(--p247-danger);  }
.act-view    { background: var(--p247-bg);          color: var(--p247-muted);  }

/* ── Detail row ──────────────────────────────────────────── */
.detail-row td { padding: 0; }
.detail-panel {
  background: var(--p247-bg); border-top: 0.5px solid var(--p247-border);
  padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
}
.detail-label     { font-weight: 500; font-size: 11px; }
.rejection-reason { display: flex; align-items: center; gap: 6px; color: var(--p247-danger); font-size: 12px; }
.detail-meta      { display: flex; gap: 16px; font-size: 11px; color: var(--p247-muted); }

/* ── Empty state ─────────────────────────────────────────── */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; gap: 8px; color: var(--p247-muted); }
.empty-state i { font-size: 32px; }
.empty-state p { font-size: 13px; }

/* ── Pagination ──────────────────────────────────────────── */
.pagination {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-top: 0.5px solid var(--p247-border);
  font-size: 12px; color: var(--p247-muted);
}
.pag-total   { flex: 1; white-space: nowrap; }
.pag-perpage { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.pag-size-select {
  height: 26px; padding: 0 6px; border: 0.5px solid var(--p247-border); border-radius: 5px;
  font-size: 12px; color: var(--p247-text); background: var(--p247-white); outline: none; cursor: pointer;
}
.pag-size-select:focus { border-color: var(--p247-orange); }
.pag-pages { display: flex; align-items: center; gap: 3px; }
.pag-btn   {
  min-width: 28px; height: 28px; padding: 0 6px;
  border-radius: 5px; font-size: 12px; font-weight: 500;
  cursor: pointer; border: 0.5px solid var(--p247-border);
  background: var(--p247-white); color: var(--p247-text);
  display: flex; align-items: center; justify-content: center; transition: all .12s;
}
.pag-btn:hover:not(:disabled) { background: var(--p247-bg); }
.pag-btn.active { background: var(--p247-orange); color: white; border-color: var(--p247-orange); }
.pag-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pag-arrow { color: var(--p247-muted); }

/* ── Modal ───────────────────────────────────────────────── */
.overlay      { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card   { background: var(--p247-white); border-radius: 10px; padding: 24px; width: 420px; max-width: 90vw; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.18); }
.modal-title  { font-size: 14px; font-weight: 600; }
.modal-label  { font-size: 12px; font-weight: 500; color: var(--p247-text); }
.modal-textarea { width: 100%; border: 0.5px solid var(--p247-border); border-radius: 6px; padding: 8px 10px; font-size: 12px; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box; }
.modal-textarea:focus { border-color: var(--p247-orange); }
.modal-error  { font-size: 11px; color: var(--p247-danger); }
.modal-actions { display: flex; gap: 8px; }
</style>
