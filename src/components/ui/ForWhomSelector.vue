<template>
  <div v-if="canSwitchMode" class="for-whom">
    <div class="mode-toggle">
      <button
        class="mode-btn"
        :class="{ active: modelValue.mode === 'self' }"
        @click="setMode('self')"
      >
        <i class="ti ti-user" aria-hidden="true"></i> Pour moi-même
      </button>
      <button
        class="mode-btn"
        :class="{ active: modelValue.mode === 'for-employee' }"
        @click="setMode('for-employee')"
      >
        <i class="ti ti-users" aria-hidden="true"></i> Pour un employé
      </button>
    </div>

    <div v-if="modelValue.mode === 'for-employee'" class="field">
      <label class="field-label">Employé concerné *</label>
      <SearchableDropdown
        :items="availableEmployees"
        :model-value="modelValue.employeeId"
        placeholder="Sélectionner un employé"
        :show-avatar="true"
        @update:model-value="updateEmployee($event)"
      />
      <div v-if="errorEmployee" class="field-error">{{ errorEmployee }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SearchableDropdown from './SearchableDropdown.vue'
import { useAuthStore } from '../../stores/auth'

export interface BeneficiaryValue {
  mode: 'self' | 'for-employee'
  employeeId: string
}

interface EmployeeItem {
  id: string
  label: string
  sublabel?: string
  initials?: string
  avatarColor?: string
}

const props = defineProps<{
  modelValue: BeneficiaryValue
  availableEmployees: EmployeeItem[]
  errorEmployee?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BeneficiaryValue]
}>()

const auth = useAuthStore()

const canSwitchMode = computed(() =>
  ['hr_admin', 'hr_director', 'validator'].includes(auth.user?.role ?? '')
)

function setMode(mode: 'self' | 'for-employee') {
  emit('update:modelValue', { mode, employeeId: '' })
}

function updateEmployee(employeeId: string) {
  emit('update:modelValue', { mode: 'for-employee', employeeId })
}
</script>

<style scoped>
.for-whom { display: flex; flex-direction: column; gap: 10px; }

.mode-toggle { display: flex; gap: 6px; }
.mode-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 500;
  cursor: pointer; border: 0.5px solid var(--color-border);
  background: var(--color-bg); color: var(--color-text-muted); transition: all .12s;
}
.mode-btn.active {
  background: var(--color-primary-light); color: var(--color-primary);
  border-color: var(--color-primary);
}
.mode-btn:hover:not(.active) { background: var(--color-surface); color: var(--color-text); }

.field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-error { font-size: 11px; color: var(--color-danger); }
</style>
