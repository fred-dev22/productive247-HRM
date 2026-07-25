<script setup lang="ts">
/**
 * Fiche d'un employé (lecture / édition) — sur CardModalShell, pattern
 * frontdesk. Sélection de l'entité via TableLookupField (vraie entité).
 */
import { ref, computed, watch } from 'vue'
import { ShieldCheck, KeyRound, UserX } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import UserAvatar from '../ui/UserAvatar.vue'
import TableLookupField from '../ui/table-lookup/TableLookupField.vue'
import type { LookupFetchParams } from '../ui/table-lookup/TableLookupField.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import CreateUserAccountDialog from './CreateUserAccountDialog.vue'
import * as cls from '../../lib/formClasses'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore } from '../../stores/entities'
import { usePositionStore } from '../../stores/positions'
import { useAuthStore } from '../../stores/auth'
import type { Employee, UserRole, ContractType, EmployeeStatus } from '../../types'

const props = defineProps<{ employees: Employee[]; employeeId: string }>()
const emit = defineEmits<{ close: [] }>()

const store = useEmployeeStore()
const entityStore = useEntityStore()
const positionStore = usePositionStore()
const auth = useAuthStore()
if (positionStore.positions.length === 0) positionStore.fetchAll()

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

const positionColumns = [{ key: 'code', label: 'Code', width: '90px' }, { key: 'title', label: 'Poste' }]
function fetchPositions({ searchQuery }: LookupFetchParams) {
  let items = positionStore.positions
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    items = items.filter(p => p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
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
const positionCode = ref('')
const saveError = ref('')
const form = ref({
  firstName: '', lastName: '', email: '', phone: '',
  positionId: '' as string | null, positionTitle: '',
  entityId: '' as string | null, entityName: '',
  role: 'employee' as UserRole, contractType: 'CDI' as ContractType,
  hireDate: '', status: 'active' as EmployeeStatus,
})

function enterEdit() {
  if (!current.value) return
  const e = current.value
  form.value = {
    firstName: e.firstName, lastName: e.lastName, email: e.email ?? '', phone: e.phone ?? '',
    positionId: e.positionId ?? '', positionTitle: e.jobTitle,
    entityId: e.entityId, entityName: e.entityName ?? '', role: e.role, contractType: e.contractType,
    hireDate: e.hireDate, status: e.status,
  }
  const ent = e.entityId ? entityStore.getEntityById(e.entityId) : undefined
  entityCode.value = ent?.code ?? ''
  positionCode.value = ''
  saveError.value = ''
  isEditMode.value = true
}
function cancelEdit() { isEditMode.value = false; saveError.value = '' }
function onEntitySelect(item: Record<string, unknown>) {
  form.value.entityId = String(item.id); form.value.entityName = String(item.name); entityCode.value = String(item.code)
}
function onPositionSelect(item: Record<string, unknown>) {
  form.value.positionId = String(item.id); form.value.positionTitle = String(item.title); positionCode.value = String(item.code)
}
async function save() {
  if (!current.value) return
  try {
    await store.updateEmployee(current.value.id, { ...form.value, jobTitle: form.value.positionTitle })
    isEditMode.value = false
  } catch {
    saveError.value = store.error ?? "L'enregistrement a échoué. Veuillez réessayer."
  }
}

const pageTitle = computed(() => (current.value ? `${current.value.code} · ${current.value.name}` : ''))
const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'

/* ── Accès système (compte utilisateur) ────────────────────────── */
const showCreateAccount = ref(false)
function onAccountCreated() {
  if (current.value) store.markHasAccount(current.value.id)
}

/* ── Désactivation ──────────────────────────────────────────────── */
const deactivating = ref(false)
async function deactivate() {
  if (!current.value) return
  if (!confirm(`Désactiver ${current.value.name} ? L'employé ne sera plus actif mais reste consultable.`)) return
  deactivating.value = true
  try {
    await store.deactivateEmployee(current.value.id)
  } catch {
    // store.error porte le message pour l'UI (toast)
  } finally {
    deactivating.value = false
  }
}
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="pageTitle"
    :page-number="current.code"
    banner-label="Fiche employé"
    :is-edit-mode="isEditMode"
    :show-edit="auth.hasPermission('EMPLOYE_MODIFIER')"
    :show-title-new-button="false"
    :sidebar-items="sidebarItems"
    :current-no="currentNo"
    :has-prev="hasPrev"
    :has-next="hasNext"
    :has-unsaved-changes="isEditMode"
    :save-error="saveError"
    @close="emit('close')"
    @enter-edit="enterEdit"
    @cancel-edit="cancelEdit"
    @save="save"
    @go-prev="goPrev"
    @go-next="goNext"
    @select-sidebar="selectSidebar"
    @clear-save-error="saveError = ''"
  >
    <template #title-badges>
      <StatusPill :status="current.status" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Identité -->
        <FormSection title="Identité" :recaps="[current.name, current.jobTitle]">
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
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
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Poste</label>
            <TableLookupField
              v-if="isEditMode"
              :code="positionCode" :name="form.positionTitle"
              value-key="code" name-key="title"
              :columns="positionColumns" :fetch-fn="fetchPositions"
              modal-title="Sélectionner un poste" placeholder="Code poste"
              @update:code="positionCode = $event" @update:name="form.positionTitle = $event" @select="onPositionSelect"
            />
            <div v-else :class="readBox">{{ current.jobTitle || '—' }}</div>
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
        </FormSection>

        <!-- Affectation -->
        <FormSection title="Affectation" :recaps="[current.entityName, ROLE_LABELS[current.role]]">
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
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
        </FormSection>

        <!-- Accès système -->
        <FormSection title="Accès système">
        <div class="flex items-center justify-between gap-3 bg-background border border-border rounded-lg px-4 py-3">
          <div class="flex items-center gap-2.5">
            <ShieldCheck v-if="current.hasAccount" class="w-4 h-4 text-success shrink-0" />
            <KeyRound v-else class="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <div class="text-[13px] font-medium text-foreground">{{ current.hasAccount ? 'Compte actif' : 'Aucun compte' }}</div>
              <div class="text-[11px] text-muted-foreground">{{ current.hasAccount ? 'Cet employé peut se connecter à l\'application' : 'Cet employé n\'a pas encore accès à l\'application' }}</div>
            </div>
          </div>
          <button v-if="!current.hasAccount && auth.hasPermission('EMPLOYE_COMPTE_CREER')" :class="[cls.btnOutline, '!px-3 !py-1.5 !text-xs shrink-0']" @click="showCreateAccount = true">
            Créer un compte utilisateur
          </button>
        </div>
        </FormSection>

        <!-- Désactivation -->
        <div v-if="current.status !== 'inactive' && auth.hasPermission('EMPLOYE_DESACTIVER')" class="flex justify-end mt-1">
          <button :class="[cls.btnOutline, '!text-danger !border-danger/30 hover:!bg-danger-bg']" :disabled="deactivating" @click="deactivate">
            <UserX class="w-3.5 h-3.5" /> {{ deactivating ? 'Désactivation…' : 'Désactiver cet employé' }}
          </button>
        </div>
      </div>
    </template>
  </CardModalShell>

  <CreateUserAccountDialog
    v-if="showCreateAccount && current"
    :employee-id="current.id"
    :employee-name="current.name"
    :employee-email="current.email"
    :employee-role="current.role"
    @close="showCreateAccount = false"
    @created="onAccountCreated"
  />
</template>
