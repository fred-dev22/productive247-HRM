<template>
  <div class="px-7 py-6">

        <div :class="L.pageHeader">
          <div>
            <div :class="L.pageTitle">{{ isEdit ? t('employee.edit_title') : t('employee.new') }}</div>
            <div :class="L.pageSub" v-if="isEdit && editEmp">{{ editEmp.name }}</div>
          </div>
          <router-link :to="{ name: 'hr-employees' }" :class="L.btnOutline">
            <ArrowLeft class="w-4 h-4" /> {{ t('employee.btn_cancel') }}
          </router-link>
        </div>

        <div class="flex justify-center">
          <div class="w-full max-w-[800px] bg-card border border-border rounded-lg p-6 flex flex-col gap-6">

            <!-- ── Section 1 : Identité ── -->
            <div class="flex flex-col gap-3.5">
              <div :class="sectionTitle"><User class="w-4 h-4 text-primary" /> {{ t('employee.section_identity') }}</div>
              <div :class="fieldGrid">
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_first_name') }} *</label>
                  <input v-model="form.firstName" :class="[cls.fieldInput, err.firstName && cls.inputError]" :placeholder="t('employee.placeholder_first')" />
                  <div v-if="err.firstName" :class="cls.fieldError">{{ err.firstName }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_last_name') }} *</label>
                  <input v-model="form.lastName" :class="[cls.fieldInput, err.lastName && cls.inputError]" :placeholder="t('employee.placeholder_last')" />
                  <div v-if="err.lastName" :class="cls.fieldError">{{ err.lastName }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_code') }} *</label>
                  <input v-model="form.code" :class="[cls.fieldInput, err.code && cls.inputError]" :placeholder="t('employee.placeholder_code')" @input="form.code = (form.code as string).toUpperCase()" />
                  <div v-if="err.code" :class="cls.fieldError">{{ err.code }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_email') }}</label>
                  <input v-model="form.email" type="email" :class="[cls.fieldInput, err.email && cls.inputError]" :placeholder="t('employee.placeholder_email')" />
                  <div v-if="err.email" :class="cls.fieldError">{{ err.email }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_phone') }}</label>
                  <input v-model="form.phone" type="tel" :class="cls.fieldInput" :placeholder="t('employee.placeholder_phone')" />
                </div>
              </div>
            </div>

            <!-- ── Section 2 : Poste & Affectation ── -->
            <div class="flex flex-col gap-3.5">
              <div :class="sectionTitle"><Briefcase class="w-4 h-4 text-primary" /> {{ t('employee.section_position') }}</div>
              <div :class="fieldGrid">
                <div :class="[cls.field, 'col-span-full']">
                  <label :class="cls.fieldLabel">{{ t('employee.field_job_title') }} *</label>
                  <input v-model="form.jobTitle" :class="[cls.fieldInput, err.jobTitle && cls.inputError]" :placeholder="t('employee.placeholder_job')" />
                  <div v-if="err.jobTitle" :class="cls.fieldError">{{ err.jobTitle }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_entity') }} *</label>
                  <select v-model="form.entityId" :class="[cls.fieldSelect, err.entityId && cls.inputError]" @change="onEntityChange">
                    <option value="">{{ t('employee.placeholder_entity') }}</option>
                    <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.id">
                      {{ e.code }} — {{ e.name }}
                    </option>
                  </select>
                  <div v-if="err.entityId" :class="cls.fieldError">{{ err.entityId }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_role') }} *</label>
                  <select v-model="form.role" :class="[cls.fieldSelect, err.role && cls.inputError]">
                    <option value="">{{ t('employee.placeholder_role') }}</option>
                    <option value="employee">{{ t('employee.role_employee') }}</option>
                    <option value="validator">{{ t('employee.role_validator') }}</option>
                    <option value="hr_admin">{{ t('employee.role_hr_admin') }}</option>
                    <option value="hr_director">{{ t('employee.role_hr_director') }}</option>
                  </select>
                  <div v-if="err.role" :class="cls.fieldError">{{ err.role }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_contract') }} *</label>
                  <select v-model="form.contractType" :class="[cls.fieldSelect, err.contractType && cls.inputError]">
                    <option value="">{{ t('employee.placeholder_contract') }}</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                  <div v-if="err.contractType" :class="cls.fieldError">{{ err.contractType }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_hire_date') }} *</label>
                  <input v-model="form.hireDate" type="date" :class="[cls.fieldInput, err.hireDate && cls.inputError]" />
                  <div v-if="err.hireDate" :class="cls.fieldError">{{ err.hireDate }}</div>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_status') }}</label>
                  <select v-model="form.status" :class="cls.fieldSelect">
                    <option value="active">{{ t('employee.status_active') }}</option>
                    <option value="trial">{{ t('employee.status_trial') }}</option>
                    <option value="onleave">{{ t('employee.status_onleave') }}</option>
                    <option value="inactive">{{ t('employee.status_inactive') }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- ── Section 3 : Manager ── -->
            <div class="flex flex-col gap-3.5">
              <div :class="sectionTitle"><ShieldCheck class="w-4 h-4 text-primary" /> {{ t('employee.section_manager') }}</div>
              <p class="text-xs text-muted-foreground -mt-2">{{ t('employee.manager_desc') }}</p>
              <div :class="fieldGrid">
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">{{ t('employee.field_manager') }}</label>
                  <select v-model="form.managerId" :class="cls.fieldSelect">
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
                <div :class="cls.field" v-if="selectedManager">
                  <label :class="cls.fieldLabel">{{ t('employee.selected_manager') }}</label>
                  <div class="flex items-center gap-2.5 px-3 py-2 bg-background rounded-lg border border-border">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" :style="{ background: selectedManager.avatarBg, color: selectedManager.avatarText }">
                      {{ selectedManager.initials }}
                    </div>
                    <div>
                      <div class="text-[13px] font-medium">{{ selectedManager.name }}</div>
                      <div class="text-[11px] text-muted-foreground mt-px">{{ selectedManager.jobTitle }} · {{ selectedManager.entityName }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Actions ── -->
            <div class="flex gap-2 justify-end pt-2 border-t border-border">
              <button :class="cls.btnPrimary" @click="handleSave">
                <Save class="w-4 h-4" />
                {{ isEdit ? t('employee.btn_update') : t('employee.btn_save') }}
              </button>
            </div>

          </div>
        </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, User, Briefcase, ShieldCheck, Save } from 'lucide-vue-next'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
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

// ── Classes du design system ─────────────────────────────────
const sectionTitle = 'flex items-center gap-2 text-sm font-semibold pb-2.5 border-b border-border'
const fieldGrid = 'grid grid-cols-2 gap-3.5 max-sm:grid-cols-1'

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
