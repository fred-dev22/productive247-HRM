<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <div :class="L.pageHeader">
          <div>
            <div :class="L.pageTitle">{{ t('absence.title') }}</div>
            <div :class="L.pageSub">{{ t('absence.total', { count: totalCount }) }} · {{ pendingCount }} {{ t('dashboard.pending').toLowerCase() }}</div>
          </div>
        </div>

        <!-- Table card -->
        <div :class="L.tableCard">

          <!-- Toolbar -->
          <div :class="L.toolbar">
            <div class="flex items-center gap-2.5">
              <div class="text-[13px] font-medium text-foreground flex items-center gap-1 whitespace-nowrap">
                {{ t('absence.scope_label') }}
                <button class="bg-transparent border-0 cursor-pointer text-[13px] font-semibold text-primary inline-flex items-center gap-[3px] p-0">
                  {{ activeFilterLabel }} <ChevronDown class="w-3.5 h-3.5" />
                </button>
              </div>
              <div :class="L.searchBox">
                <Search class="w-3.5 h-3.5 text-muted-foreground" />
                <input v-model="searchQuery" type="text" :placeholder="t('topbar.search_placeholder')" :class="L.searchInput" />
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button :class="[L.tbIconBtn, showFilters && L.tbIconBtnActive]" :title="t('absence.filters.filter_by')" @click="showFilters = !showFilters">
                <Filter class="w-3.5 h-3.5" />
              </button>
              <button :class="[L.tbIconBtn, showColumns && L.tbIconBtnActive]" :title="t('absence.columns_title')" @click="showColumns = !showColumns" ref="colsBtnRef">
                <Columns3 class="w-3.5 h-3.5" />
              </button>
              <button :class="L.btnPrimary" @click="$router.push({ name: 'hr-dashboard' })">
                <Plus class="w-4 h-4" /> {{ t('dashboard.new_request') }}
              </button>
            </div>
          </div>

          <!-- Body: filter panel + table -->
          <div class="flex relative">

            <!-- Filter sidebar -->
            <div v-if="showFilters" :class="L.filterPanel">
              <div class="flex items-center justify-between">
                <span class="text-[13px] font-semibold">Filtres</span>
                <button class="bg-transparent border-0 cursor-pointer text-muted-foreground leading-none" @click="showFilters = false"><X class="w-3.5 h-3.5" /></button>
              </div>
              <div class="flex flex-col gap-px">
                <div v-for="p in filterPresets" :key="p.value"
                  class="text-[13px] text-foreground px-2 py-1.5 rounded-md cursor-pointer hover:bg-background"
                  :class="{ '!text-primary font-medium bg-primary/10': activePreset === p.value }" @click="applyPreset(p.value)">
                  {{ p.label }}
                </div>
              </div>
              <div class="text-[11px] text-muted-foreground font-medium mt-1">{{ t('absence.filters.filter_by') }}</div>
              <div :class="L.fpField">
                <label :class="L.fpFieldLabel">{{ t('absence.fields.type') }}</label>
                <select v-model="filterType" :class="L.fpSelect">
                  <option value="">{{ t('absence.filters.all_types') }}</option>
                  <option value="Congé annuel">{{ t('absence.types.annual') }}</option>
                  <option value="Congé maladie">{{ t('absence.types.sick') }}</option>
                  <option value="Récupération">{{ t('absence.types.recovery') }}</option>
                  <option value="Télétravail">{{ t('absence.types.remote') }}</option>
                  <option value="Congé maternité">{{ t('absence.types.maternity') }}</option>
                </select>
              </div>
              <div :class="L.fpField">
                <label :class="L.fpFieldLabel">{{ t('absence.filters.from') }}</label>
                <input type="date" v-model="filterFrom" :class="L.fpSelect" />
              </div>
              <div :class="L.fpField">
                <label :class="L.fpFieldLabel">{{ t('absence.filters.to') }}</label>
                <input type="date" v-model="filterTo" :class="L.fpSelect" :min="filterFrom" />
              </div>
              <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">{{ t('absence.actions.reset_filters') }}</button>
            </div>

            <!-- Columns dropdown -->
            <div v-if="showColumns" class="absolute top-0 right-0 z-[200] w-[220px] bg-card border border-border rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] py-2.5" ref="colsDropRef">
              <div class="text-[11px] font-semibold text-muted-foreground px-3.5 pt-1 pb-2 tracking-[0.05em]">{{ t('absence.columns_title') }}</div>
              <div v-for="col in columns" :key="col.key" class="flex items-center px-3.5 py-[5px] gap-2">
                <GripVertical class="w-3 h-3 text-muted-foreground cursor-grab" />
                <label class="flex-1 text-[13px] flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" v-model="col.visible" class="accent-primary" />
                  {{ getColumnLabel(col.key) }}
                </label>
                <button class="text-[11px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5 cursor-pointer flex items-center gap-[3px]" :class="{ '!text-primary bg-primary/10 !border-primary/20': col.pinned }" @click="col.pinned = !col.pinned">
                  <Pin class="w-3 h-3" /> Pin
                </button>
              </div>
            </div>

            <!-- Table wrapper -->
            <div class="flex-1 overflow-x-auto">
              <table :class="L.table" v-if="pageItems.length > 0">
                <thead>
                  <tr>
                    <th v-for="col in visibleColumns" :key="col.key" :class="L.th" @click="toggleSort(col.key)">
                      <div class="flex items-center gap-1.5">
                        <GripVertical class="w-3 h-3 text-foreground/30 cursor-grab" />
                        {{ getColumnLabel(col.key) }}
                        <span class="ml-auto"><component :is="sortIcon(col.key)" class="w-3 h-3" :class="sortKey === col.key ? 'text-primary' : 'text-foreground/30'" /></span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="r in pageItems" :key="r.id">
                    <tr :class="L.rowHover">
                      <td v-if="isVisible('employee')" :class="L.td">
                        <div class="flex items-center gap-2">
                          <div class="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0" :style="{ background: r.avatarColor, color: r.avatarTextColor }">
                            {{ r.employeeInitials }}
                          </div>
                          <span class="font-medium whitespace-nowrap">{{ r.employeeName }}</span>
                        </div>
                      </td>
                      <td v-if="isVisible('type')" :class="[L.td, 'text-muted-foreground whitespace-nowrap']">{{ typeLabel(r.type) }}</td>
                      <td v-if="isVisible('dates')" :class="[L.td, 'whitespace-nowrap text-[11px]']">{{ r.startDate }} → {{ r.endDate }}</td>
                      <td v-if="isVisible('days')" :class="[L.td, 'font-medium whitespace-nowrap']">{{ r.workingDays }}j</td>
                      <td v-if="isVisible('submitted')" :class="[L.td, 'text-muted-foreground whitespace-nowrap text-[11px]']">{{ r.submittedAt }}</td>
                      <td v-if="isVisible('status')" :class="L.td">
                        <StatusPill :status="r.status" />
                      </td>
                      <td v-if="isVisible('actions')" :class="L.td">
                        <div v-if="r.status === 'pending'" class="flex gap-1">
                          <button :class="L.actApprove" @click="handleApprove(r.id)">{{ t('absence.actions.approve') }}</button>
                          <button :class="L.actReject"  @click="openRejectModal(r)">{{ t('absence.actions.reject') }}</button>
                        </div>
                        <button v-else :class="L.actView" @click="toggleDetail(r.id)">
                          {{ expandedId === r.id ? '↑ Fermer' : t('absence.actions.view') }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="expandedId === r.id">
                      <td :colspan="visibleColumns.length" class="p-0">
                        <div class="bg-background border-t border-border px-3.5 py-3 flex flex-col gap-1.5">
                          <div v-if="r.reason" class="text-[13px]"><span class="font-medium text-[11px]">{{ t('absence.fields.reason') }} :</span> {{ r.reason }}</div>
                          <div v-if="r.rejectionReason" class="flex items-center gap-1.5 text-danger text-xs">
                            <CircleAlert class="w-3.5 h-3.5" />
                            <span class="font-medium text-[11px]">{{ t('absence.fields.rejection_reason') }} :</span> {{ r.rejectionReason }}
                          </div>
                          <div class="flex gap-4 text-[11px] text-muted-foreground">
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
              <div v-else :class="L.emptyState">
                <CalendarOff class="w-8 h-8" />
                <p class="text-[13px]">{{ t('absence.empty') }}</p>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div :class="L.pagination">
            <span class="flex-1 whitespace-nowrap">{{ t('absence.total', { count: totalCount }) }}</span>
            <div class="flex items-center gap-1.5 whitespace-nowrap">
              {{ t('absence.per_page') }}
              <select v-model.number="pageSize" :class="L.pagSizeSelect">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
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

  <!-- Modale de refus -->
  <ModalShell :open="rejectModal.open" :title="t('absence.reject_modal.title', { name: rejectModal.employeeName })" max-width="max-w-[420px]" @close="closeRejectModal">
    <label :class="cls.fieldLabel">{{ t('absence.reject_modal.label') }}</label>
    <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" :placeholder="t('absence.reject_modal.placeholder')" rows="4"></textarea>
    <div v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</div>
    <template #footer>
      <button :class="cls.btnPrimary" @click="confirmReject">{{ t('absence.actions.confirm_reject') }}</button>
      <button :class="cls.btnOutline" @click="closeRejectModal">{{ t('absence.actions.cancel') }}</button>
    </template>
  </ModalShell>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus, ChevronDown, Search, Filter, Columns3, X, GripVertical, Pin,
  CircleAlert, CalendarOff, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-vue-next'
import { AppSidebar, AppTopNav, StatusPill } from '../../components'
import ModalShell from '../../components/ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useAuthStore } from '../../stores/auth'
import { useLeavesStore } from '../../stores/leaves'
import type { LeaveRequest } from '../../types'

const auth   = useAuthStore()
const leaves = useLeavesStore()
const { t }  = useI18n()

// ── Toolbar state ────────────────────────────────────────────
const showFilters = ref(false)
const showColumns = ref(false)
const searchQuery = ref('')
const colsBtnRef  = ref<HTMLElement | null>(null)
const colsDropRef = ref<HTMLElement | null>(null)

function sortIcon(key: string) {
  if (sortKey.value !== key) return ArrowUpDown
  return sortDir.value === 'asc' ? ArrowUp : ArrowDown
}

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
</script>
