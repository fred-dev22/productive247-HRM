<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- ── En-tête ── -->
        <div class="page-header">
          <div>
            <div class="page-title">{{ t('employee.title') }}</div>
            <div class="page-sub">{{ t('employee.sub_title', { count: store.employees.length }) }}</div>
          </div>
          <button class="btn btn-primary" @click="openEmpModal()">
            <i class="ti ti-user-plus"></i> {{ t('employee.new') }}
          </button>
        </div>

        <!-- ── KPI strip ── -->
        <div class="kpi-strip">
          <div class="kpi-item">
            <div class="kpi-icon" style="background:var(--color-success-bg)">
              <i class="ti ti-users" style="color:var(--p247-success)"></i>
            </div>
            <div>
              <div class="kpi-val">{{ store.employees.length }}</div>
              <div class="kpi-lbl">{{ t('employee.kpi_total') }}</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-icon" style="background:var(--color-success-bg)">
              <i class="ti ti-user-check" style="color:var(--p247-success)"></i>
            </div>
            <div>
              <div class="kpi-val">{{ store.activeEmployees.length }}</div>
              <div class="kpi-lbl">{{ t('employee.kpi_active') }}</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-icon" style="background:var(--p247-orange-light)">
              <i class="ti ti-clock" style="color:var(--p247-orange)"></i>
            </div>
            <div>
              <div class="kpi-val">{{ store.trialEmployees.length }}</div>
              <div class="kpi-lbl">{{ t('employee.kpi_trial') }}</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-icon" style="background:var(--color-warning-bg)">
              <i class="ti ti-shield-check" style="color:var(--color-warning)"></i>
            </div>
            <div>
              <div class="kpi-val">{{ store.validatorEmployees.length }}</div>
              <div class="kpi-lbl">{{ t('employee.kpi_managers') }}</div>
            </div>
          </div>
        </div>

        <!-- ── Tableau ── -->
        <div class="table-card">
          <!-- Filtres -->
          <div class="filter-bar">
            <div class="search-box">
              <i class="ti ti-search"></i>
              <input v-model="fSearch" :placeholder="t('topbar.search_placeholder')" class="search-input" />
            </div>
            <select v-model="fEntity" class="filter-sel">
              <option value="">{{ t('employee.filter_entity') }}</option>
              <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.id">
                {{ e.code }} — {{ e.name }}
              </option>
            </select>
            <select v-model="fRole" class="filter-sel">
              <option value="">{{ t('employee.filter_role') }}</option>
              <option value="employee">{{ t('employee.role_employee') }}</option>
              <option value="validator">{{ t('employee.role_validator') }}</option>
              <option value="hr_admin">{{ t('employee.role_hr_admin') }}</option>
              <option value="hr_director">{{ t('employee.role_hr_director') }}</option>
            </select>
            <select v-model="fContract" class="filter-sel">
              <option value="">{{ t('employee.filter_contract') }}</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Freelance">Freelance</option>
            </select>
            <select v-model="fStatus" class="filter-sel">
              <option value="">{{ t('employee.filter_status') }}</option>
              <option value="active">{{ t('employee.status_active') }}</option>
              <option value="trial">{{ t('employee.status_trial') }}</option>
              <option value="onleave">{{ t('employee.status_onleave') }}</option>
              <option value="inactive">{{ t('employee.status_inactive') }}</option>
            </select>
            <button v-if="hasFilters" class="btn btn-outline btn-sm" @click="resetFilters">
              <i class="ti ti-refresh"></i> {{ t('employee.filter_reset') }}
            </button>
          </div>

          <!-- Table -->
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('employee.col_code') }}</th>
                <th>{{ t('employee.col_employee') }}</th>
                <th>{{ t('employee.col_entity') }}</th>
                <th>{{ t('employee.col_role') }}</th>
                <th>{{ t('employee.col_contract') }}</th>
                <th>{{ t('employee.col_hire_date') }}</th>
                <th>{{ t('employee.col_status') }}</th>
                <th>{{ t('employee.col_actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in pageItems" :key="emp.id">
                <td><span class="code-chip">{{ emp.code }}</span></td>
                <td>
                  <div class="emp-cell">
                    <div class="avatar" :style="{ background: emp.avatarBg, color: emp.avatarText }">
                      {{ emp.initials }}
                    </div>
                    <div>
                      <div class="emp-name">{{ emp.name }}</div>
                      <div class="emp-job">{{ emp.jobTitle }}</div>
                    </div>
                  </div>
                </td>
                <td class="td-muted">{{ emp.entityName || '—' }}</td>
                <td>
                  <span class="role-badge" :class="`role-${emp.role}`">{{ roleLabel(emp.role) }}</span>
                </td>
                <td class="td-muted">{{ emp.contractType }}</td>
                <td class="td-muted">{{ emp.hireDate }}</td>
                <td>
                  <span class="status-pill" :class="`pill-${emp.status}`">{{ statusLabel(emp.status) }}</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="act-btn" @click="openEmpModal(emp.id)">
                      <i class="ti ti-pencil"></i> {{ t('employee.btn_edit') }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="pageItems.length === 0">
                <td colspan="8" class="empty-row">{{ t('employee.empty') }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination" v-if="totalPages > 1">
            <span class="pag-total">{{ filtered.length }} employé(s)</span>
            <div class="pag-pages">
              <button class="pag-btn" :disabled="page === 1" @click="page--">
                <i class="ti ti-chevron-left"></i>
              </button>
              <button
                v-for="p in totalPages" :key="p"
                class="pag-btn" :class="{ active: p === page }"
                @click="page = p"
              >{{ p }}</button>
              <button class="pag-btn" :disabled="page === totalPages" @click="page++">
                <i class="ti ti-chevron-right"></i>
              </button>
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
import { AppSidebar, AppTopNav } from '../../components'
import { useAuthStore }     from '../../stores/auth'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore }   from '../../stores/entities'
import EmployeeFormModal    from '../../components/employees/EmployeeFormModal.vue'
import type { UserRole, EmployeeStatus } from '../../types'

const { t }       = useI18n()
const auth        = useAuthStore()
const store       = useEmployeeStore()
const entityStore = useEntityStore()

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

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--p247-bg); }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.page-title  { font-size: 18px; font-weight: 600; }
.page-sub    { font-size: 13px; color: var(--p247-muted); margin-top: 1px; }

.btn         { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-sm      { padding: 5px 12px; font-size: 12px; }
.btn-primary { background: var(--p247-orange); color: var(--color-surface); }
.btn-primary:hover { background: var(--p247-orange-dark); }
.btn-outline { background: var(--p247-white); color: var(--p247-text); border: 0.5px solid var(--p247-border); }
.btn-outline:hover { background: var(--p247-bg); }

.kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.kpi-item  { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.kpi-icon  { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.kpi-val   { font-size: 22px; font-weight: 700; line-height: 1; }
.kpi-lbl   { font-size: 12px; color: var(--p247-muted); margin-top: 2px; }

.table-card { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; overflow: hidden; }

.filter-bar { display: flex; gap: 8px; align-items: center; padding: 10px 14px; border-bottom: 0.5px solid var(--p247-border); flex-wrap: wrap; }
.filter-sel { height: 30px; padding: 0 8px; border: 0.5px solid var(--p247-border); border-radius: 6px; font-size: 12px; color: var(--p247-text); background: var(--p247-white); outline: none; }
.filter-sel:focus { border-color: var(--p247-orange); }
.search-box { display: flex; align-items: center; gap: 6px; border: 0.5px solid var(--p247-border); border-radius: 6px; padding: 0 8px; height: 30px; background: var(--p247-white); }
.search-box i { color: var(--p247-muted); font-size: 13px; }
.search-input { border: none; outline: none; font-size: 12px; width: 160px; background: transparent; }

.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th { padding: 10px 13px; text-align: left; font-size: 12px; font-weight: 600; color: var(--p247-text); background: var(--p247-orange-light); border-bottom: 1px solid rgba(200, 16, 46, 0.2); white-space: nowrap; }
.table td { padding: 10px 13px; border-bottom: 0.5px solid var(--p247-border); vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover td { background: var(--color-primary-light); }

.emp-cell { display: flex; align-items: center; gap: 10px; }
.avatar   { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.emp-name { font-weight: 500; font-size: 13px; }
.emp-job  { font-size: 11px; color: var(--p247-muted); margin-top: 1px; }
.td-muted { color: var(--p247-muted); font-size: 12px; }
.empty-row { text-align: center; color: var(--p247-muted); padding: 32px; font-size: 13px; }

.code-chip { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: var(--p247-orange-light); color: var(--p247-orange); letter-spacing: .04em; }

.role-badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 12px; white-space: nowrap; }
.role-badge.role-employee    { background: var(--color-success-bg); color: var(--p247-success); }
.role-badge.role-validator   { background: var(--color-success-bg); color: var(--p247-success); }
.role-badge.role-hr_admin    { background: var(--p247-orange-light); color: var(--p247-orange); }
.role-badge.role-hr_director { background: var(--color-warning-bg); color: var(--color-warning); }

.status-pill { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
.pill-active   { background: var(--color-success-bg); color: var(--p247-success); }
.pill-trial    { background: var(--p247-orange-light); color: var(--p247-orange); }
.pill-onleave  { background: var(--color-success-bg); color: var(--p247-success); }
.pill-inactive { background: var(--p247-bg); color: var(--p247-muted); border: 0.5px solid #ccc; }

.actions-cell { display: flex; gap: 4px; }
.act-btn { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; border: none; white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center; gap: 3px; background: var(--p247-bg); color: var(--p247-muted); transition: all .1s; }
.act-btn:hover { background: var(--color-neutral-bg); color: var(--p247-text); }

.pagination { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-top: 0.5px solid var(--p247-border); font-size: 12px; color: var(--p247-muted); }
.pag-total  { flex: 1; }
.pag-pages  { display: flex; gap: 3px; }
.pag-btn    { min-width: 28px; height: 28px; padding: 0 6px; border-radius: 5px; font-size: 12px; font-weight: 500; cursor: pointer; border: 0.5px solid var(--p247-border); background: var(--p247-white); color: var(--p247-text); display: flex; align-items: center; justify-content: center; }
.pag-btn:hover:not(:disabled) { background: var(--p247-bg); }
.pag-btn.active   { background: var(--p247-orange); color: var(--color-surface); border-color: var(--p247-orange); }
.pag-btn:disabled { opacity: 0.35; cursor: not-allowed; }

@media (max-width: 900px) { .kpi-strip { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .content { padding: 16px; } .kpi-strip { grid-template-columns: 1fr; } }
</style>
