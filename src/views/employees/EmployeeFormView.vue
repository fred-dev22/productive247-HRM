<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <div class="page-header">
          <div>
            <div class="page-title">{{ isEdit ? t('employee.edit_title') : t('employee.new') }}</div>
            <div class="page-sub" v-if="isEdit && editEmp">{{ editEmp.name }}</div>
          </div>
          <router-link :to="{ name: 'hr-employees' }" class="btn btn-outline">
            <i class="ti ti-arrow-left"></i> {{ t('employee.btn_cancel') }}
          </router-link>
        </div>

        <div class="form-wrapper">
          <div class="card">

            <!-- ── Section 1 : Identité ── -->
            <div class="form-section">
              <div class="section-title"><i class="ti ti-user"></i> {{ t('employee.section_identity') }}</div>
              <div class="field-grid">
                <div class="field">
                  <label class="field-label">{{ t('employee.field_first_name') }} *</label>
                  <input v-model="form.firstName" class="field-input" :class="{ 'input-error': err.firstName }" :placeholder="t('employee.placeholder_first')" />
                  <div v-if="err.firstName" class="error-msg">{{ err.firstName }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_last_name') }} *</label>
                  <input v-model="form.lastName" class="field-input" :class="{ 'input-error': err.lastName }" :placeholder="t('employee.placeholder_last')" />
                  <div v-if="err.lastName" class="error-msg">{{ err.lastName }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_code') }} *</label>
                  <input v-model="form.code" class="field-input" :class="{ 'input-error': err.code }" :placeholder="t('employee.placeholder_code')" @input="form.code = (form.code as string).toUpperCase()" />
                  <div v-if="err.code" class="error-msg">{{ err.code }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_email') }}</label>
                  <input v-model="form.email" type="email" class="field-input" :class="{ 'input-error': err.email }" :placeholder="t('employee.placeholder_email')" />
                  <div v-if="err.email" class="error-msg">{{ err.email }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_phone') }}</label>
                  <input v-model="form.phone" type="tel" class="field-input" :placeholder="t('employee.placeholder_phone')" />
                </div>
              </div>
            </div>

            <!-- ── Section 2 : Poste & Affectation ── -->
            <div class="form-section">
              <div class="section-title"><i class="ti ti-briefcase"></i> {{ t('employee.section_position') }}</div>
              <div class="field-grid">
                <div class="field field-full">
                  <label class="field-label">{{ t('employee.field_job_title') }} *</label>
                  <input v-model="form.jobTitle" class="field-input" :class="{ 'input-error': err.jobTitle }" :placeholder="t('employee.placeholder_job')" />
                  <div v-if="err.jobTitle" class="error-msg">{{ err.jobTitle }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_entity') }} *</label>
                  <select v-model="form.entityId" class="field-input" :class="{ 'input-error': err.entityId }" @change="onEntityChange">
                    <option value="">{{ t('employee.placeholder_entity') }}</option>
                    <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.id">
                      {{ e.code }} — {{ e.name }}
                    </option>
                  </select>
                  <div v-if="err.entityId" class="error-msg">{{ err.entityId }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_role') }} *</label>
                  <select v-model="form.role" class="field-input" :class="{ 'input-error': err.role }">
                    <option value="">{{ t('employee.placeholder_role') }}</option>
                    <option value="employee">{{ t('employee.role_employee') }}</option>
                    <option value="validator">{{ t('employee.role_validator') }}</option>
                    <option value="hr_admin">{{ t('employee.role_hr_admin') }}</option>
                    <option value="hr_director">{{ t('employee.role_hr_director') }}</option>
                  </select>
                  <div v-if="err.role" class="error-msg">{{ err.role }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_contract') }} *</label>
                  <select v-model="form.contractType" class="field-input" :class="{ 'input-error': err.contractType }">
                    <option value="">{{ t('employee.placeholder_contract') }}</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                  <div v-if="err.contractType" class="error-msg">{{ err.contractType }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_hire_date') }} *</label>
                  <input v-model="form.hireDate" type="date" class="field-input" :class="{ 'input-error': err.hireDate }" />
                  <div v-if="err.hireDate" class="error-msg">{{ err.hireDate }}</div>
                </div>
                <div class="field">
                  <label class="field-label">{{ t('employee.field_status') }}</label>
                  <select v-model="form.status" class="field-input">
                    <option value="active">{{ t('employee.status_active') }}</option>
                    <option value="trial">{{ t('employee.status_trial') }}</option>
                    <option value="onleave">{{ t('employee.status_onleave') }}</option>
                    <option value="inactive">{{ t('employee.status_inactive') }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- ── Section 3 : Manager ── -->
            <div class="form-section">
              <div class="section-title"><i class="ti ti-shield-check"></i> {{ t('employee.section_manager') }}</div>
              <p class="section-desc">{{ t('employee.manager_desc') }}</p>
              <div class="field-grid">
                <div class="field">
                  <label class="field-label">{{ t('employee.field_manager') }}</label>
                  <select v-model="form.managerId" class="field-input">
                    <option value="">{{ t('employee.placeholder_manager') }}</option>
                    <optgroup :label="t('employee.group_directors')">
                      <option v-for="e in mgrs.filter(e => e.role === 'hr_director')" :key="e.id" :value="e.id">
                        {{ e.code }} — {{ e.name }} · {{ e.jobTitle }}
                      </option>
                    </optgroup>
                    <optgroup :label="t('employee.group_admins')">
                      <option v-for="e in mgrs.filter(e => e.role === 'hr_admin')" :key="e.id" :value="e.id">
                        {{ e.code }} — {{ e.name }} · {{ e.jobTitle }}
                      </option>
                    </optgroup>
                    <optgroup :label="t('employee.group_validators')">
                      <option v-for="e in mgrs.filter(e => e.role === 'validator')" :key="e.id" :value="e.id">
                        {{ e.code }} — {{ e.name }} · {{ e.jobTitle }}
                      </option>
                    </optgroup>
                  </select>
                </div>
                <div class="field" v-if="selectedManager">
                  <label class="field-label">{{ t('employee.selected_manager') }}</label>
                  <div class="manager-preview">
                    <div class="avatar" :style="{ background: selectedManager.avatarBg, color: selectedManager.avatarText }">
                      {{ selectedManager.initials }}
                    </div>
                    <div>
                      <div class="mgr-name">{{ selectedManager.name }}</div>
                      <div class="mgr-job">{{ selectedManager.jobTitle }} · {{ selectedManager.entityName }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Actions ── -->
            <div class="form-actions">
              <button class="btn btn-outline" @click="handleSave">
                <i class="ti ti-device-floppy"></i>
                {{ isEdit ? t('employee.btn_update') : t('employee.btn_save') }}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppSidebar, AppTopNav } from '../../components'
import { useAuthStore }     from '../../stores/auth'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore }   from '../../stores/entities'
import type { UserRole, ContractType, EmployeeStatus } from '../../types'

const { t }       = useI18n()
const auth        = useAuthStore()
const store       = useEmployeeStore()
const entityStore = useEntityStore()
const router      = useRouter()
const route       = useRoute()

const empId  = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!empId.value)
const editEmp = computed(() => empId.value ? store.getById(empId.value) : undefined)

const form = reactive({
  firstName:    '',
  lastName:     '',
  code:         '',
  email:        '',
  phone:        '',
  jobTitle:     '',
  entityId:     '' as string | null,
  entityName:   '',
  role:         '' as UserRole | '',
  contractType: '' as ContractType | '',
  hireDate:     '',
  status:       'active' as EmployeeStatus,
  managerId:    '',
})

const err = reactive({
  firstName: '', lastName: '', code: '', email: '',
  jobTitle: '', entityId: '', role: '', contractType: '', hireDate: '',
})

const mgrs = computed(() => store.validatorEmployees.filter(e => e.id !== empId.value))

const selectedManager = computed(() =>
  form.managerId ? store.getById(form.managerId) : undefined
)

function onEntityChange() {
  const e = entityStore.getEntityById(form.entityId ?? '')
  form.entityName = e?.name ?? ''
}

onMounted(() => {
  if (isEdit.value && editEmp.value) {
    const e = editEmp.value
    form.firstName    = e.firstName
    form.lastName     = e.lastName
    form.code         = e.code
    form.email        = e.email ?? ''
    form.phone        = e.phone ?? ''
    form.jobTitle     = e.jobTitle
    form.entityId     = e.entityId
    form.entityName   = e.entityName ?? ''
    form.role         = e.role
    form.contractType = e.contractType
    form.hireDate     = e.hireDate
    form.status       = e.status
    form.managerId    = e.managerId ?? ''
  } else {
    form.code = store.nextCode
  }
})

function validate(): boolean {
  Object.keys(err).forEach(k => ((err as Record<string, string>)[k] = ''))
  let ok = true
  if (!form.firstName.trim())  { err.firstName    = t('employee.err_first_name'); ok = false }
  if (!form.lastName.trim())   { err.lastName     = t('employee.err_last_name');  ok = false }
  if (!form.code.trim())       { err.code         = t('employee.err_code');       ok = false }
  if (!form.jobTitle.trim())   { err.jobTitle     = t('employee.err_job_title');  ok = false }
  if (!form.entityId)          { err.entityId     = t('employee.err_entity');     ok = false }
  if (!form.role)              { err.role         = t('employee.err_role');       ok = false }
  if (!form.contractType)      { err.contractType = t('employee.err_contract');   ok = false }
  if (!form.hireDate)          { err.hireDate     = t('employee.err_hire_date');  ok = false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    err.email = t('employee.err_email'); ok = false
  }
  return ok
}

function handleSave() {
  if (!validate()) return

  const payload = {
    code:         form.code,
    firstName:    form.firstName,
    lastName:     form.lastName,
    role:         form.role as UserRole,
    jobTitle:     form.jobTitle,
    entityId:     form.entityId,
    entityName:   form.entityName,
    contractType: form.contractType as ContractType,
    hireDate:     form.hireDate,
    status:       form.status,
    email:        form.email || undefined,
    phone:        form.phone || undefined,
    managerId:    form.managerId || undefined,
  }

  if (isEdit.value && empId.value) {
    store.updateEmployee(empId.value, payload)
  } else {
    store.createEmployee(payload)
  }
  router.push({ name: 'hr-employees' })
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--p247-bg); }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title  { font-size: 18px; font-weight: 600; }
.page-sub    { font-size: 13px; color: var(--p247-muted); margin-top: 1px; }

.btn         { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-primary { background: var(--p247-orange); color: white; }
.btn-primary:hover { background: var(--p247-orange-dark); }
.btn-outline { background: var(--p247-white); color: var(--p247-text); border: 0.5px solid var(--p247-border); }
.btn-outline:hover { background: var(--p247-bg); }

.form-wrapper { display: flex; justify-content: center; }
.card { width: 100%; max-width: 800px; background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; padding: 24px; display: flex; flex-direction: column; gap: 24px; }

.form-section { display: flex; flex-direction: column; gap: 14px; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; padding-bottom: 10px; border-bottom: 0.5px solid var(--p247-border); }
.section-title i { color: var(--p247-orange); font-size: 16px; }
.section-desc { font-size: 12px; color: var(--p247-muted); margin-top: -8px; }

.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-full { grid-column: 1 / -1; }
.field-label { font-size: 12px; font-weight: 500; color: var(--p247-text); }
.field-input { height: 34px; padding: 0 10px; border: 0.5px solid var(--p247-border); border-radius: 6px; font-size: 13px; color: var(--p247-text); background: var(--p247-white); outline: none; transition: border-color .12s; }
.field-input:focus { border-color: var(--p247-orange); }
.input-error { border-color: var(--p247-danger) !important; }
.error-msg { font-size: 11px; color: var(--p247-danger); }

.manager-preview { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--p247-bg); border-radius: 8px; border: 0.5px solid var(--p247-border); }
.avatar   { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.mgr-name { font-size: 13px; font-weight: 500; }
.mgr-job  { font-size: 11px; color: var(--p247-muted); margin-top: 1px; }

.form-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 8px; border-top: 0.5px solid var(--p247-border); }

@media (max-width: 640px) { .field-grid { grid-template-columns: 1fr; } .content { padding: 16px; } }
</style>
