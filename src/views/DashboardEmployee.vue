<template>
  <div class="px-7 py-6 max-md:p-4">

        <div class="flex items-center justify-between mb-3.5">
          <div>
            <div class="text-lg font-semibold">{{ t('dashboard.welcome_employee') }}</div>
            <div class="text-[13px] text-muted-foreground">{{ auth.user?.name }}</div>
          </div>
          <button :class="btnPrimary" @click="openModal()">
            <Plus class="w-4 h-4" /> {{ t('absence.new') }}
          </button>
        </div>

        <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
          <div :class="kpiCard" class="border-t-[3px] border-t-primary">
            <div :class="kpiLabel">{{ t('balances.annual') }}</div>
            <div :class="kpiValue" class="text-primary">{{ balanceFor('ANNUAL') }}</div>
            <div :class="kpiSub">j disponibles</div>
          </div>
          <div :class="kpiCard" class="border-t-[3px] border-t-success">
            <div :class="kpiLabel">{{ t('balances.recovery') }}</div>
            <div :class="kpiValue" class="text-success">{{ balanceFor('RECOVERY') }}</div>
            <div :class="kpiSub">j disponibles</div>
          </div>
          <div :class="kpiCard" class="border-t-[3px] border-t-success">
            <div :class="kpiLabel">{{ t('balances.sick') }}</div>
            <div :class="kpiValue" class="text-success">{{ balanceFor('SICK') }}</div>
            <div :class="kpiSub">{{ t('balances.available') }}</div>
          </div>
          <div :class="kpiCard" class="border-t-[3px]" style="border-top-color:#854F0B">
            <div :class="kpiLabel">{{ t('balances.remote') }}</div>
            <div :class="kpiValue" style="color:#854F0B">{{ balanceFor('REMOTE') }}</div>
            <div :class="kpiSub">j disponibles</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <div :class="card">
            <div :class="cardHeader">
              <div :class="cardTitle">
                <List class="w-4 h-4 text-primary" /> {{ t('absence.my_requests') }}
              </div>
              <router-link :to="{ name: 'employee-absences' }" class="text-xs text-info no-underline hover:underline">
                {{ t('absence.history') }}
              </router-link>
            </div>
            <div v-for="r in myRequests" :key="r.id" class="flex items-center gap-2.5 py-[9px] border-b border-border last:border-b-0">
              <div class="flex-1">
                <div class="text-sm font-medium">{{ r.leaveTypeName }}</div>
                <div class="text-xs text-muted-foreground">{{ formatDate(r.startDate) }} → {{ formatDate(r.endDate) }} · {{ r.daysCount }} jour{{ r.daysCount > 1 ? 's' : '' }}</div>
              </div>
              <StatusPill :status="r.status" />
              <button v-if="CANCELLABLE.has(r.status)" class="px-2.5 py-[5px] rounded text-[10px] font-medium cursor-pointer bg-warning-bg text-warning" @click="cancelRequest(r.id)">
                {{ t('absence.actions.cancel') }}
              </button>
              <router-link v-else :to="{ name: 'employee-absences' }" class="px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer bg-background text-muted-foreground no-underline">{{ t('absence.actions.view') }}</router-link>
            </div>
            <div class="flex gap-2 flex-wrap mt-3 pt-2.5 border-t border-border">
              <button :class="[btnOutline, 'text-[11px]']" @click="openModalForCode('REMOTE')">
                <Building class="w-4 h-4" /> {{ t('absence.types.remote') }}
              </button>
              <button :class="[btnOutline, 'text-[11px]']" @click="openModalForCode('RECOVERY')">
                <Clock class="w-4 h-4" /> {{ t('absence.types.recovery') }}
              </button>
              <button :class="[btnOutline, 'text-[11px]']" @click="router.push({ name: 'employee-missions' })">
                <Plane class="w-4 h-4" /> {{ t('nav.my_missions') }}
              </button>
            </div>
          </div>

          <div :class="card">
            <div :class="cardHeader">
              <div :class="cardTitle">
                <Calendar class="w-4 h-4 text-primary" /> {{ t('absence.calendar_title') }} — Juillet 2026
              </div>
            </div>
            <div class="grid grid-cols-7 gap-0.5">
              <div v-for="(d, i) in weekDays" :key="i" class="text-xs text-muted-foreground text-center py-[3px] font-medium">{{ d }}</div>
              <div v-for="(day, i) in calDays" :key="i" class="text-xs text-center py-[5px] px-0.5 rounded cursor-pointer text-foreground hover:bg-background" :class="dayClass(day)">
                {{ day.n ?? '' }}
              </div>
            </div>
            <div class="flex gap-3 mt-2.5">
              <span :class="legClass"><span class="w-2 h-2 rounded-full shrink-0" style="background:#B5D4F4"></span>{{ t('absence.types.annual') }}</span>
              <span :class="legClass"><span class="w-2 h-2 rounded-full shrink-0 bg-primary"></span>Aujourd'hui</span>
            </div>
          </div>
        </div>

  </div>

  <!-- Modale nouvelle demande -->
  <AbsenceCreate
    v-if="showModal"
    :initial-leave-type-id="modalInitialType || undefined"
    @close="showModal = false"
    @created="showToast(t('absence.submitted_toast'))"
  />

  <!-- Toast -->
  <div v-if="toastMsg" class="fixed bottom-6 right-6 bg-success-bg text-success px-[18px] py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)] z-[2000]">
    <Check class="w-4 h-4" /> {{ toastMsg }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, List, Building, Clock, Plane, Calendar, Check } from 'lucide-vue-next'
import AbsenceCreate from '../components/absences/AbsenceCreate.vue'
import { StatusPill } from '../components'
import { formatDate } from '../lib/date'
import { useAuthStore }             from '../stores/auth'
import { useLeaveRequestStore }     from '../stores/leaveRequests'
import { useLeaveTypesStore }       from '../stores/leaveTypes'
import { useLeaveTransactionStore } from '../stores/leaveTransactions'

const auth   = useAuthStore()
const leaves = useLeaveRequestStore()
const leaveTypesStore = useLeaveTypesStore()
const balanceStore     = useLeaveTransactionStore()
const { t }  = useI18n()
const router = useRouter()

if (leaves.mine.length === 0) leaves.fetchMine()
if (leaveTypesStore.leaveTypes.length === 0) leaveTypesStore.fetchAll()
if (balanceStore.myBalances.length === 0) balanceStore.fetchMyBalances()

function balanceFor(code: string) {
  return balanceStore.myBalances.find(b => b.leaveTypeCode === code)?.balance ?? 0
}

// ── Classes du design system ─────────────────────────────────
const btnPrimary = 'px-4 py-[7px] rounded-md text-[13px] font-medium cursor-pointer flex items-center gap-1.5 bg-primary text-primary-foreground transition-colors hover:bg-primary/90'
const btnOutline = 'px-4 py-[7px] rounded-md text-[13px] font-medium cursor-pointer flex items-center gap-1.5 bg-card text-foreground border border-border transition-colors hover:bg-background'
const kpiCard = 'bg-card border border-border rounded-lg px-3.5 py-3'
const kpiLabel = 'text-[13px] text-muted-foreground mb-1'
const kpiValue = 'text-[28px] font-semibold leading-none'
const kpiSub = 'text-xs text-muted-foreground mt-[3px]'
const card = 'bg-card border border-border rounded-lg p-3.5'
const cardHeader = 'flex items-center justify-between mb-3'
const cardTitle = 'flex items-center gap-1.5 text-sm font-semibold'
const legClass = 'flex items-center gap-1.5 text-[11px] text-muted-foreground'

const myRequests = computed(() => leaves.mine.slice(0, 5))

const CANCELLABLE = new Set(['Draft', 'Pending', 'InApprovalN1', 'InApprovalN2', 'InApprovalN3', 'InApprovalN4', 'Approved', 'Registered'])
function cancelRequest(id: string) {
  if (confirm('Annuler cette demande ?')) leaves.cancel(id)
}

// ── Modale ───────────────────────────────────────────────────
const showModal        = ref(false)
const modalInitialType = ref('')

function openModalForCode(code: string) {
  modalInitialType.value = leaveTypesStore.leaveTypes.find(lt => lt.code === code)?.id ?? ''
  showModal.value = true
}
function openModal() {
  modalInitialType.value = ''
  showModal.value = true
}

// ── Toast ────────────────────────────────────────────────────
const toastMsg = ref('')
function showToast(msg: string) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
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

function dayClass(day: CalDay): string {
  if (day.cls === 'empty') return 'text-transparent pointer-events-none'
  if (day.cls === 'today') return 'bg-primary text-primary-foreground font-semibold'
  if (day.cls === 'has-leave') return 'bg-success-bg text-success font-medium'
  return ''
}
</script>
