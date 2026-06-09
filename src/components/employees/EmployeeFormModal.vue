<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-card">

        <!-- ── En-tête ── -->
        <div class="modal-header">
          <span class="modal-title-text">
            <i class="ti ti-user-plus" aria-hidden="true"></i>
            {{ isEditMode ? 'Modifier l\'employé' : 'Nouvel employé' }}
          </span>
          <button class="modal-close-btn" @click="close">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <div class="modal-body">

          <!-- Section : Identité -->
          <div class="section-title">
            <i class="ti ti-user" aria-hidden="true"></i>
            Identité
          </div>

          <div class="field-grid">
            <div class="field">
              <label class="field-label">Prénom *</label>
              <input
                v-model="form.firstName"
                class="field-input"
                :class="{ 'input-error': errors.firstName }"
                placeholder="ex: Aminata"
              />
              <div v-if="errors.firstName" class="field-error">{{ errors.firstName }}</div>
            </div>
            <div class="field">
              <label class="field-label">Nom *</label>
              <input
                v-model="form.lastName"
                class="field-input"
                :class="{ 'input-error': errors.lastName }"
                placeholder="ex: Diallo"
              />
              <div v-if="errors.lastName" class="field-error">{{ errors.lastName }}</div>
            </div>
            <div class="field field-full">
              <label class="field-label">Poste / Intitulé du poste *</label>
              <input
                v-model="form.jobTitle"
                class="field-input"
                :class="{ 'input-error': errors.jobTitle }"
                placeholder="ex: Assistante RH"
              />
              <div v-if="errors.jobTitle" class="field-error">{{ errors.jobTitle }}</div>
            </div>
            <div class="field">
              <label class="field-label">Email professionnel</label>
              <input
                v-model="form.email"
                type="email"
                class="field-input"
                :class="{ 'input-error': errors.email }"
                placeholder="prenom.nom@galana.com"
              />
              <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
            </div>
            <div class="field">
              <label class="field-label">Téléphone</label>
              <input v-model="form.phone" type="tel" class="field-input" placeholder="+230 5xx xxxx" />
            </div>
          </div>

          <!-- Section : Affectation -->
          <div class="section-title">
            <i class="ti ti-building" aria-hidden="true"></i>
            Affectation
          </div>

          <div class="field-grid">
            <div class="field">
              <label class="field-label">Entité *</label>
              <select v-model="form.entityId" class="field-input" :class="{ 'input-error': errors.entityId }" @change="onEntityChange">
                <option value="">-- Choisir une entité --</option>
                <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.id">
                  {{ e.code }} — {{ e.name }}
                </option>
              </select>
              <div v-if="errors.entityId" class="field-error">{{ errors.entityId }}</div>
            </div>
            <div class="field">
              <label class="field-label">Rôle *</label>
              <select v-model="form.role" class="field-input" :class="{ 'input-error': errors.role }">
                <option value="">-- Choisir un rôle --</option>
                <option value="employee">Employé</option>
                <option value="validator">Validateur / Manager</option>
                <option value="hr_admin">Administrateur RH</option>
                <option value="hr_director">Directeur RH</option>
              </select>
              <div v-if="errors.role" class="field-error">{{ errors.role }}</div>
            </div>
            <div class="field">
              <label class="field-label">Manager direct</label>
              <select v-model="form.managerId" class="field-input">
                <option value="">-- Aucun --</option>
                <option v-for="e in managerOptions" :key="e.id" :value="e.id">
                  {{ e.name }} · {{ e.jobTitle }}
                </option>
              </select>
            </div>
          </div>

          <!-- Section : Contrat -->
          <div class="section-title">
            <i class="ti ti-file-text" aria-hidden="true"></i>
            Contrat
          </div>

          <div class="field-grid">
            <div class="field">
              <label class="field-label">Type de contrat *</label>
              <select v-model="form.contractType" class="field-input" :class="{ 'input-error': errors.contractType }">
                <option value="">-- Choisir --</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
              </select>
              <div v-if="errors.contractType" class="field-error">{{ errors.contractType }}</div>
            </div>
            <div class="field">
              <label class="field-label">Date d'embauche *</label>
              <input
                v-model="form.hireDate"
                type="date"
                class="field-input"
                :class="{ 'input-error': errors.hireDate }"
              />
              <div v-if="errors.hireDate" class="field-error">{{ errors.hireDate }}</div>
            </div>
            <div class="field">
              <label class="field-label">Statut</label>
              <select v-model="form.status" class="field-input">
                <option value="active">Actif</option>
                <option value="trial">Période d'essai</option>
                <option value="onleave">En congé</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

        </div>

        <!-- ── Pied ── -->
        <div class="modal-footer">
          <button class="btn btn-outline" @click="close">Annuler</button>
          <button class="btn btn-primary" @click="handleSave">
            <i class="ti ti-check" aria-hidden="true"></i>
            {{ isEditMode ? 'Enregistrer' : 'Créer l\'employé' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
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

const managerOptions = computed(() =>
  store.employees.filter(e =>
    ['validator', 'hr_admin', 'hr_director'].includes(e.role) &&
    e.id !== props.editId
  )
)

function onEntityChange() {
  const e = entityStore.approvedEntities.find(e => e.id === form.entityId)
  form.entityName = e?.name ?? ''
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
    managerId:    form.managerId || undefined,
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

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--color-surface); border-radius: 12px;
  max-width: 680px; width: 95%; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 0.5px solid var(--color-border); flex-shrink: 0;
}
.modal-title-text {
  font-size: 15px; font-weight: 600; color: var(--color-text);
  display: flex; align-items: center; gap: 8px;
}
.modal-title-text i { color: var(--color-primary); }
.modal-close-btn {
  width: 28px; height: 28px; border: none; background: var(--color-bg);
  border-radius: 6px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: var(--color-text-muted); font-size: 14px;
}
.modal-close-btn:hover { background: var(--color-border); }
.modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 24px; border-top: 0.5px solid var(--color-border); flex-shrink: 0;
}

.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .06em;
  padding-bottom: 8px; border-bottom: 0.5px solid var(--color-border);
}
.section-title i { color: var(--color-primary); font-size: 14px; }

.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-full { grid-column: 1 / -1; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-input {
  height: 36px; padding: 0 10px; border: 0.5px solid var(--color-border);
  border-radius: 6px; font-size: 13px; color: var(--color-text);
  background: var(--color-bg); outline: none; width: 100%; box-sizing: border-box;
  transition: border-color .12s;
}
.field-input:focus { border-color: var(--color-primary); }
.input-error { border-color: var(--color-danger) !important; }
.field-error { font-size: 11px; color: var(--color-danger); }

.btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; white-space: nowrap; }
.btn-primary { background: var(--color-primary); color: var(--color-surface); }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

@media (max-width: 580px) {
  .modal-card { width: 97%; max-height: 95vh; }
  .field-grid { grid-template-columns: 1fr; }
}
</style>
