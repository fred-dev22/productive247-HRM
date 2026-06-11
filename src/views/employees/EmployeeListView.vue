<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <!-- ── En-tête ── -->
        <div :class="L.pageHeader">
          <div>
            <div :class="L.pageTitle">{{ t('employee.title') }}</div>
            <div :class="L.pageSub">{{ t('employee.sub_title', { count: store.employees.length }) }}</div>
          </div>
          <button :class="L.btnPrimary" @click="openEmpModal()">
            <UserPlus class="w-4 h-4" /> {{ t('employee.new') }}
          </button>
        </div>

        <!-- ── KPI strip ── -->
        <div class="grid grid-cols-4 gap-2.5 mb-4 max-md:grid-cols-2">
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-success-bg"><Users class="w-[18px] h-[18px] text-success" /></div>
            <div>
              <div :class="kpiVal">{{ store.employees.length }}</div>
              <div :class="kpiLbl">{{ t('employee.kpi_total') }}</div>
            </div>
          </div>
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-success-bg"><UserCheck class="w-[18px] h-[18px] text-success" /></div>
            <div>
              <div :class="kpiVal">{{ store.activeEmployees.length }}</div>
              <div :class="kpiLbl">{{ t('employee.kpi_active') }}</div>
            </div>
          </div>
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-primary/10"><Clock class="w-[18px] h-[18px] text-primary" /></div>
            <div>
              <div :class="kpiVal">{{ store.trialEmployees.length }}</div>
              <div :class="kpiLbl">{{ t('employee.kpi_trial') }}</div>
            </div>
          </div>
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-warning-bg"><ShieldCheck class="w-[18px] h-[18px] text-warning" /></div>
            <div>
              <div :class="kpiVal">{{ store.validatorEmployees.length }}</div>
              <div :class="kpiLbl">{{ t('employee.kpi_managers') }}</div>
            </div>
          </div>
        </div>

        <!-- ── Tableau ── -->
        <div :class="L.tableCard">
          <!-- Filtres -->
          <div class="flex gap-2 items-center px-3.5 py-2.5 border-b border-border flex-wrap">
            <div :class="L.searchBox">
              <Search class="w-3.5 h-3.5 text-muted-foreground" />
              <input v-model="fSearch" :placeholder="t('topbar.search_placeholder')" :class="L.searchInput" />
            </div>
            <select v-model="fEntity" :class="filterSel">
              <option value="">{{ t('employee.filter_entity') }}</option>
              <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.id">
                {{ e.code }} — {{ e.name }}
              </option>
            </select>
            <select v-model="fRole" :class="filterSel">
              <option value="">{{ t('employee.filter_role') }}</option>
              <option value="employee">{{ t('employee.role_employee') }}</option>
              <option value="validator">{{ t('employee.role_validator') }}</option>
              <option value="hr_admin">{{ t('employee.role_hr_admin') }}</option>
              <option value="hr_director">{{ t('employee.role_hr_director') }}</option>
            </select>
            <select v-model="fContract" :class="filterSel">
              <option value="">{{ t('employee.filter_contract') }}</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Freelance">Freelance</option>
            </select>
            <select v-model="fStatus" :class="filterSel">
              <option value="">{{ t('employee.filter_status') }}</option>
              <option value="active">{{ t('employee.status_active') }}</option>
              <option value="trial">{{ t('employee.status_trial') }}</option>
              <option value="onleave">{{ t('employee.status_onleave') }}</option>
              <option value="inactive">{{ t('employee.status_inactive') }}</option>
            </select>
            <button v-if="hasFilters" :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="resetFilters">
              <RefreshCw class="w-3.5 h-3.5" /> {{ t('employee.filter_reset') }}
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table :class="L.table">
              <thead>
                <tr>
                  <th :class="L.th">{{ t('employee.col_code') }}</th>
                  <th :class="L.th">{{ t('employee.col_employee') }}</th>
                  <th :class="L.th">{{ t('employee.col_entity') }}</th>
                  <th :class="L.th">{{ t('employee.col_role') }}</th>
                  <th :class="L.th">{{ t('employee.col_contract') }}</th>
                  <th :class="L.th">{{ t('employee.col_hire_date') }}</th>
                  <th :class="L.th">{{ t('employee.col_status') }}</th>
                  <th :class="L.th">{{ t('employee.col_actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="emp in pageItems" :key="emp.id" :class="L.rowHover">
                  <td :class="L.td"><span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary tracking-[0.04em]">{{ emp.code }}</span></td>
                  <td :class="L.td">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" :style="{ background: emp.avatarBg, color: emp.avatarText }">
                        {{ emp.initials }}
                      </div>
                      <div>
                        <div class="font-medium text-[13px]">{{ emp.name }}</div>
                        <div class="text-[11px] text-muted-foreground mt-px">{{ emp.jobTitle }}</div>
                      </div>
                    </div>
                  </td>
                  <td :class="[L.td, 'text-muted-foreground text-xs']">{{ emp.entityName || '—' }}</td>
                  <td :class="L.td">
                    <span class="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" :class="roleBadge(emp.role)">{{ roleLabel(emp.role) }}</span>
                  </td>
                  <td :class="[L.td, 'text-muted-foreground text-xs']">{{ emp.contractType }}</td>
                  <td :class="[L.td, 'text-muted-foreground text-xs']">{{ emp.hireDate }}</td>
                  <td :class="L.td">
                    <span class="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" :class="statusBadge(emp.status)">{{ statusLabel(emp.status) }}</span>
                  </td>
                  <td :class="L.td">
                    <button class="px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 bg-background text-muted-foreground transition-colors hover:bg-neutral-bg hover:text-foreground" @click="openEmpModal(emp.id)">
                      <Pencil class="w-3.5 h-3.5" /> {{ t('employee.btn_edit') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="pageItems.length === 0">
                  <td colspan="8" class="text-center text-muted-foreground p-8 text-[13px]">{{ t('employee.empty') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div :class="L.pagination" v-if="totalPages > 1">
            <span class="flex-1">{{ filtered.length }} employé(s)</span>
            <div class="flex gap-[3px]">
              <button :class="L.pagBtn" :disabled="page === 1" @click="page--"><ChevronLeft class="w-3.5 h-3.5" /></button>
              <button v-for="p in totalPages" :key="p" :class="[L.pagBtn, p === page && L.pagBtnActive]" @click="page = p">{{ p }}</button>
              <button :class="L.pagBtn" :disabled="page === totalPages" @click="page++"><ChevronRight class="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- ── Modal employé ── -->
  <EmployeeFormModal
    v-model="showEmpModal"
    :edit-id="editEmpId"
    @saved="showEmpModal = false"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserPlus, Users, UserCheck, Clock, ShieldCheck, Search, RefreshCw, Pencil, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { AppSidebar, AppTopNav } from '../../components'
import * as L from '../../lib/listClasses'
import { useAuthStore }     from '../../stores/auth'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore }   from '../../stores/entities'
import EmployeeFormModal    from '../../components/employees/EmployeeFormModal.vue'
import type { UserRole, EmployeeStatus } from '../../types'

const { t }       = useI18n()
const auth        = useAuthStore()
const store       = useEmployeeStore()
const entityStore = useEntityStore()

// ── Classes du design system ─────────────────────────────────
const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold leading-none'
const kpiLbl = 'text-xs text-muted-foreground mt-0.5'
const filterSel = 'h-[30px] px-2 border border-border rounded-md text-xs text-foreground bg-card outline-none focus:border-primary'

function roleBadge(role: UserRole): string {
  const m: Record<string, string> = {
    employee:    'bg-success-bg text-success',
    validator:   'bg-success-bg text-success',
    hr_admin:    'bg-primary/10 text-primary',
    hr_director: 'bg-warning-bg text-warning',
  }
  return m[role] ?? 'bg-neutral-bg text-neutral'
}

function statusBadge(s: EmployeeStatus): string {
  const m: Record<string, string> = {
    active:   'bg-success-bg text-success',
    trial:    'bg-primary/10 text-primary',
    onleave:  'bg-success-bg text-success',
    inactive: 'bg-background text-muted-foreground border border-border',
  }
  return m[s] ?? 'bg-neutral-bg text-neutral'
}

const showEmpModal = ref(false)
const editEmpId    = ref<string | undefined>(undefined)

function openEmpModal(id?: string) {
  editEmpId.value    = id
  showEmpModal.value = true
}

const PAGE_SIZE = 15
const page      = ref(1)

const fSearch   = ref('')
const fEntity   = ref('')
const fRole     = ref('')
const fContract = ref('')
const fStatus   = ref('')

const hasFilters = computed(() => fSearch.value || fEntity.value || fRole.value || fContract.value || fStatus.value)

function resetFilters() {
  fSearch.value = ''; fEntity.value = ''; fRole.value = ''
  fContract.value = ''; fStatus.value = ''; page.value = 1
}

const filtered = computed(() =>
  store.employees.filter(e => {
    if (fEntity.value   && e.entityId      !== fEntity.value)   return false
    if (fRole.value     && e.role          !== fRole.value)     return false
    if (fContract.value && e.contractType  !== fContract.value) return false
    if (fStatus.value   && e.status        !== fStatus.value)   return false
    if (fSearch.value) {
      const q = fSearch.value.toLowerCase()
      if (!e.name.toLowerCase().includes(q) && !e.code.toLowerCase().includes(q)) return false
    }
    return true
  })
)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pageItems  = computed(() => {
  const s = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(s, s + PAGE_SIZE)
})

function roleLabel(r: UserRole): string {
  const m: Record<string, string> = {
    employee:    t('employee.role_employee'),
    validator:   t('employee.role_validator'),
    hr_admin:    t('employee.role_hr_admin'),
    hr_director: t('employee.role_hr_director'),
  }
  return m[r] ?? r
}

function statusLabel(s: EmployeeStatus): string {
  const m: Record<string, string> = {
    active:   t('employee.status_active'),
    trial:    t('employee.status_trial'),
    onleave:  t('employee.status_onleave'),
    inactive: t('employee.status_inactive'),
  }
  return m[s] ?? s
}
</script>
