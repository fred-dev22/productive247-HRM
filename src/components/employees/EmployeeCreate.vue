<script setup lang="ts">
/**
 * Fiche de création d'un employé — sur CreateModalShell (pattern frontdesk).
 * Sélection de l'entité et du poste via TableLookupField (vraies données).
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { Info, Lock } from 'lucide-vue-next'
import CreateModalShell from '../shared/CreateModalShell.vue'
import TableLookupField from '../ui/table-lookup/TableLookupField.vue'
import type { LookupFetchParams } from '../ui/table-lookup/TableLookupField.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore } from '../../stores/entities'
import { usePositionStore } from '../../stores/positions'
import type { UserRole, ContractType, EmployeeStatus, Gender, MaritalStatus, IdDocumentType } from '../../types'

const emit = defineEmits<{ close: []; created: [] }>()

const store = useEmployeeStore()
const entityStore = useEntityStore()
const positionStore = usePositionStore()

onMounted(() => {
  if (positionStore.positions.length === 0) positionStore.fetchAll()
})

const ROLE_LABELS: Record<string, string> = { employee: 'Employé', validator: 'Validateur / Manager', hr_admin: 'Administrateur RH', hr_director: 'Directeur RH' }
const STATUS_LABELS: Record<string, string> = { active: 'Actif', trial: 'Période d\'essai', onleave: 'En congé', inactive: 'Inactif' }
const GENDER_LABELS: Record<Gender, string> = { M: 'Homme', F: 'Femme' }
const MARITAL_LABELS: Record<MaritalStatus, string> = { Single: 'Célibataire', Married: 'Marié(e)', Divorced: 'Divorcé(e)', Widowed: 'Veuf / Veuve' }
const ID_TYPE_LABELS: Record<IdDocumentType, string> = { NationalId: "Carte d'identité nationale", Passport: 'Passeport', ResidencePermit: 'Carte de séjour' }

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
  // Un poste deja occupe ne doit plus etre propose a la creation — un seul
  // employe par poste (voir Position.OccupationStatus).
  let items = positionStore.positions.filter(p => p.occupationStatus === 'Vacant')
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    items = items.filter(p => p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
  }
  return { items, total: items.length }
}

const entityCode = ref('')
const positionCode = ref('')
const form = reactive({
  firstName: '', lastName: '', email: '', phone: '',
  entityId: '' as string | null, entityName: '',
  positionId: '' as string | null, positionTitle: '',
  role: '' as UserRole | '', contractType: '' as ContractType | '',
  hireDate: '', status: 'active' as EmployeeStatus,
  gender: '' as Gender | '', birthDate: '', birthPlace: '',
  maritalStatus: '' as MaritalStatus | '', idType: '' as IdDocumentType | '', idNumber: '',
})
const error = ref('')

const nextCode = computed(() => store.nextCode)

function onEntitySelect(item: Record<string, unknown>) {
  form.entityId = String(item.id); form.entityName = String(item.name); entityCode.value = String(item.code)
}
function onPositionSelect(item: Record<string, unknown>) {
  form.positionId = String(item.id); form.positionTitle = String(item.title); positionCode.value = String(item.code)
}

// Manager auto-dérivé du responsable de l'entité choisie — pas éditable
// directement (voir Employee.managerId, déduit de l'entité de rattachement).
const directManager = computed(() => {
  const entity = entityStore.entities.find(e => e.id === form.entityId)
  if (!entity?.responsibleName) return null
  return { name: entity.responsibleName, managerId: entity.managerId ?? null }
})

function validate(): boolean {
  if (!form.firstName.trim()) { error.value = 'Prénom requis'; return false }
  if (!form.lastName.trim()) { error.value = 'Nom requis'; return false }
  if (!form.entityId) { error.value = 'Entité requise'; return false }
  if (!form.role) { error.value = 'Rôle requis'; return false }
  if (!form.contractType) { error.value = 'Type de contrat requis'; return false }
  if (!form.hireDate) { error.value = 'Date d\'embauche requise'; return false }
  if (!form.gender) { error.value = 'Genre requis'; return false }
  if (!form.birthDate) { error.value = 'Date de naissance requise'; return false }
  if (!form.maritalStatus) { error.value = 'Situation familiale requise'; return false }
  if (!form.idType) { error.value = "Type de pièce d'identité requis"; return false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { error.value = 'Format email invalide'; return false }
  error.value = ''
  return true
}

async function create() {
  if (!validate()) return
  try {
    await store.createEmployee({
      firstName: form.firstName, lastName: form.lastName,
      jobTitle: form.positionTitle, positionId: form.positionId || undefined,
      email: form.email || undefined, phone: form.phone || undefined,
      entityId: form.entityId, entityName: form.entityName,
      role: form.role as UserRole, contractType: form.contractType as ContractType,
      hireDate: form.hireDate, status: form.status,
      managerId: directManager.value?.managerId ?? undefined,
      gender: form.gender as Gender, birthDate: form.birthDate, birthPlace: form.birthPlace || undefined,
      maritalStatus: form.maritalStatus as MaritalStatus, idType: form.idType as IdDocumentType,
      idNumber: form.idNumber || undefined,
      // Un employé fraîchement créé n'a jamais de compte — hasAccount ne
      // devient vrai que via l'action "Créer un compte utilisateur" (voir
      // CreateUserAccountDialog.vue), jamais choisi à la création.
      hasAccount: false,
    })
    emit('created'); emit('close')
  } catch {
    error.value = store.error ?? "La création a échoué. Veuillez réessayer."
  }
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
        <div class="max-w-3xl mx-auto">
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
              <label :class="cls.fieldLabel">Email</label>
              <input type="email" v-model="form.email" :class="cls.fieldInput" placeholder="prenom.nom@galana.com" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Téléphone</label>
              <input type="tel" v-model="form.phone" :class="cls.fieldInput" placeholder="+261 …" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Genre <span class="text-danger">*</span></label>
              <select v-model="form.gender" :class="cls.fieldSelect">
                <option value="">-- Choisir --</option>
                <option v-for="(l, v) in GENDER_LABELS" :key="v" :value="v">{{ l }}</option>
              </select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date de naissance <span class="text-danger">*</span></label>
              <input type="date" v-model="form.birthDate" :class="cls.fieldInput" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Lieu de naissance</label>
              <input v-model="form.birthPlace" :class="cls.fieldInput" placeholder="ex : Antananarivo" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Situation familiale <span class="text-danger">*</span></label>
              <select v-model="form.maritalStatus" :class="cls.fieldSelect">
                <option value="">-- Choisir --</option>
                <option v-for="(l, v) in MARITAL_LABELS" :key="v" :value="v">{{ l }}</option>
              </select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Type de pièce d'identité <span class="text-danger">*</span></label>
              <select v-model="form.idType" :class="cls.fieldSelect">
                <option value="">-- Choisir --</option>
                <option v-for="(l, v) in ID_TYPE_LABELS" :key="v" :value="v">{{ l }}</option>
              </select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Numéro de pièce</label>
              <input v-model="form.idNumber" :class="cls.fieldInput" placeholder="ex : 101123456789" />
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
              <label :class="cls.fieldLabel">Poste</label>
              <TableLookupField
                :code="positionCode" :name="form.positionTitle"
                value-key="code" name-key="title"
                :columns="positionColumns" :fetch-fn="fetchPositions"
                modal-title="Sélectionner un poste" placeholder="Code poste"
                @update:code="positionCode = $event" @update:name="form.positionTitle = $event" @select="onPositionSelect"
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
            <div :class="[cls.field, 'col-span-full']">
              <label :class="cls.fieldLabel">
                Manager direct
                <span class="inline-flex items-center gap-[3px] text-[10px] font-semibold text-muted-foreground bg-background border border-border rounded-full px-1.5 py-px ml-1.5 align-middle">
                  <Lock class="w-2.5 h-2.5" /> Auto
                </span>
              </label>
              <div
                class="flex items-center gap-2 h-9 px-2.5 border border-border rounded-md bg-background text-[13px] text-foreground"
                :class="{ 'text-muted-foreground italic': !directManager }"
              >
                <template v-if="directManager">
                  <span class="font-medium">{{ directManager.name }}</span>
                  <span class="text-muted-foreground text-xs">· Responsable d'entité</span>
                </template>
                <span v-else class="text-xs text-muted-foreground">Sélectionnez une entité pour voir le manager</span>
              </div>
              <span class="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Info class="w-3 h-3 text-primary" />
                Défini automatiquement depuis le responsable de l'entité de rattachement
              </span>
            </div>
          </div>
          </FormSection>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
