<script setup lang="ts">
/**
 * Fiche d'un employé (lecture / édition) — sur CardModalShell, pattern
 * frontdesk. Sélection de l'entité via TableLookupField (vraie entité).
 */
import { ref, computed, watch } from 'vue'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import UserAvatar from '../ui/UserAvatar.vue'
import TableLookupField from '../ui/table-lookup/TableLookupField.vue'
import type { LookupFetchParams } from '../ui/table-lookup/TableLookupField.vue'
import * as cls from '../../lib/formClasses'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore } from '../../stores/entities'
import type { Employee, UserRole, ContractType, EmployeeStatus } from '../../types'

const props = defineProps<{ employees: Employee[]; employeeId: string }>()
const emit = defineEmits<{ close: [] }>()

const store = useEmployeeStore()
const entityStore = useEntityStore()

const ROLE_LABELS: Record<string, string> = { employee: 'Employé', validator: 'Validateur / Manager', hr_admin: 'Administrateur RH', hr_director: 'Directeur RH' }
const STATUS_LABELS: Record<string, string> = { active: 'Actif', trial: 'Période d\'essai', onleave: 'En congé', inactive: 'Inactif' }

const entityColumns = [{ key: 'code', label: 'Code', width: '90px' }, { key: 'name', label: 'Nom' }]
function fetchEntities({ searchQuery }: LookupFetchParams) {
  let items = entityStore.approvedEntities
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    items = items.filter(e => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q))
  }
  return { items, total: items.length }
}

const currentId = ref(props.employeeId)
watch(() => props.employeeId, (v) => { currentId.value = v; isEditMode.value = false })

const current = computed<Employee | null>(() => props.employees.find(e => e.id === currentId.value) ?? null)
const currentIndex = computed(() => props.employees.findIndex(e => e.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.employees.length - 1)
const sidebarItems = computed(() => props.employees.map(e => ({ no: e.code, label: e.name })))
const currentNo = computed(() => current.value?.code ?? null)

function goPrev() { if (hasPrev.value) { currentId.value = props.employees[currentIndex.value - 1]!.id; isEditMode.value = false } }
function goNext() { if (hasNext.value) { currentId.value = props.employees[currentIndex.value + 1]!.id; isEditMode.value = false } }
function selectSidebar(no: string) {
  const e = props.employees.find(x => x.code === no)
  if (e) { currentId.value = e.id; isEditMode.value = false }
}

/* ── Édition ────────────────────────────────────────────────── */
const isEditMode = ref(false)
const entityCode = ref('')
const form = ref({
  firstName: '', lastName: '', jobTitle: '', email: '', phone: '',
  entityId: '' as string | null, entityName: '',
  role: 'employee' as UserRole, contractType: 'CDI' as ContractType,
  hireDate: '', status: 'active' as EmployeeStatus,
})

function enterEdit() {
  if (!current.value) return
  const e = current.value
  form.value = {
    firstName: e.firstName, lastName: e.lastName, jobTitle: e.jobTitle, email: e.email ?? '', phone: e.phone ?? '',
    entityId: e.entityId, entityName: e.entityName ?? '', role: e.role, contractType: e.contractType,
    hireDate: e.hireDate, status: e.status,
  }
  const ent = e.entityId ? entityStore.getEntityById(e.entityId) : undefined
  entityCode.value = ent?.code ?? ''
  isEditMode.value = true
}
function cancelEdit() { isEditMode.value = false }
function onEntitySelect(item: Record<string, unknown>) {
  form.value.entityId = String(item.id); form.value.entityName = String(item.name); entityCode.value = String(item.code)
}
function save() {
  if (!current.value) return
  store.updateEmployee(current.value.id, { ...form.value })
  isEditMode.value = false
}

const pageTitle = computed(() => (current.value ? `${current.value.code} · ${current.value.name}` : ''))
const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="pageTitle"
    :page-number="current.code"
    banner-label="Fiche employé"
    :is-edit-mode="isEditMode"
    :show-edit="true"
    :show-title-new-button="false"
    :sidebar-items="sidebarItems"
    :current-no="currentNo"
    :has-prev="hasPrev"
    :has-next="hasNext"
    :has-unsaved-changes="isEditMode"
    @close="emit('close')"
    @enter-edit="enterEdit"
    @cancel-edit="cancelEdit"
    @save="save"
    @go-prev="goPrev"
    @go-next="goNext"
    @select-sidebar="selectSidebar"
  >
    <template #title-badges>
      <StatusPill :status="current.status" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Identité -->
        <div class="flex items-center border-b-2 border-primary pb-2 mb-5">
          <h2 class="text-base font-bold text-foreground">Identité</h2>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1 mb-7">
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Prénom</label>
            <input v-if="isEditMode" v-model="form.firstName" :class="cls.fieldInput" />
            <div v-else :class="readBox"><UserAvatar :name="current.name" size="sm" class="mr-2" />{{ current.firstName }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Nom</label>
            <input v-if="isEditMode" v-model="form.lastName" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.lastName }}</div>
          </div>
          <div :class="cls.field" class="col-span-2 max-sm:col-span-1">
            <label :class="cls.fieldLabel">Poste</label>
            <input v-if="isEditMode" v-model="form.jobTitle" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.jobTitle }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Email</label>
            <input v-if="isEditMode" type="email" v-model="form.email" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.email || '—' }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Téléphone</label>
            <input v-if="isEditMode" type="tel" v-model="form.phone" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.phone || '—' }}</div>
          </div>
        </div>

        <!-- Affectation -->
        <div class="flex items-center border-b-2 border-primary pb-2 mb-5">
          <h2 class="text-base font-bold text-foreground">Affectation</h2>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1 mb-7">
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Entité</label>
            <TableLookupField
              v-if="isEditMode"
              :code="entityCode" :name="form.entityName"
              value-key="code" name-key="name"
              :columns="entityColumns" :fetch-fn="fetchEntities"
              modal-title="Sélectionner une entité" placeholder="Code entité"
              @update:code="entityCode = $event" @update:name="form.entityName = $event" @select="onEntitySelect"
            />
            <div v-else :class="readBox">{{ current.entityName || '—' }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Rôle</label>
            <select v-if="isEditMode" v-model="form.role" :class="cls.fieldSelect">
              <option v-for="(l, v) in ROLE_LABELS" :key="v" :value="v">{{ l }}</option>
            </select>
            <div v-else :class="readBox">{{ ROLE_LABELS[current.role] }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Type de contrat</label>
            <select v-if="isEditMode" v-model="form.contractType" :class="cls.fieldSelect">
              <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="Stage">Stage</option><option value="Freelance">Freelance</option>
            </select>
            <div v-else :class="readBox">{{ current.contractType }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Date d'embauche</label>
            <input v-if="isEditMode" type="date" v-model="form.hireDate" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.hireDate }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Statut</label>
            <select v-if="isEditMode" v-model="form.status" :class="cls.fieldSelect">
              <option v-for="(l, v) in STATUS_LABELS" :key="v" :value="v">{{ l }}</option>
            </select>
            <div v-else :class="readBox"><StatusPill :status="current.status" /></div>
          </div>
        </div>
      </div>
    </template>
  </CardModalShell>
</template>
