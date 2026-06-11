<template>
  <div v-if="canSwitchMode" class="flex flex-col gap-2.5">
    <div class="flex gap-1.5">
      <button
        :class="[modeBtn, modelValue.mode === 'self' && modeActive]"
        @click="setMode('self')"
      >
        <User class="w-3.5 h-3.5" /> Pour moi-même
      </button>
      <button
        :class="[modeBtn, modelValue.mode === 'for-employee' && modeActive]"
        @click="setMode('for-employee')"
      >
        <Users class="w-3.5 h-3.5" /> Pour un employé
      </button>
    </div>

    <div v-if="modelValue.mode === 'for-employee'" class="flex flex-col gap-1">
      <label class="text-xs font-medium text-foreground">Employé concerné *</label>
      <SearchableDropdown
        :items="availableEmployees"
        :model-value="modelValue.employeeId"
        placeholder="Sélectionner un employé"
        :show-avatar="true"
        @update:model-value="updateEmployee($event)"
      />
      <div v-if="errorEmployee" class="text-[11px] text-danger">{{ errorEmployee }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User, Users } from 'lucide-vue-next'
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

// ── Classes du design system ─────────────────────────────────
const modeBtn = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer border border-border bg-background text-muted-foreground transition-colors hover:bg-card hover:text-foreground'
const modeActive = '!bg-primary/10 !text-primary !border-primary'

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
