<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar role="rh" />
      <main class="content">

        <div class="page-header">
          <div>
            <div class="page-title">{{ t('dashboard.welcome') }}</div>
            <div class="page-sub">{{ t('dashboard.greeting') }} {{ auth.user?.name }} — {{ today }}</div>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline">
              <i class="ti ti-file-export" aria-hidden="true"></i> {{ t('dashboard.export') }}
            </button>
            <button class="btn btn-primary" @click="openCreateModal">
              <i class="ti ti-plus" aria-hidden="true"></i> {{ t('dashboard.new_request') }}
            </button>
          </div>
        </div>

        <!-- KPIs -->
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-accent" style="background:#E6F1FB">
              <i class="ti ti-users" style="color:#185FA5" aria-hidden="true"></i>
            </div>
            <div class="kpi-label">{{ t('dashboard.active_employees') }}</div>
            <div class="kpi-value">47</div>
            <div class="kpi-sub">+2 {{ t('dashboard.this_month') }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-accent" style="background:#FEF5E1">
              <i class="ti ti-clock" style="color:#8A5A0A" aria-hidden="true"></i>
            </div>
            <div class="kpi-label">{{ t('dashboard.pending') }}</div>
            <div class="kpi-value">{{ pending.length }}</div>
            <div class="kpi-sub">{{ t('dashboard.to_process') }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-accent" style="background:#EAF4EC">
              <i class="ti ti-check" style="color:#2D7A3F" aria-hidden="true"></i>
            </div>
            <div class="kpi-label">{{ t('dashboard.approved_month') }}</div>
            <div class="kpi-value">12</div>
            <div class="kpi-sub">{{ t('dashboard.leaves_absences') }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-accent" style="background:#FCEBEB">
              <i class="ti ti-user-off" style="color:#A32D2D" aria-hidden="true"></i>
            </div>
            <div class="kpi-label">{{ t('dashboard.absent_today') }}</div>
            <div class="kpi-value">3</div>
            <div class="kpi-sub">{{ t('dashboard.on_employees', { count: 47 }) }}</div>
          </div>
        </div>

        <!-- Demandes -->
        <div class="card" style="margin-bottom:12px">
          <div class="card-header">
            <div class="card-title">
              <i class="ti ti-calendar-event" aria-hidden="true"></i>
              {{ t('absence.pending_title') }}
              <span class="badge-count">{{ pending.length }}</span>
            </div>
            <router-link :to="{ name: 'rh-leaves' }" class="link-small">{{ t('absence.see_all') }}</router-link>
          </div>
          <div class="tabs">
            <div class="tab" :class="{ active: tab === 'pending'  }" @click="tab = 'pending'">
              {{ t('absence.tabs.pending', { count: pending.length }) }}
            </div>
            <div class="tab" :class="{ active: tab === 'approved' }" @click="tab = 'approved'">
              {{ t('absence.tabs.approved', { count: approved.length }) }}
            </div>
          </div>
          <div v-for="r in activeRequests" :key="r.id" class="req-row">
            <div class="req-avatar" :style="{ background: r.avatarColor, color: r.avatarTextColor }">
              {{ r.employeeInitials }}
            </div>
            <div class="req-info">
              <div class="req-name">{{ r.employeeName }}</div>
              <div class="req-detail">{{ typeLabel(r.type) }} · {{ r.startDate }} → {{ r.endDate }} · {{ r.workingDays }} jour{{ r.workingDays > 1 ? 's' : '' }}</div>
            </div>
            <span class="status-pill" :class="pillClass(r.status)">
              {{ statusLabel(r.status) }}
            </span>
            <div v-if="r.status === 'pending'" class="action-btns">
              <button class="act-btn act-approve" @click="approve(r.id)">{{ t('absence.actions.approve') }}</button>
              <button class="act-btn act-reject"  @click="openRejectModal(r)">{{ t('absence.actions.reject') }}</button>
            </div>
            <button v-else class="act-btn act-view">{{ t('absence.actions.view') }}</button>
          </div>
        </div>

        <!-- Soldes + Calendrier -->
        <div class="two-col">

          <!-- Soldes individuels -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i class="ti ti-chart-bar" aria-hidden="true"></i> {{ t('absence.balances_title') }}
              </div>
            </div>
            <div class="bal-table-wrapper">
              <table class="bal-table">
                <thead>
                  <tr>
                    <th @click="balSort('name')">
                      <div class="th-inner">
                        <span class="th-drag"><i class="ti ti-grip-vertical"></i></span>
                        {{ t('absence.fields.employee') }}
                        <span class="th-sort">
                          <i v-if="balSortKey==='name'&&balSortDir==='asc'"  class="ti ti-arrow-up sort-active"></i>
                          <i v-else-if="balSortKey==='name'&&balSortDir==='desc'" class="ti ti-arrow-down sort-active"></i>
                          <i v-else class="ti ti-arrows-sort sort-idle"></i>
                        </span>
                      </div>
                    </th>
                    <th @click="balSort('congeAnnuel')" :title="t('absence.types.annual')">
                      <div class="th-inner">{{ t('absence.types.annual') }}
                        <span class="th-sort">
                          <i v-if="balSortKey==='congeAnnuel'&&balSortDir==='asc'"  class="ti ti-arrow-up sort-active"></i>
                          <i v-else-if="balSortKey==='congeAnnuel'&&balSortDir==='desc'" class="ti ti-arrow-down sort-active"></i>
                          <i v-else class="ti ti-arrows-sort sort-idle"></i>
                        </span>
                      </div>
                    </th>
                    <th @click="balSort('recuperation')" :title="t('absence.types.recovery')">
                      <div class="th-inner">{{ t('absence.types.recovery') }}
                        <span class="th-sort">
                          <i v-if="balSortKey==='recuperation'&&balSortDir==='asc'"  class="ti ti-arrow-up sort-active"></i>
                          <i v-else-if="balSortKey==='recuperation'&&balSortDir==='desc'" class="ti ti-arrow-down sort-active"></i>
                          <i v-else class="ti ti-arrows-sort sort-idle"></i>
                        </span>
                      </div>
                    </th>
                    <th @click="balSort('maladie')" :title="t('absence.types.sick')">
                      <div class="th-inner">{{ t('absence.types.sick') }}
                        <span class="th-sort">
                          <i v-if="balSortKey==='maladie'&&balSortDir==='asc'"  class="ti ti-arrow-up sort-active"></i>
                          <i v-else-if="balSortKey==='maladie'&&balSortDir==='desc'" class="ti ti-arrow-down sort-active"></i>
                          <i v-else class="ti ti-arrows-sort sort-idle"></i>
                        </span>
                      </div>
                    </th>
                    <th @click="balSort('teletravail')" :title="t('absence.types.remote')">
                      <div class="th-inner">{{ t('absence.types.remote') }}
                        <span class="th-sort">
                          <i v-if="balSortKey==='teletravail'&&balSortDir==='asc'"  class="ti ti-arrow-up sort-active"></i>
                          <i v-else-if="balSortKey==='teletravail'&&balSortDir==='desc'" class="ti ti-arrow-down sort-active"></i>
                          <i v-else class="ti ti-arrows-sort sort-idle"></i>
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="e in sortedBalances" :key="e.name">
                    <td>
                      <div class="emp-cell">
                        <div class="emp-avatar-sm" :style="{ background: e.avatarColor, color: e.avatarTextColor }">{{ e.initials }}</div>
                        <span>{{ e.name }}</span>
                      </div>
                    </td>
                    <td class="bal-num">{{ e.congeAnnuel }}j</td>
                    <td class="bal-num">{{ e.recuperation }}j</td>
                    <td class="bal-num">{{ e.maladie }}j</td>
                    <td class="bal-num">{{ e.teletravail }}j</td>
                  </tr>
                </tbody>
              </table>
              <!-- Pagination soldes -->
              <div class="bal-pagination">
                <span class="pag-total">{{ t('absence.employees_total', { count: employeeBalances.length }) }}</span>
                <div class="pag-perpage">
                  {{ t('absence.per_page') }}
                  <select v-model.number="balPageSize" class="pag-size-select">
                    <option :value="5">5</option>
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                  </select>
                </div>
                <div class="pag-pages" v-if="balTotalPages > 1">
                  <button class="pag-btn pag-arrow" :disabled="balPage === 1" @click="balPage--">
                    <i class="ti ti-chevron-left"></i>
                  </button>
                  <button
                    v-for="p in balTotalPages" :key="p"
                    class="pag-btn" :class="{ active: p === balPage }"
                    @click="balPage = p"
                  >{{ p }}</button>
                  <button class="pag-btn pag-arrow" :disabled="balPage === balTotalPages" @click="balPage++">
                    <i class="ti ti-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Calendrier dynamique -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i class="ti ti-calendar" aria-hidden="true"></i>
                <span style="text-transform:capitalize">{{ calTitle }}</span>
              </div>
              <div class="cal-nav">
                <button class="cal-nav-btn" @click="prevMonth"><i class="ti ti-chevron-left"></i></button>
                <button class="cal-nav-btn" @click="nextMonth"><i class="ti ti-chevron-right"></i></button>
              </div>
            </div>
            <div class="cal-grid">
              <div v-for="d in weekDays" :key="d" class="cal-hdr">{{ d }}</div>
              <div
                v-for="(day, i) in calDays"
                :key="i"
                class="cal-day"
                :class="[day.cls, day.hasLeave ? 'has-leave' : '']"
                @mouseenter="day.dateStr ? showTooltip($event, day.dateStr) : undefined"
                @mouseleave="hideTooltip"
              >
                {{ day.n ?? '' }}
              </div>
            </div>
            <div class="legend">
              <span class="leg"><span class="leg-dot" style="background:#B5D4F4"></span>{{ t('absence.types.annual') }}</span>
              <span class="leg"><span class="leg-dot" style="background:#FAC775"></span>{{ t('absence.types.remote') }}</span>
              <span class="leg"><span class="leg-dot" style="background:#E8601C"></span>Aujourd'hui</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  </div>

<!-- Tooltip calendrier -->
<Teleport to="body">
  <div v-if="tooltip.visible" class="cal-tooltip" :style="tooltipStyle">
    <div v-for="(line, idx) in tooltip.lines" :key="idx" class="tooltip-line">
      <span v-if="line.color" class="tooltip-dot" :style="{ background: line.color }"></span>
      {{ line.text }}
    </div>
  </div>
</Teleport>

<!-- Modale de création -->
<Teleport to="body">
  <div v-if="createModal.open" class="overlay" @click.self="closeCreateModal">
    <div class="modal-card modal-card--lg">
      <div class="modal-header">
        <div class="modal-title">{{ t('absence.new') }}</div>
        <button class="modal-close" @click="closeCreateModal"><i class="ti ti-x"></i></button>
      </div>

      <div class="cform-field">
        <label class="modal-label">{{ t('absence.fields.employee') }} *</label>
        <select v-model="createModal.employeeName" class="cform-input" :class="{ 'input-error': createModal.errors.employeeName }">
          <option value="">{{ t('absence.select_employee') }}</option>
          <option v-for="e in employeeList" :key="e.name" :value="e.name">{{ e.name }}</option>
        </select>
        <div v-if="createModal.errors.employeeName" class="modal-error">{{ createModal.errors.employeeName }}</div>
      </div>

      <div class="cform-field">
        <label class="modal-label">{{ t('absence.fields.type') }} *</label>
        <select v-model="createModal.type" class="cform-input" :class="{ 'input-error': createModal.errors.type }">
          <option value="">{{ t('absence.select_type') }}</option>
          <option v-for="lt in leaveTypes" :key="lt" :value="lt">{{ typeLabel(lt) }}</option>
        </select>
        <div v-if="createModal.errors.type" class="modal-error">{{ createModal.errors.type }}</div>
      </div>

      <div class="cform-row">
        <div class="cform-field">
          <label class="modal-label">{{ t('absence.fields.start_date') }} *</label>
          <input type="date" v-model="createModal.startDate" class="cform-input" :class="{ 'input-error': createModal.errors.startDate }" />
          <div v-if="createModal.errors.startDate" class="modal-error">{{ createModal.errors.startDate }}</div>
        </div>
        <div class="cform-field">
          <label class="modal-label">{{ t('absence.fields.end_date') }} *</label>
          <input type="date" v-model="createModal.endDate" class="cform-input" :class="{ 'input-error': createModal.errors.endDate }" :min="createModal.startDate || undefined" />
          <div v-if="createModal.errors.endDate" class="modal-error">{{ createModal.errors.endDate }}</div>
        </div>
      </div>

      <div v-if="createWorkingDays > 0" class="days-badge">
        <i class="ti ti-sun"></i> {{ t('absence.fields.working_days', { count: createWorkingDays }) }}
      </div>

      <div class="cform-field">
        <label class="modal-label">
          {{ t('absence.fields.reason') }}
          <span style="font-weight:400;color:var(--p247-muted)">({{ t('absence.optional') }})</span>
        </label>
        <textarea v-model="createModal.reason" class="modal-textarea" rows="3" placeholder="Informations complémentaires..."></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" @click="confirmCreate">
          <i class="ti ti-send"></i> {{ t('absence.actions.submit') }}
        </button>
        <button class="btn btn-outline" @click="closeCreateModal">{{ t('absence.actions.cancel') }}</button>
      </div>
    </div>
  </div>
</Teleport>

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
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppSidebar, AppTopNav } from '../components'
import { useAuthStore } from '../stores/auth'
import { useLeavesStore } from '../stores/leaves'
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types'

const auth   = useAuthStore()
const leaves = useLeavesStore()
const { t, locale } = useI18n()

const today = new Date().toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

const leaveTypes: LeaveType[] = [
  'Congé annuel', 'Congé maladie', 'Récupération', 'Télétravail', 'Congé maternité',
]

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

const employeeList = [
  { name: 'Aminata Diallo',      initials: 'AD', avatarColor: '#B5D4F4', avatarTextColor: '#0C447C' },
  { name: 'Kofi Mensah',         initials: 'KM', avatarColor: '#C0DD97', avatarTextColor: '#3B6D11' },
  { name: 'Fatou Sow',           initials: 'FS', avatarColor: '#F4C0D1', avatarTextColor: '#72243E' },
  { name: 'Jean-Pierre Mvondo',  initials: 'JP', avatarColor: '#FAC775', avatarTextColor: '#633806' },
  { name: 'Rose Nkeng',          initials: 'RN', avatarColor: '#AFA9EC', avatarTextColor: '#3C3489' },
  { name: 'Ibrahim Touré',       initials: 'IT', avatarColor: '#B5D4F4', avatarTextColor: '#0C447C' },
  { name: 'Nadia Eze',           initials: 'NE', avatarColor: '#C0DD97', avatarTextColor: '#3B6D11' },
  { name: 'Samuel Osei',         initials: 'SO', avatarColor: '#FAC775', avatarTextColor: '#633806' },
]

// ── Création modale ──────────────────────────────────────────
const createModal = reactive({
  open: false,
  employeeName: '',
  type: '' as LeaveType | '',
  startDate: '',
  endDate: '',
  reason: '',
  errors: { employeeName: '', type: '', startDate: '', endDate: '' },
})

const createWorkingDays = computed(() => {
  if (!createModal.startDate || !createModal.endDate) return 0
  if (createModal.endDate < createModal.startDate) return 0
  return leaves.calculateWorkingDays(createModal.startDate, createModal.endDate)
})

function openCreateModal() {
  createModal.open = true
  createModal.employeeName = ''
  createModal.type = ''
  createModal.startDate = ''
  createModal.endDate = ''
  createModal.reason = ''
  createModal.errors = { employeeName: '', type: '', startDate: '', endDate: '' }
}
function closeCreateModal() { createModal.open = false }

function confirmCreate() {
  createModal.errors = { employeeName: '', type: '', startDate: '', endDate: '' }
  let ok = true
  if (!createModal.employeeName) { createModal.errors.employeeName = t('validation.required_employee'); ok = false }
  if (!createModal.type)         { createModal.errors.type = t('validation.required_type');      ok = false }
  if (!createModal.startDate)    { createModal.errors.startDate = t('validation.required_start'); ok = false }
  if (!createModal.endDate)      { createModal.errors.endDate = t('validation.required_end');     ok = false }
  else if (createModal.startDate && createModal.endDate < createModal.startDate) {
    createModal.errors.endDate = t('validation.end_before_start')
    ok = false
  }
  if (!ok) return
  const emp = employeeList.find(e => e.name === createModal.employeeName)
  const todayStr = new Date().toISOString().slice(0, 10)
  requests.value.unshift({
    id: Date.now(),
    employeeName:     createModal.employeeName,
    employeeInitials: emp?.initials ?? '??',
    avatarColor:      emp?.avatarColor ?? '#ccc',
    avatarTextColor:  emp?.avatarTextColor ?? '#333',
    type:             createModal.type as LeaveType,
    startDate:        createModal.startDate,
    endDate:          createModal.endDate,
    workingDays:      createWorkingDays.value,
    reason:           createModal.reason || undefined,
    status:           'pending',
    submittedAt:      todayStr,
  })
  closeCreateModal()
}

// ── Demandes ─────────────────────────────────────────────────
const tab = ref<'pending' | 'approved'>('pending')

const requests = ref<LeaveRequest[]>([
  { id:1, employeeName:'Aminata Diallo',     employeeInitials:'AD', avatarColor:'#B5D4F4', avatarTextColor:'#0C447C', type:'Congé annuel',    startDate:'2026-07-10', endDate:'2026-07-17', workingDays:6,  status:'pending',  submittedAt:'2026-06-20' },
  { id:2, employeeName:'Kofi Mensah',        employeeInitials:'KM', avatarColor:'#C0DD97', avatarTextColor:'#3B6D11', type:'Congé maladie',   startDate:'2026-07-02', endDate:'2026-07-05', workingDays:4,  status:'pending',  submittedAt:'2026-07-01' },
  { id:3, employeeName:'Fatou Sow',          employeeInitials:'FS', avatarColor:'#F4C0D1', avatarTextColor:'#72243E', type:'Récupération',    startDate:'2026-07-08', endDate:'2026-07-08', workingDays:1,  status:'approved', submittedAt:'2026-06-25' },
  { id:4, employeeName:'Jean-Pierre Mvondo', employeeInitials:'JP', avatarColor:'#FAC775', avatarTextColor:'#633806', type:'Télétravail',     startDate:'2026-07-07', endDate:'2026-07-11', workingDays:5,  status:'pending',  submittedAt:'2026-06-28' },
  { id:5, employeeName:'Rose Nkeng',         employeeInitials:'RN', avatarColor:'#AFA9EC', avatarTextColor:'#3C3489', type:'Congé maternité', startDate:'2026-07-01', endDate:'2026-09-30', workingDays:65, status:'approved', submittedAt:'2026-05-15' },
])

const pending        = computed(() => requests.value.filter(r => r.status === 'pending'))
const approved       = computed(() => requests.value.filter(r => r.status === 'approved'))
const activeRequests = computed(() => tab.value === 'pending' ? pending.value : approved.value)

function approve(id: number) {
  const r = requests.value.find(r => r.id === id)
  if (r) r.status = 'approved'
}

const rejectModal = reactive({ open: false, id: 0, employeeName: '', reason: '', error: '' })

function openRejectModal(r: LeaveRequest) {
  Object.assign(rejectModal, { open: true, id: r.id, employeeName: r.employeeName, reason: '', error: '' })
}
function closeRejectModal() { rejectModal.open = false }

function confirmReject() {
  if (!rejectModal.reason.trim()) {
    rejectModal.error = t('absence.reject_modal.error_empty')
    return
  }
  if (rejectModal.reason.trim().length < 10) {
    rejectModal.error = t('absence.reject_modal.error_short')
    return
  }
  const r = requests.value.find(r => r.id === rejectModal.id)
  if (r) { r.status = 'rejected'; r.rejectionReason = rejectModal.reason.trim() }
  closeRejectModal()
}

function pillClass(s: LeaveStatus) {
  return {
    'pill-pending':  s === 'pending',
    'pill-approved': s === 'approved',
    'pill-rejected': s === 'rejected',
  }
}
function statusLabel(s: LeaveStatus): string {
  const map: Record<LeaveStatus, string> = {
    draft:     t('absence.status.draft'),
    pending:   t('absence.status.pending'),
    approved:  t('absence.status.approved'),
    rejected:  t('absence.status.rejected'),
    cancelled: t('absence.status.cancelled'),
  }
  return map[s]
}

// ── Soldes individuels ────────────────────────────────────────
const balSortKey  = ref('name')
const balSortDir  = ref<'asc' | 'desc'>('asc')
const balPage     = ref(1)
const balPageSize = ref(5)

function balSort(key: string) {
  if (balSortKey.value === key) balSortDir.value = balSortDir.value === 'asc' ? 'desc' : 'asc'
  else { balSortKey.value = key; balSortDir.value = 'asc' }
}

const employeeBalances = [
  { name: 'Aminata Diallo',     initials: 'AD', avatarColor: '#B5D4F4', avatarTextColor: '#0C447C', congeAnnuel: 12, recuperation: 3, maladie: 8,  teletravail: 5  },
  { name: 'Kofi Mensah',        initials: 'KM', avatarColor: '#C0DD97', avatarTextColor: '#3B6D11', congeAnnuel: 18, recuperation: 0, maladie: 5,  teletravail: 8  },
  { name: 'Fatou Sow',          initials: 'FS', avatarColor: '#F4C0D1', avatarTextColor: '#72243E', congeAnnuel: 6,  recuperation: 2, maladie: 0,  teletravail: 10 },
  { name: 'Jean-Pierre Mvondo', initials: 'JP', avatarColor: '#FAC775', avatarTextColor: '#633806', congeAnnuel: 24, recuperation: 5, maladie: 3,  teletravail: 2  },
  { name: 'Rose Nkeng',         initials: 'RN', avatarColor: '#AFA9EC', avatarTextColor: '#3C3489', congeAnnuel: 0,  recuperation: 0, maladie: 0,  teletravail: 0  },
]

const sortedBalances = computed(() => {
  const list = [...employeeBalances].sort((a, b) => {
    const va = (a as any)[balSortKey.value]
    const vb = (b as any)[balSortKey.value]
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
    return balSortDir.value === 'asc' ? cmp : -cmp
  })
  const start = (balPage.value - 1) * balPageSize.value
  return list.slice(start, start + balPageSize.value)
})
const balTotalPages = computed(() => Math.max(1, Math.ceil(employeeBalances.length / balPageSize.value)))

// ── Calendrier dynamique ──────────────────────────────────────
const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const _now     = new Date()
const calYear  = ref(_now.getFullYear())
const calMonth = ref(_now.getMonth())

const calTitle = computed(() =>
  new Date(calYear.value, calMonth.value, 1)
    .toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })
)

function prevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}
function nextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}

interface CalDay { n: number | null; dateStr: string | null; cls: string; hasLeave: boolean }

const calDays = computed((): CalDay[] => {
  const y = calYear.value
  const m = calMonth.value
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const firstDay    = (new Date(y, m, 1).getDay() + 6) % 7
  const todayObj    = new Date()
  const isThisMonth = todayObj.getFullYear() === y && todayObj.getMonth() === m
  const todayNum    = isThisMonth ? todayObj.getDate() : -1
  const result: CalDay[] = []

  for (let i = 0; i < firstDay; i++) result.push({ n: null, dateStr: null, cls: 'empty', hasLeave: false })

  for (let d = 1; d <= daysInMonth; d++) {
    const mm      = String(m + 1).padStart(2, '0')
    const dd      = String(d).padStart(2, '0')
    const dateStr = `${y}-${mm}-${dd}`
    const hasLeave = leaves.allLeaves.some(
      l => l.status === 'approved' && l.startDate <= dateStr && l.endDate >= dateStr
    )
    result.push({ n: d, dateStr, cls: d === todayNum ? 'today' : '', hasLeave })
  }
  return result
})

// ── Tooltip ───────────────────────────────────────────────────
const typeColors: Record<string, string> = {
  'Congé annuel':    '#B5D4F4',
  'Congé maladie':   '#C0DD97',
  'Congé maternité': '#F4C0D1',
  'Récupération':    '#FAC775',
  'Télétravail':     '#AFA9EC',
}

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  above: false,
  lines: [] as { text: string; color: string }[],
})

const tooltipStyle = computed(() => ({
  position: 'fixed' as const,
  left: tooltip.x + 'px',
  top:  tooltip.y + 'px',
  transform: `translateX(-50%)${tooltip.above ? ' translateY(-100%) translateY(-8px)' : ' translateY(8px)'}`,
  zIndex: 9999,
  pointerEvents: 'none' as const,
}))

function showTooltip(event: MouseEvent, dateStr: string) {
  const rect    = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const matches = leaves.allLeaves.filter(
    l => l.status === 'approved' && l.startDate <= dateStr && l.endDate >= dateStr
  )
  tooltip.lines = matches.length > 0
    ? matches.map(l => ({ text: `${l.employeeName} — ${typeLabel(l.type)}`, color: typeColors[l.type] ?? '#ccc' }))
    : [{ text: t('absence.no_absence'), color: '' }]
  tooltip.x     = rect.left + rect.width / 2
  tooltip.above = rect.top > window.innerHeight / 2
  tooltip.y     = tooltip.above ? rect.top : rect.bottom
  tooltip.visible = true
}

function hideTooltip() { tooltip.visible = false }
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--p247-bg); overflow-y: auto; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }

.page-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.page-title   { font-size: 18px; font-weight: 600; }
.page-sub     { font-size: 13px; color: var(--p247-muted); margin-top: 1px; }
.header-actions { display: flex; gap: 8px; }

.btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; transition: all .12s; }
.btn-primary  { background: var(--p247-orange); color: white; }
.btn-primary:hover  { background: var(--p247-orange-dark); }
.btn-outline  { background: white; color: var(--p247-text); border: 0.5px solid var(--p247-border); }
.btn-outline:hover  { background: var(--p247-bg); }

.kpi-row  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
.kpi-card { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; padding: 12px 14px; }
.kpi-accent { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; font-size: 17px; }
.kpi-label  { font-size: 13px; color: var(--p247-muted); margin-bottom: 4px; }
.kpi-value  { font-size: 28px; font-weight: 600; line-height: 1; }
.kpi-sub    { font-size: 12px; color: var(--p247-muted); margin-top: 3px; }

.card       { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; padding: 14px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-title  { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: var(--p247-text); }
.card-title i { color: var(--p247-orange); }
.badge-count { background: var(--p247-orange); color: white; font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 10px; }
.link-small  { font-size: 12px; color: var(--p247-info); cursor: pointer; text-decoration: none; }

.tabs { display: flex; border-bottom: 0.5px solid var(--p247-border); margin-bottom: 14px; }
.tab  { padding: 8px 14px; font-size: 13px; color: var(--p247-muted); cursor: pointer; border-bottom: 2px solid transparent; }
.tab.active { color: var(--p247-orange); border-bottom-color: var(--p247-orange); font-weight: 500; }

.req-row    { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 0.5px solid var(--p247-border); }
.req-row:last-child { border-bottom: none; }
.req-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.req-info   { flex: 1; }
.req-name   { font-size: 14px; font-weight: 500; }
.req-detail { font-size: 12px; color: var(--p247-muted); }
.status-pill { font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.pill-pending  { background: var(--p247-warning-bg); color: var(--p247-warning); }
.pill-approved { background: var(--p247-success-bg); color: var(--p247-success); }
.pill-rejected { background: var(--p247-danger-bg);  color: var(--p247-danger);  }
.action-btns { display: flex; gap: 4px; }
.act-btn     { padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; }
.act-approve { background: var(--p247-success-bg); color: var(--p247-success); }
.act-reject  { background: var(--p247-danger-bg);  color: var(--p247-danger);  }
.act-view    { background: var(--p247-bg); color: var(--p247-muted); }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.cal-nav     { display: flex; gap: 4px; }
.cal-nav-btn { background: none; border: 0.5px solid var(--p247-border); border-radius: 4px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--p247-muted); font-size: 12px; transition: all .12s; }
.cal-nav-btn:hover { background: var(--p247-bg); color: var(--p247-text); }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-hdr  { font-size: 12px; color: var(--p247-muted); text-align: center; padding: 3px 0; font-weight: 500; }
.cal-day  { font-size: 12px; text-align: center; padding: 5px 2px; border-radius: 4px; cursor: pointer; color: var(--p247-text); position: relative; }
.cal-day:hover   { background: var(--p247-bg); }
.cal-day.today   { background: var(--p247-orange); color: white; font-weight: 600; }
.cal-day.has-leave { background: #E6F1FB; color: #185FA5; font-weight: 500; }
.cal-day.empty   { color: transparent; pointer-events: none; }
.legend  { display: flex; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
.leg     { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--p247-muted); }
.leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Tooltip */
.cal-tooltip { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 6px; padding: 8px 10px; font-size: 11px; color: var(--p247-text); box-shadow: 0 2px 8px rgba(0,0,0,.12); min-width: 160px; max-width: 240px; }
.tooltip-line { display: flex; align-items: center; gap: 6px; padding: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tooltip-dot  { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* Soldes individuels */
.bal-table-wrapper { overflow-x: auto; }
.bal-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.bal-table th {
  padding: 9px 10px; text-align: left; font-size: 12px; font-weight: 600;
  color: var(--p247-text); background: #f5e3e0; border-bottom: 1px solid #e8c9c4;
  white-space: nowrap; cursor: pointer; user-select: none;
}
.bal-table th:hover { background: #f0d5d1; }
.bal-table td { padding: 8px 10px; border-bottom: 0.5px solid var(--p247-border); }
.bal-table tbody tr:last-child td { border-bottom: none; }
.bal-table tbody tr:hover td { background: #fdf5f4; }

.th-inner  { display: flex; align-items: center; gap: 5px; }
.th-drag   { color: #c9a09a; font-size: 11px; cursor: grab; }
.th-sort   { margin-left: auto; font-size: 11px; }
.sort-idle   { color: #c9a09a; }
.sort-active { color: var(--p247-orange); }
.bal-num { text-align: center; font-weight: 500; color: var(--p247-text); }
.emp-cell { display: flex; align-items: center; gap: 6px; }
.emp-avatar-sm { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 600; flex-shrink: 0; }

/* Pagination soldes */
.bal-pagination {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 10px; border-top: 0.5px solid var(--p247-border);
  font-size: 12px; color: var(--p247-muted);
}
.pag-total   { flex: 1; white-space: nowrap; font-size: 11px; }
.pag-perpage { display: flex; align-items: center; gap: 5px; font-size: 11px; white-space: nowrap; }
.pag-size-select {
  height: 24px; padding: 0 5px; border: 0.5px solid var(--p247-border); border-radius: 4px;
  font-size: 11px; color: var(--p247-text); background: var(--p247-white); outline: none; cursor: pointer;
}
.pag-size-select:focus { border-color: var(--p247-orange); }
.pag-pages { display: flex; align-items: center; gap: 3px; }
.pag-btn   {
  min-width: 26px; height: 26px; padding: 0 5px;
  border-radius: 4px; font-size: 11px; font-weight: 500;
  cursor: pointer; border: 0.5px solid var(--p247-border);
  background: var(--p247-white); color: var(--p247-text);
  display: flex; align-items: center; justify-content: center; transition: all .12s;
}
.pag-btn:hover:not(:disabled) { background: var(--p247-bg); }
.pag-btn.active  { background: var(--p247-orange); color: white; border-color: var(--p247-orange); }
.pag-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pag-arrow { color: var(--p247-muted); }

/* Modale */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card--lg { width: 520px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 16px; color: var(--p247-muted); padding: 0; line-height: 1; }
.modal-close:hover { color: var(--p247-text); }
.cform-field { display: flex; flex-direction: column; gap: 4px; }
.cform-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cform-input { height: 34px; padding: 0 10px; border: 0.5px solid var(--p247-border); border-radius: 6px; font-size: 12px; color: var(--p247-text); background: var(--p247-white); outline: none; transition: border-color .12s; }
.cform-input:focus { border-color: var(--p247-orange); }
.input-error  { border-color: var(--p247-danger) !important; }
.days-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--p247-orange-light); color: var(--p247-orange); font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px; align-self: flex-start; }
.modal-card { background: var(--p247-white); border-radius: 10px; padding: 24px; width: 420px; max-width: 90vw; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.18); }
.modal-title { font-size: 14px; font-weight: 600; }
.modal-label { font-size: 12px; font-weight: 500; }
.modal-textarea { width: 100%; border: 0.5px solid var(--p247-border); border-radius: 6px; padding: 8px 10px; font-size: 12px; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box; }
.modal-textarea:focus { border-color: var(--p247-orange); }
.modal-error { font-size: 11px; color: var(--p247-danger); }
.modal-actions { display: flex; gap: 8px; }
</style>
