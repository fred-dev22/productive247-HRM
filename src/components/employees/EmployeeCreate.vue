<script setup lang="ts">
/**
 * Fiche de création d'un employé — sur CreateModalShell (pattern frontdesk).
 * Sélection de l'entité via TableLookupField (vraie entité).
 */
import { ref, reactive, computed } from 'vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import TableLookupField from '../ui/table-lookup/TableLookupField.vue'
import type { LookupFetchParams } from '../ui/table-lookup/TableLookupField.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore } from '../../stores/entities'
import type { UserRole, ContractType, EmployeeStatus } from '../../types'

const emit = defineEmits<{ close: []; created: [] }>()

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

const entityCode = ref('')
const form = reactive({
  firstName: '', lastName: '', jobTitle: '', email: '', phone: '',
  entityId: '' as string | null, entityName: '',
  role: '' as UserRole | '', contractType: '' as ContractType | '',
  hireDate: '', status: 'active' as EmployeeStatus,
})
const error = ref('')

const nextCode = computed(() => store.nextCode)

function onEntitySelect(item: Record<string, unknown>) {
  form.entityId = String(item.id); form.entityName = String(item.name); entityCode.value = String(item.code)
}

function validate(): boolean {
  if (!form.firstName.trim()) { error.value = 'Prénom requis'; return false }
  if (!form.lastName.trim()) { error.value = 'Nom requis'; return false }
  if (!form.jobTitle.trim()) { error.value = 'Poste requis'; return false }
  if (!form.entityId) { error.value = 'Entité requise'; return false }
  if (!form.role) { error.value = 'Rôle requis'; return false }
  if (!form.contractType) { error.value = 'Type de contrat requis'; return false }
  if (!form.hireDate) { error.value = 'Date d\'embauche requise'; return false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { error.value = 'Format email invalide'; return false }
  error.value = ''
  return true
}

function create() {
  if (!validate()) return
  store.createEmployee({
    firstName: form.firstName, lastName: form.lastName, jobTitle: form.jobTitle,
    email: form.email || undefined, phone: form.phone || undefined,
    entityId: form.entityId, entityName: form.entityName,
    role: form.role as UserRole, contractType: form.contractType as ContractType,
    hireDate: form.hireDate, status: form.status,
  })
  emit('created'); emit('close')
}
</script>

<template>
  <CreateModalShell
    title="Nouvel employé"
    banner-label="Nouvel employé"
    create-label="Créer l'employé"
    :save-error="error"
    @close="emit('close')"
    @create="create"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-3xl">
          <!-- Identité -->
          <FormSection title="Identité">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Matricule</label>
              <div class="text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center text-muted-foreground">{{ nextCode }}</div>
            </div>
            <div></div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Prénom <span class="text-danger">*</span></label>
              <input v-model="form.firstName" :class="cls.fieldInput" placeholder="ex : Aminata" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Nom <span class="text-danger">*</span></label>
              <input v-model="form.lastName" :class="cls.fieldInput" placeholder="ex : Diallo" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Poste <span class="text-danger">*</span></label>
              <input v-model="form.jobTitle" :class="cls.fieldInput" placeholder="ex : Assistante RH" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Email</label>
              <input type="email" v-model="form.email" :class="cls.fieldInput" placeholder="prenom.nom@galana.com" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Téléphone</label>
              <input type="tel" v-model="form.phone" :class="cls.fieldInput" placeholder="+261 …" />
            </div>
          </div>

          </FormSection>

          <!-- Affectation -->
          <FormSection title="Affectation">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Entité <span class="text-danger">*</span></label>
              <TableLookupField
                :code="entityCode" :name="form.entityName"
                value-key="code" name-key="name"
                :columns="entityColumns" :fetch-fn="fetchEntities"
                modal-title="Sélectionner une entité" placeholder="Code entité"
                @update:code="entityCode = $event" @update:name="form.entityName = $event" @select="onEntitySelect"
              />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Rôle <span class="text-danger">*</span></label>
              <select v-model="form.role" :class="cls.fieldSelect">
                <option value="">-- Choisir --</option>
                <option v-for="(l, v) in ROLE_LABELS" :key="v" :value="v">{{ l }}</option>
              </select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Type de contrat <span class="text-danger">*</span></label>
              <select v-model="form.contractType" :class="cls.fieldSelect">
                <option value="">-- Choisir --</option>
                <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="Stage">Stage</option><option value="Freelance">Freelance</option>
              </select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date d'embauche <span class="text-danger">*</span></label>
              <input type="date" v-model="form.hireDate" :class="cls.fieldInput" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Statut</label>
              <select v-model="form.status" :class="cls.fieldSelect">
                <option v-for="(l, v) in STATUS_LABELS" :key="v" :value="v">{{ l }}</option>
              </select>
            </div>
          </div>
          </FormSection>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
