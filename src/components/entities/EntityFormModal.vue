<template>
  <ModalShell
    :open="modelValue"
    :title="isEditMode ? 'Modifier l\'entité' : 'Nouvelle entité'"
    max-width="max-w-[720px]"
    @close="close"
  >

    <!-- Section 1 : Informations générales -->
    <div :class="sectionTitle">
      <Building class="w-[15px] h-[15px] text-primary" />
      Informations générales
    </div>

    <div :class="fieldGrid">
      <div :class="[cls.field, 'col-span-full']">
        <label :class="cls.fieldLabel">Intitulé *</label>
        <input
          v-model="form.name"
          :class="[cls.fieldInput, errors.name && cls.inputError]"
          placeholder="ex: Direction des Ressources Humaines"
        />
        <div v-if="errors.name" :class="cls.fieldError">{{ errors.name }}</div>
      </div>

      <div :class="cls.field">
        <label :class="cls.fieldLabel">Code * <span :class="hint">(max 10 car.)</span></label>
        <input
          v-model="form.code"
          :class="[cls.fieldInput, errors.code && cls.inputError]"
          placeholder="ex: DRH"
          maxlength="10"
          @input="form.code = form.code.toUpperCase()"
        />
        <div v-if="errors.code" :class="cls.fieldError">{{ errors.code }}</div>
      </div>

      <div :class="cls.field">
        <label :class="cls.fieldLabel">Type *</label>
        <select v-model="form.type" :class="[cls.fieldSelect, errors.type && cls.inputError]">
          <option value="">-- Choisir un type --</option>
          <option value="direction">Direction</option>
          <option value="department">Département</option>
          <option value="service">Service</option>
        </select>
        <div v-if="errors.type" :class="cls.fieldError">{{ errors.type }}</div>
      </div>

      <div :class="cls.field">
        <label :class="cls.fieldLabel">Entité parente</label>
        <SearchableDropdown
          v-model="form.parentId"
          :items="entityItems"
          placeholder="Rechercher une entité..."
          :show-avatar="false"
        />
      </div>

      <div :class="cls.field">
        <label :class="cls.fieldLabel">Identifiant légal <span :class="hint">(optionnel)</span></label>
        <input v-model="form.legalIdentifier" :class="cls.fieldInput" placeholder="ex: GPL-001" />
      </div>

      <div :class="[cls.field, 'col-span-full']">
        <label :class="cls.fieldLabel">Adresse <span :class="hint">(optionnel)</span></label>
        <textarea
          v-model="form.address"
          :class="cls.fieldTextarea"
          rows="2"
          placeholder="Adresse physique de l'entité…"
        ></textarea>
      </div>
    </div>

    <!-- Section 2 : Contact & Responsable -->
    <div :class="sectionTitle">
      <User class="w-[15px] h-[15px] text-primary" />
      Contact & Responsable
    </div>

    <div :class="fieldGrid">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Responsable</label>
        <SearchableDropdown
          v-model="form.responsibleId"
          :items="employeeItems"
          placeholder="Rechercher un responsable..."
          :show-avatar="true"
        />
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Téléphone principal</label>
        <input v-model="form.phone" type="tel" :class="cls.fieldInput" placeholder="+230 2xx xxxx" />
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Courrier électronique</label>
        <input
          v-model="form.email"
          type="email"
          :class="[cls.fieldInput, errors.email && cls.inputError]"
          placeholder="service@galana.com"
        />
        <div v-if="errors.email" :class="cls.fieldError">{{ errors.email }}</div>
      </div>
    </div>

    <!-- Section 3 : Pools de validation -->
    <div :class="sectionTitle">
      <ShieldCheck class="w-[15px] h-[15px] text-primary" />
      Configuration des validateurs
    </div>
    <p class="text-xs text-muted-foreground -mt-2">
      Définissez qui approuve les demandes des employés de cette entité.
    </p>

    <div class="flex flex-col gap-2">
      <div
        v-for="level in ([1, 2, 3, 4] as const)" :key="level"
        class="flex items-center gap-2.5 px-3 py-2 bg-background rounded-lg border border-border"
      >
        <div class="shrink-0">
          <span class="text-[11px] font-bold px-2.5 py-[3px] rounded-full bg-primary/10 text-primary">N+{{ level }}</span>
        </div>
        <div class="flex-1 flex items-center gap-2">
          <template v-if="getPool(level)">
            <select
              :class="cls.fieldSelect"
              :value="getPool(level)!.employeeId ?? ''"
              @change="updatePoolEmployee(level, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">-- Choisir --</option>
              <optgroup label="Directeurs RH">
                <option
                  v-for="e in empStore.employees.filter(x => x.role === 'hr_director')"
                  :key="e.id" :value="e.id"
                >{{ e.name }} · {{ e.jobTitle }}</option>
              </optgroup>
              <optgroup label="Admins RH">
                <option
                  v-for="e in empStore.employees.filter(x => x.role === 'hr_admin')"
                  :key="e.id" :value="e.id"
                >{{ e.name }} · {{ e.jobTitle }}</option>
              </optgroup>
              <optgroup label="Validateurs">
                <option
                  v-for="e in empStore.employees.filter(x => x.role === 'validator')"
                  :key="e.id" :value="e.id"
                >{{ e.name }} · {{ e.jobTitle }}</option>
              </optgroup>
            </select>
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              :style="{ background: getPool(level)!.validatorColor }"
            >{{ getPool(level)!.validatorInitials }}</div>
            <button
              class="w-7 h-7 rounded-md cursor-pointer flex items-center justify-center bg-danger-bg text-danger shrink-0 transition-opacity hover:opacity-75"
              @click="removePool(level)" title="Supprimer"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </template>
          <template v-else>
            <div class="text-xs text-muted-foreground flex-1 italic">Non configuré</div>
            <button :class="[cls.btnOutline, '!px-2.5 !py-[5px] !text-xs']" @click="addPool(level)">
              <Plus class="w-3.5 h-3.5" /> Ajouter
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- ── Pied ── -->
    <template #footer>
      <button :class="cls.btnOutline" @click="handleDraft">
        <Save class="w-4 h-4" />
        {{ isEditMode ? 'Enregistrer' : 'Brouillon' }}
      </button>
      <button :class="cls.btnPrimary" @click="handleSubmit">
        <Send class="w-4 h-4" /> Enregistrer et soumettre
      </button>
    </template>

  </ModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Building, User, ShieldCheck, Trash2, Plus, Save, Send } from 'lucide-vue-next'
import ModalShell from '../ui/ModalShell.vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import type { DropdownItem } from '../ui/SearchableDropdown.vue'
import * as cls from '../../lib/formClasses'
import { useEntityStore }   from '../../stores/entities'
import { useEmployeeStore } from '../../stores/employees'
import type { EntityType, ValidatorPool } from '../../types'

const props = defineProps<{
  modelValue: boolean
  editId?:    string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'saved': []
}>()

// ── Classes du design system ─────────────────────────────────
const sectionTitle = 'flex items-center gap-2 text-[13px] font-semibold text-foreground pb-2.5 border-b border-border'
const fieldGrid = 'grid grid-cols-2 gap-3 max-sm:grid-cols-1'
const hint = 'font-normal text-muted-foreground text-[11px]'

const store    = useEntityStore()
const empStore = useEmployeeStore()

const isEditMode = computed(() => !!props.editId)
const editEntity = computed(() => props.editId ? store.getEntityById(props.editId) : undefined)

const POOL_COLORS = [
  'var(--color-success)',  'var(--color-primary)',
  'var(--color-warning)',  'var(--color-danger)',
  'var(--color-info)',
]
let colorIdx = 0
function nextColor(): string { return POOL_COLORS[colorIdx++ % POOL_COLORS.length] ?? 'var(--color-primary)' }

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length >= 2
    ? (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
    : (parts[0] ?? '?').slice(0, 2).toUpperCase()
}

const form = reactive({
  name:            '',
  code:            '',
  type:            '' as EntityType | '',
  parentId:        '',
  legalIdentifier: '',
  address:         '',
  responsibleId:   '',
  responsibleName: '',
  phone:           '',
  email:           '',
})
const errors     = reactive({ name: '', code: '', type: '', email: '' })
const localPools = ref<ValidatorPool[]>([])

// ── Items pour les SearchableDropdown ─────────────────────────
const employeeItems = computed<DropdownItem[]>(() =>
  empStore.employees.map(e => ({
    id:       e.id,
    label:    e.name,
    sublabel: e.entityName ?? '',
    initials: e.initials,
  }))
)

const TYPE_SUBLABELS: Record<string, string> = {
  direction: 'Direction', department: 'Département', service: 'Service',
}
const entityItems = computed<DropdownItem[]>(() =>
  store.entities
    .filter(e => e.id !== props.editId)
    .map(e => ({
      id:       e.id,
      label:    e.name,
      sublabel: TYPE_SUBLABELS[e.type] ?? e.type,
    }))
)

// Le nom du responsable suit la sélection du dropdown
watch(() => form.responsibleId, (id) => {
  if (!id) { form.responsibleName = ''; return }
  const emp = empStore.getById(id)
  if (emp) form.responsibleName = emp.name
})

function populate() {
  colorIdx = 0
  if (isEditMode.value && editEntity.value) {
    const e = editEntity.value
    form.name            = e.name
    form.code            = e.code
    form.type            = e.type
    form.parentId        = e.parentId ?? ''
    form.legalIdentifier = e.legalIdentifier ?? ''
    form.address         = e.address ?? ''
    form.responsibleId   = e.responsibleId ?? ''
    form.responsibleName = e.responsibleName ?? ''
    form.phone           = e.phone ?? ''
    form.email           = e.email ?? ''
    localPools.value     = [...e.validatorPools]
  } else {
    Object.assign(form, {
      name: '', code: '', type: '', parentId: '', legalIdentifier: '',
      address: '', responsibleId: '', responsibleName: '', phone: '', email: '',
    })
    localPools.value = []
  }
  Object.assign(errors, { name: '', code: '', type: '', email: '' })
}

watch(() => props.modelValue, v => { if (v) populate() })

// ── Pools ─────────────────────────────────────────────────────
function getPool(level: 1 | 2 | 3 | 4): ValidatorPool | undefined {
  return localPools.value.find(p => p.level === level)
}
function addPool(level: 1 | 2 | 3 | 4) {
  localPools.value.push({ level, validatorName: '', validatorInitials: '??', validatorColor: nextColor() })
}
function removePool(level: number) {
  localPools.value = localPools.value.filter(p => p.level !== level)
}
function updatePoolEmployee(level: number, employeeId: string) {
  const pool = localPools.value.find(p => p.level === level)
  if (!pool) return
  if (!employeeId) {
    pool.employeeId = undefined; pool.validatorName = ''; pool.validatorInitials = '??'
    return
  }
  const emp = empStore.getById(employeeId)
  if (emp) {
    pool.employeeId        = emp.id
    pool.validatorName     = emp.name
    pool.validatorInitials = emp.initials
    pool.validatorColor    = emp.avatarBg
  }
}
// ── Validation ────────────────────────────────────────────────
function validate(): boolean {
  errors.name = errors.code = errors.type = errors.email = ''
  let ok = true
  if (!form.name.trim()) { errors.name = "L'intitulé est obligatoire"; ok = false }
  if (!form.code.trim()) { errors.code = "Le code est obligatoire";    ok = false }
  if (!form.type)        { errors.type = "Veuillez choisir un type";   ok = false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Format email invalide"; ok = false
  }
  return ok
}

function buildPayload() {
  return {
    code: form.code, name: form.name, type: form.type as EntityType,
    parentId: form.parentId || null, legalIdentifier: form.legalIdentifier || undefined,
    address: form.address || undefined, phone: form.phone || undefined,
    email: form.email || undefined, responsibleId: form.responsibleId || undefined,
    responsibleName: form.responsibleName || undefined,
    headcount: editEntity.value?.headcount ?? 0,
    validatorPools: localPools.value.filter(p => p.validatorName.trim()),
  }
}

function close() { emit('update:modelValue', false) }

function handleDraft() {
  if (!validate()) return
  if (isEditMode.value && props.editId) {
    store.updateEntity(props.editId, buildPayload())
  } else {
    store.createEntity(buildPayload())
  }
  emit('saved')
  close()
}

function handleSubmit() {
  if (!validate()) return
  if (isEditMode.value && props.editId) {
    store.updateEntity(props.editId, buildPayload())
    store.submitEntity(props.editId)
  } else {
    store.createEntity(buildPayload())
    const newId = store.entities[store.entities.length - 1]!.id
    store.submitEntity(newId)
  }
  emit('saved')
  close()
}
</script>
