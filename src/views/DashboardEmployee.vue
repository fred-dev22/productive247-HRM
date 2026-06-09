<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <div class="page-header">
          <div>
            <div class="page-title">{{ t('dashboard.welcome_employee') }}</div>
            <div class="page-sub">{{ auth.user?.name }}</div>
          </div>
          <button class="btn btn-primary" @click="openModal()">
            <i class="ti ti-plus" aria-hidden="true"></i> {{ t('absence.new') }}
          </button>
        </div>

        <div class="kpi-row">
          <div class="kpi-card" style="border-top: 3px solid var(--p247-orange)">
            <div class="kpi-label">{{ t('balances.annual') }}</div>
            <div class="kpi-value" style="color:var(--p247-orange)">12</div>
            <div class="kpi-sub">{{ t('balances.on', { total: 24 }) }}</div>
          </div>
          <div class="kpi-card" style="border-top: 3px solid var(--p247-success)">
            <div class="kpi-label">{{ t('balances.recovery') }}</div>
            <div class="kpi-value" style="color:var(--p247-success)">3</div>
            <div class="kpi-sub">{{ t('balances.acquired') }}</div>
          </div>
          <div class="kpi-card" style="border-top: 3px solid var(--p247-success)">
            <div class="kpi-label">{{ t('balances.sick') }}</div>
            <div class="kpi-value" style="color:var(--p247-success)">8</div>
            <div class="kpi-sub">{{ t('balances.available') }}</div>
          </div>
          <div class="kpi-card" style="border-top: 3px solid #854F0B">
            <div class="kpi-label">{{ t('balances.remote') }}</div>
            <div class="kpi-value" style="color:#854F0B">5</div>
            <div class="kpi-sub">{{ t('balances.used') }}</div>
          </div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i class="ti ti-list" aria-hidden="true"></i> {{ t('absence.my_requests') }}
              </div>
              <router-link :to="{ name: 'employee-absences' }" class="link-small">
                {{ t('absence.history') }}
              </router-link>
            </div>
            <div v-for="r in myRequests" :key="r.id" class="req-row">
              <div class="req-info">
                <div class="req-name">{{ typeLabel(r.type) }}</div>
                <div class="req-detail">{{ r.startDate }} → {{ r.endDate }} · {{ r.workingDays }} jour{{ r.workingDays > 1 ? 's' : '' }}</div>
              </div>
              <span class="status-pill" :class="pillClass(r.status)">
                {{ statusLabel(r.status) }}
              </span>
              <button v-if="r.status === 'pending'" class="act-btn act-cancel" style="font-size:10px">
                {{ t('absence.actions.cancel') }}
              </button>
              <button v-else class="act-btn act-view">{{ t('absence.actions.view') }}</button>
            </div>
            <div class="quick-actions">
              <button class="btn btn-outline" style="font-size:11px" @click="openModal('Télétravail')">
                <i class="ti ti-building" aria-hidden="true"></i> {{ t('absence.types.remote') }}
              </button>
              <button class="btn btn-outline" style="font-size:11px" @click="openModal('Récupération')">
                <i class="ti ti-clock" aria-hidden="true"></i> {{ t('absence.types.recovery') }}
              </button>
              <button class="btn btn-outline" style="font-size:11px" @click="router.push({ name: 'employee-missions' })">
                <i class="ti ti-plane" aria-hidden="true"></i> {{ t('nav.my_missions') }}
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i class="ti ti-calendar" aria-hidden="true"></i> {{ t('absence.calendar_title') }} — Juillet 2026
              </div>
            </div>
            <div class="cal-grid">
              <div v-for="d in weekDays" :key="d" class="cal-hdr">{{ d }}</div>
              <div v-for="(day, i) in calDays" :key="i" class="cal-day" :class="day.cls">
                {{ day.n ?? '' }}
              </div>
            </div>
            <div class="legend">
              <span class="leg"><span class="leg-dot" style="background:#B5D4F4"></span>{{ t('absence.types.annual') }}</span>
              <span class="leg"><span class="leg-dot" style="background:var(--p247-orange)"></span>Aujourd'hui</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- Modale nouvelle demande -->
  <AbsenceRequestModal
    v-model="showModal"
    mode="self"
    :initial-type="modalInitialType"
    @submitted="showToast(t('absence.submitted_toast'))"
    @drafted="showToast(t('absence.draft_saved'))"
  />

  <!-- Toast -->
  <div v-if="toastMsg" class="toast-fixed">
    <i class="ti ti-check" aria-hidden="true"></i> {{ toastMsg }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppSidebar, AppTopNav, AbsenceRequestModal } from '../components'
import { useAuthStore }    from '../stores/auth'
import { useAbsenceStore } from '../stores/absences'
import type { LeaveStatus, LeaveType } from '../types'

const auth   = useAuthStore()
const leaves = useAbsenceStore()
const { t }  = useI18n()
const router = useRouter()

const myRequests = computed(() => leaves.myLeaves.slice(0, 5))

// ── Modale ───────────────────────────────────────────────────
const showModal        = ref(false)
const modalInitialType = ref<LeaveType | ''>('')

function openModal(type: LeaveType | '' = '') {
  modalInitialType.value = type
  showModal.value = true
}

// ── Toast ────────────────────────────────────────────────────
const toastMsg = ref('')
function showToast(msg: string) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

// ── Helpers traduction ───────────────────────────────────────
const typeI18nKey: Record<string, string> = {
  'Congé annuel':              'absence.types.annual',
  'Congé maladie':             'absence.types.sick',
  'Récupération':              'absence.types.recovery',
  'Télétravail':               'absence.types.remote',
  'Congé maternité':           'absence.types.maternity',
  'Assistance parentale':      'absence.types.parental',
  'Permission exceptionnelle': 'absence.types.exceptional',
}

function typeLabel(type: string): string {
  const key = typeI18nKey[type]
  return key ? t(key) : type
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

// ── Calendrier (mock juillet 2026) ───────────────────────────
const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
interface CalDay { n: number | null; cls: string }
const calDays: CalDay[] = [
  ...Array<CalDay>(2).fill({ n: null, cls: 'empty' }),
  ...Array.from({ length: 31 }, (_, i): CalDay => {
    const n = i + 1
    return { n, cls: n === 15 ? 'today' : (n === 10 || n === 11) ? 'has-leave' : '' }
  }),
  ...Array<CalDay>(3).fill({ n: null, cls: 'empty' }),
]
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; }
.content     { flex: 1; padding: 24px 28px; background: var(--p247-bg); overflow-y: auto; }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.page-title  { font-size: 18px; font-weight: 600; }
.page-sub    { font-size: 13px; color: var(--p247-muted); }

.btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-primary { background: var(--p247-orange); color: white; }
.btn-primary:hover { background: var(--p247-orange-dark); }
.btn-outline { background: white; color: var(--p247-text); border: 0.5px solid var(--p247-border); }
.btn-outline:hover { background: var(--p247-bg); }

.kpi-row  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
.kpi-card { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; padding: 12px 14px; }
.kpi-label { font-size: 13px; color: var(--p247-muted); margin-bottom: 4px; }
.kpi-value { font-size: 28px; font-weight: 600; line-height: 1; }
.kpi-sub   { font-size: 12px; color: var(--p247-muted); margin-top: 3px; }

.two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.card      { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; padding: 14px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-title  { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; }
.card-title i { color: var(--p247-orange); }
.link-small  { font-size: 12px; color: var(--p247-info); cursor: pointer; text-decoration: none; }
.link-small:hover { text-decoration: underline; }

.req-row    { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 0.5px solid var(--p247-border); }
.req-row:last-child { border-bottom: none; }
.req-info   { flex: 1; }
.req-name   { font-size: 14px; font-weight: 500; }
.req-detail { font-size: 12px; color: var(--p247-muted); }

.status-pill   { font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.pill-pending  { background: var(--p247-warning-bg); color: var(--p247-warning); }
.pill-approved { background: var(--color-success-bg); color: var(--p247-success); }
.pill-rejected { background: var(--p247-danger-bg);  color: var(--p247-danger);  }
.pill-cancelled { background: var(--p247-bg); color: var(--p247-muted); }
.pill-draft    { background: transparent; color: #555; border: 0.5px solid #bbb; }

.act-btn     { padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; }
.act-cancel  { background: var(--p247-warning-bg); color: var(--p247-warning); }
.act-view    { background: var(--p247-bg); color: var(--p247-muted); }

.quick-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; padding-top: 10px; border-top: 0.5px solid var(--p247-border); }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-hdr  { font-size: 12px; color: var(--p247-muted); text-align: center; padding: 3px 0; font-weight: 500; }
.cal-day  { font-size: 12px; text-align: center; padding: 5px 2px; border-radius: 4px; cursor: pointer; color: var(--p247-text); }
.cal-day:hover      { background: var(--p247-bg); }
.cal-day.today      { background: var(--p247-orange); color: white; font-weight: 600; }
.cal-day.has-leave  { background: var(--color-success-bg); color: var(--p247-success); font-weight: 500; }
.cal-day.empty      { color: transparent; pointer-events: none; }

.legend  { display: flex; gap: 12px; margin-top: 10px; }
.leg     { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--p247-muted); }
.leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── Toast fixe ── */
.toast-fixed {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--color-success-bg);
  color: var(--p247-success);
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 2000;
}

@media (max-width: 768px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .two-col { grid-template-columns: 1fr; }
  .content { padding: 16px; }
}
</style>
