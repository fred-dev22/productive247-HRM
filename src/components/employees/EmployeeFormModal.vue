<template>
  <ModalShell
    :open="modelValue"
    :title="isEditMode ? 'Modifier l\'employé' : 'Nouvel employé'"
    max-width="max-w-[680px]"
    @close="close"
  >

    <!-- Section : Identité -->
    <div :class="sectionTitle">
      <User class="w-3.5 h-3.5 text-primary" />
      Identité
    </div>

    <div :class="fieldGrid">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Prénom *</label>
        <input
          v-model="form.firstName"
          :class="[cls.fieldInput, errors.firstName && cls.inputError]"
          placeholder="ex: Aminata"
        />
        <div v-if="errors.firstName" :class="cls.fieldError">{{ errors.firstName }}</div>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Nom *</label>
        <input
          v-model="form.lastName"
          :class="[cls.fieldInput, errors.lastName && cls.inputError]"
          placeholder="ex: Diallo"
        />
        <div v-if="errors.lastName" :class="cls.fieldError">{{ errors.lastName }}</div>
      </div>
      <div :class="[cls.field, 'col-span-full']">
        <label :class="cls.fieldLabel">Poste / Intitulé du poste *</label>
        <input
          v-model="form.jobTitle"
          :class="[cls.fieldInput, errors.jobTitle && cls.inputError]"
          placeholder="ex: Assistante RH"
        />
        <div v-if="errors.jobTitle" :class="cls.fieldError">{{ errors.jobTitle }}</div>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Email professionnel</label>
        <input
          v-model="form.email"
          type="email"
          :class="[cls.fieldInput, errors.email && cls.inputError]"
          placeholder="prenom.nom@galana.com"
        />
        <div v-if="errors.email" :class="cls.fieldError">{{ errors.email }}</div>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Téléphone</label>
        <input v-model="form.phone" type="tel" :class="cls.fieldInput" placeholder="+230 5xx xxxx" />
      </div>
    </div>

    <!-- Section : Affectation -->
    <div :class="sectionTitle">
      <Building class="w-3.5 h-3.5 text-primary" />
      Affectation
    </div>

    <div :class="fieldGrid">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Entité *</label>
        <select v-model="form.entityId" :class="[cls.fieldSelect, errors.entityId && cls.inputError]" @change="onEntityChange">
          <option value="">-- Choisir une entité --</option>
          <option v-for="e in selectableEntities" :key="e.id" :value="e.id">
            {{ e.code }} — {{ e.name }}
          </option>
        </select>
        <div v-if="errors.entityId" :class="cls.fieldError">{{ errors.entityId }}</div>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Rôle *</label>
        <select v-model="form.role" :class="[cls.fieldSelect, errors.role && cls.inputError]">
          <option value="">-- Choisir un rôle --</option>
          <option value="employee">Employé</option>
          <option value="validator">Validateur / Manager</option>
          <option value="hr_admin">Administrateur RH</option>
          <option value="hr_director">Directeur RH</option>
        </select>
        <div v-if="errors.role" :class="cls.fieldError">{{ errors.role }}</div>
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
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" :style="{ background: directManager.avatarColor }">
              {{ directManager.initials }}
            </div>
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

    <!-- Section : Contrat -->
    <div :class="sectionTitle">
      <FileText class="w-3.5 h-3.5 text-primary" />
      Contrat
    </div>

    <div :class="fieldGrid">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Type de contrat *</label>
        <select v-model="form.contractType" :class="[cls.fieldSelect, errors.contractType && cls.inputError]">
          <option value="">-- Choisir --</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="Stage">Stage</option>
          <option value="Freelance">Freelance</option>
        </select>
        <div v-if="errors.contractType" :class="cls.fieldError">{{ errors.contractType }}</div>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Date d'embauche *</label>
        <input
          v-model="form.hireDate"
          type="date"
          :class="[cls.fieldInput, errors.hireDate && cls.inputError]"
        />
        <div v-if="errors.hireDate" :class="cls.fieldError">{{ errors.hireDate }}</div>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Statut</label>
        <select v-model="form.status" :class="cls.fieldSelect">
          <option value="active">Actif</option>
          <option value="trial">Période d'essai</option>
          <option value="onleave">En congé</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>
    </div>

    <!-- ── Pied ── -->
    <template #footer>
      <button :class="cls.btnOutline" @click="close">Annuler</button>
      <button :class="cls.btnPrimary" @click="handleSave">
        <Check class="w-4 h-4" />
        {{ isEditMode ? 'Enregistrer' : 'Créer l\'employé' }}
      </button>
    </template>

  </ModalShell>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { User, Building, FileText, Lock, Info, Check } from 'lucide-vue-next'
import ModalShell from '../ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore }   from '../../stores/entities'
import type { UserRole, ContractType, EmployeeStatus } from '../../types'

const props = defineProps<{
  modelValue: boolean
  editId?:    string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'saved': []
}>()

// ── Classes du design system ─────────────────────────────────
const sectionTitle = 'flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-[0.06em] pb-2 border-b border-border'
const fieldGrid = 'grid grid-cols-2 gap-3 max-sm:grid-cols-1'

const store       = useEmployeeStore()
const entityStore = useEntityStore()

const isEditMode = computed(() => !!props.editId)
const editEmp    = computed(() => props.editId ? store.getById(props.editId) : undefined)

const form = reactive({
  firstName:    '',
  lastName:     '',
  jobTitle:     '',
  email:        '',
  phone:        '',
  entityId:     '' as string | null,
  entityName:   '',
  role:         '' as UserRole | '',
  contractType: '' as ContractType | '',
  hireDate:     '',
  status:       'active' as EmployeeStatus,
  managerId:    '' as string | undefined,
})

const errors = reactive({
  firstName: '', lastName: '', jobTitle: '', email: '',
  entityId: '', role: '', contractType: '', hireDate: '',
})

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']

// Inclut les entités en brouillon / en attente — indispensable pendant
// l'onboarding où les entités fraîchement créées ne sont pas encore approuvées
const selectableEntities = computed(() =>
  entityStore.entities.filter(e => e.status !== 'Inactive')
)

const directManager = computed(() => {
  const entity = selectableEntities.value.find(e => e.id === form.entityId)
  if (!entity?.responsibleName) return null
  const idx = entity.id.charCodeAt(0) % AVATAR_COLORS.length
  return {
    name:        entity.responsibleName,
    initials:    getInitials(entity.responsibleName),
    avatarColor: AVATAR_COLORS[idx] ?? AVATAR_COLORS[0],
    managerId:   entity.managerId ?? null,
  }
})

function onEntityChange() {
  const e = selectableEntities.value.find(e => e.id === form.entityId)
  form.entityName = e?.name ?? ''
  form.managerId  = e?.managerId ?? ''
}

function populate() {
  if (isEditMode.value && editEmp.value) {
    const e = editEmp.value
    form.firstName    = e.firstName
    form.lastName     = e.lastName
    form.jobTitle     = e.jobTitle
    form.email        = e.email ?? ''
    form.phone        = e.phone ?? ''
    form.entityId     = e.entityId
    form.entityName   = e.entityName ?? ''
    form.role         = e.role
    form.contractType = e.contractType
    form.hireDate     = e.hireDate
    form.status       = e.status
    form.managerId    = e.managerId ?? ''
  } else {
    Object.assign(form, {
      firstName: '', lastName: '', jobTitle: '', email: '', phone: '',
      entityId: '', entityName: '', role: '', contractType: '',
      hireDate: '', status: 'active', managerId: '',
    })
  }
  // Sync manager from entity on open
  if (form.entityId) {
    const e = selectableEntities.value.find(e => e.id === form.entityId)
    if (e?.managerId) form.managerId = e.managerId
  }
  Object.assign(errors, {
    firstName: '', lastName: '', jobTitle: '', email: '',
    entityId: '', role: '', contractType: '', hireDate: '',
  })
}

watch(() => props.modelValue, v => { if (v) populate() })

function validate(): boolean {
  Object.assign(errors, {
    firstName: '', lastName: '', jobTitle: '', email: '',
    entityId: '', role: '', contractType: '', hireDate: '',
  })
  let ok = true
  if (!form.firstName.trim())  { errors.firstName    = 'Prénom requis'; ok = false }
  if (!form.lastName.trim())   { errors.lastName     = 'Nom requis'; ok = false }
  if (!form.jobTitle.trim())   { errors.jobTitle     = 'Poste requis'; ok = false }
  if (!form.entityId)          { errors.entityId     = 'Entité requise'; ok = false }
  if (!form.role)              { errors.role         = 'Rôle requis'; ok = false }
  if (!form.contractType)      { errors.contractType = 'Type de contrat requis'; ok = false }
  if (!form.hireDate)          { errors.hireDate     = "Date d'embauche requise"; ok = false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Format email invalide'; ok = false
  }
  return ok
}

function close() { emit('update:modelValue', false) }

function handleSave() {
  if (!validate()) return

  const payload = {
    firstName:    form.firstName,
    lastName:     form.lastName,
    jobTitle:     form.jobTitle,
    email:        form.email     || undefined,
    phone:        form.phone     || undefined,
    entityId:     form.entityId  || null,
    entityName:   form.entityName,
    role:         form.role      as UserRole,
    contractType: form.contractType as ContractType,
    hireDate:     form.hireDate,
    status:       form.status,
    managerId:    (directManager.value?.managerId ?? form.managerId) || undefined,
  }

  if (isEditMode.value && props.editId) {
    store.updateEmployee(props.editId, payload)
  } else {
    store.createEmployee(payload)
  }

  emit('saved')
  close()
}
</script>
