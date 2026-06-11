<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <!-- ── En-tête ── -->
        <div :class="L.pageHeader">
          <div>
            <div :class="L.pageTitle">{{ t('absence.my_title') }}</div>
            <div :class="L.pageSub">{{ auth.user?.name }}</div>
          </div>
          <button :class="L.btnPrimary" @click="showModal = true">
            <Plus class="w-4 h-4" /> {{ t('absence.new') }}
          </button>
        </div>

        <!-- ── Soldes rapides ── -->
        <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
          <div :class="kpiCard" class="border-t-[3px] border-t-primary">
            <div :class="kpiLabel">{{ t('balances.annual') }}</div>
            <div :class="kpiValue" class="text-primary">12</div>
            <div :class="kpiSub">{{ t('balances.on', { total: 24 }) }}</div>
          </div>
          <div :class="kpiCard" class="border-t-[3px] border-t-success">
            <div :class="kpiLabel">{{ t('balances.recovery') }}</div>
            <div :class="kpiValue" class="text-success">3</div>
            <div :class="kpiSub">{{ t('balances.acquired') }}</div>
          </div>
          <div :class="kpiCard" class="border-t-[3px] border-t-success">
            <div :class="kpiLabel">{{ t('balances.sick') }}</div>
            <div :class="kpiValue" class="text-success">8</div>
            <div :class="kpiSub">{{ t('balances.available') }}</div>
          </div>
          <div :class="kpiCard" class="border-t-[3px]" style="border-top-color:#854F0B">
            <div :class="kpiLabel">{{ t('balances.remote') }}</div>
            <div :class="kpiValue" style="color:#854F0B">5</div>
            <div :class="kpiSub">{{ t('balances.used') }}</div>
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
            <select v-model="filterStatus" :class="filterSelect">
              <option value="">{{ t('absence.filters.all_statuses') }}</option>
              <option value="pending">{{ t('absence.status.pending') }}</option>
              <option value="approved">{{ t('absence.status.approved') }}</option>
              <option value="rejected">{{ t('absence.status.rejected') }}</option>
              <option value="cancelled">{{ t('absence.status.cancelled') }}</option>
              <option value="draft">{{ t('absence.status.draft') }}</option>
            </select>
            <select v-model="filterType" :class="filterSelect">
              <option value="">{{ t('absence.filters.all_types') }}</option>
              <option v-for="lt in allLeaveTypes" :key="lt" :value="lt">{{ typeLabel(lt) }}</option>
            </select>
            <button :class="btnReset" @click="resetFilters">{{ t('absence.actions.reset_filters') }}</button>
            <span class="text-xs text-muted-foreground whitespace-nowrap ml-auto">{{ t('absence.total', { count: totalCount }) }}</span>
          </template>

          <!-- Cellules personnalisées -->
          <template #cell-type="{ row }">
            <span class="text-muted-foreground whitespace-nowrap">{{ typeLabel(row.type) }}</span>
          </template>
          <template #cell-dates="{ row }">
            <span class="whitespace-nowrap text-[11px]">{{ row.startDate }} → {{ row.endDate }}</span>
          </template>
          <template #cell-days="{ row }">
            <span class="font-medium whitespace-nowrap">{{ row.workingDays }}j</span>
          </template>
          <template #cell-submitted="{ row }">
            <span class="text-muted-foreground whitespace-nowrap text-[11px]">{{ row.submittedAt }}</span>
          </template>
          <template #cell-status="{ row }">
            <StatusPill :status="row.status" />
          </template>
          <template #cell-actions="{ row }">
            <div class="flex gap-1">
              <button v-if="row.status === 'pending'" :class="L.actBtn" class="bg-warning-bg text-warning" @click.stop="absenceStore.cancelLeave(row.id)">
                {{ t('absence.actions.cancel') }}
              </button>
              <template v-else-if="row.status === 'draft'">
                <button :class="L.actApprove" @click.stop="absenceStore.submitDraft(row.id)">
                  {{ t('absence.actions.submit_draft') }}
                </button>
                <button :class="L.actReject" @click.stop="absenceStore.deleteLeave(row.id)">
                  {{ t('absence.actions.delete') }}
                </button>
              </template>
              <button v-else :class="L.actView" @click.stop="toggleDetail(row.id)">
                {{ expandedId === row.id ? '↑ Fermer' : t('absence.actions.view') }}
              </button>
            </div>
          </template>

          <!-- Ligne détail dépliable -->
          <template #row-after="{ row }">
            <tr v-if="expandedId === row.id">
              <td :colspan="columns.length" class="p-0">
                <div class="bg-background border-t border-border p-4 flex flex-col gap-2.5 text-xs">
                  <div class="flex gap-4 text-[11px] text-muted-foreground flex-wrap">
                    <span>{{ t('absence.fields.start_date') }} : {{ row.startDate }}</span>
                    <span>{{ t('absence.fields.end_date') }} : {{ row.endDate }}</span>
                    <span>{{ t('absence.fields.working_days', { count: row.workingDays }) }}</span>
                  </div>
                  <div v-if="row.reason" class="text-xs text-muted-foreground">
                    <span class="font-medium text-[11px]">{{ t('absence.fields.reason') }} :</span> {{ row.reason }}
                  </div>
                  <div v-if="row.returnComment" class="flex items-center gap-1.5 text-warning text-xs bg-warning-bg rounded-md px-2.5 py-1.5">
                    <CornerUpLeft class="w-3.5 h-3.5" />
                    <span class="font-medium text-[11px]">Commentaire retour :</span> {{ row.returnComment }}
                  </div>
                  <div v-if="row.validationHistory?.length" class="mt-1">
                    <div class="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.06em] mb-2.5">Historique de validation</div>
                    <ValidationTimeline :history="row.validationHistory" />
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- Pagination -->
          <template #pagination>
            <div class="flex items-center gap-3 text-xs text-muted-foreground flex-wrap w-full">
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

  <div v-if="toastMsg" class="fixed bottom-6 right-6 bg-success-bg text-success px-[18px] py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)] z-[2000]">
    <Check class="w-4 h-4" /> {{ toastMsg }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, CornerUpLeft, ChevronLeft, ChevronRight, Check } from 'lucide-vue-next'
import { AppSidebar, AppTopNav, AbsenceRequestModal, StatusPill, DataTable } from '../../components'
import ValidationTimeline from '../../components/ui/ValidationTimeline.vue'
import * as L from '../../lib/listClasses'
import { useAuthStore }    from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import type { LeaveType } from '../../types'

const auth         = useAuthStore()
const absenceStore = useAbsenceStore()
const { t }        = useI18n()

// ── Classes du design system ─────────────────────────────────
const kpiCard = 'bg-card border border-border rounded-lg px-3.5 py-3'
const kpiLabel = 'text-[13px] text-muted-foreground mb-1'
const kpiValue = 'text-[28px] font-semibold leading-none'
const kpiSub = 'text-xs text-muted-foreground mt-[3px]'
const filterSelect = 'h-[30px] px-2 border border-border rounded-md text-xs text-foreground bg-card outline-none focus:border-primary'
const btnReset = 'h-[30px] px-3 border border-border rounded-md text-xs text-muted-foreground bg-card cursor-pointer transition-colors hover:text-primary hover:border-primary'

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
