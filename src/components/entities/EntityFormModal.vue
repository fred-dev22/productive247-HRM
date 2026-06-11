<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-card">

        <!-- ── En-tête ── -->
        <div class="modal-header">
          <span class="modal-title-text">
            <i class="ti ti-building" aria-hidden="true"></i>
            {{ isEditMode ? 'Modifier l\'entité' : 'Nouvelle entité' }}
          </span>
          <button class="modal-close-btn" @click="close">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <div class="modal-body">

          <!-- Section 1 : Informations générales -->
          <div class="section-title">
            <i class="ti ti-building" aria-hidden="true"></i>
            Informations générales
          </div>

          <div class="field-grid">
            <div class="field field-full">
              <label class="field-label">Intitulé *</label>
              <input
                v-model="form.name"
                class="field-input"
                :class="{ 'input-error': errors.name }"
                placeholder="ex: Direction des Ressources Humaines"
              />
              <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
            </div>

            <div class="field">
              <label class="field-label">Code * <span class="hint">(max 10 car.)</span></label>
              <input
                v-model="form.code"
                class="field-input"
                :class="{ 'input-error': errors.code }"
                placeholder="ex: DRH"
                maxlength="10"
                @input="form.code = form.code.toUpperCase()"
              />
              <div v-if="errors.code" class="field-error">{{ errors.code }}</div>
            </div>

            <div class="field">
              <label class="field-label">Type *</label>
              <select v-model="form.type" class="field-input" :class="{ 'input-error': errors.type }">
                <option value="">-- Choisir un type --</option>
                <option value="direction">Direction</option>
                <option value="department">Département</option>
                <option value="service">Service</option>
              </select>
              <div v-if="errors.type" class="field-error">{{ errors.type }}</div>
            </div>

            <div class="field">
              <label class="field-label">Entité parente</label>
              <SearchableDropdown
                v-model="form.parentId"
                :items="entityItems"
                placeholder="Rechercher une entité..."
                :show-avatar="false"
              />
            </div>

            <div class="field">
              <label class="field-label">Identifiant légal <span class="hint">(optionnel)</span></label>
              <input v-model="form.legalIdentifier" class="field-input" placeholder="ex: GPL-001" />
            </div>

            <div class="field field-full">
              <label class="field-label">Adresse <span class="hint">(optionnel)</span></label>
              <textarea
                v-model="form.address"
                class="field-textarea"
                rows="2"
                placeholder="Adresse physique de l'entité…"
              ></textarea>
            </div>
          </div>

          <!-- Section 2 : Contact & Responsable -->
          <div class="section-title">
            <i class="ti ti-user" aria-hidden="true"></i>
            Contact & Responsable
          </div>

          <div class="field-grid">
            <div class="field">
              <label class="field-label">Responsable</label>
              <SearchableDropdown
                v-model="form.responsibleId"
                :items="employeeItems"
                placeholder="Rechercher un responsable..."
                :show-avatar="true"
              />
            </div>
            <div class="field">
              <label class="field-label">Téléphone principal</label>
              <input v-model="form.phone" type="tel" class="field-input" placeholder="+230 2xx xxxx" />
            </div>
            <div class="field">
              <label class="field-label">Courrier électronique</label>
              <input
                v-model="form.email"
                type="email"
                class="field-input"
                :class="{ 'input-error': errors.email }"
                placeholder="service@galana.com"
              />
              <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
            </div>
          </div>

          <!-- Section 3 : Pools de validation -->
          <div class="section-title">
            <i class="ti ti-shield-check" aria-hidden="true"></i>
            Configuration des validateurs
          </div>
          <p class="section-desc">
            Définissez qui approuve les demandes des employés de cette entité.
          </p>

          <div class="pools-grid">
            <div v-for="level in ([1, 2, 3, 4] as const)" :key="level" class="pool-row">
              <div class="pool-level">
                <span class="level-badge">N+{{ level }}</span>
              </div>
              <div class="pool-content">
                <template v-if="getPool(level)">
                  <select
                    class="field-input"
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
                    class="pool-avatar"
                    :style="{ background: getPool(level)!.validatorColor }"
                  >{{ getPool(level)!.validatorInitials }}</div>
                  <button class="btn-icon-danger" @click="removePool(level)" title="Supprimer">
                    <i class="ti ti-trash" aria-hidden="true"></i>
                  </button>
                </template>
                <template v-else>
                  <div class="pool-empty">Non configuré</div>
                  <button class="btn btn-outline btn-sm" @click="addPool(level)">
                    <i class="ti ti-plus" aria-hidden="true"></i> Ajouter
                  </button>
                </template>
              </div>
            </div>
          </div>

        </div>

        <!-- ── Pied ── -->
        <div class="modal-footer">
          <button class="btn btn-outline" @click="handleDraft">
            <i class="ti ti-device-floppy" aria-hidden="true"></i>
            {{ isEditMode ? 'Enregistrer' : 'Brouillon' }}
          </button>
          <button class="btn btn-primary" @click="handleSubmit">
            <i class="ti ti-send" aria-hidden="true"></i> Enregistrer et soumettre
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import type { DropdownItem } from '../ui/SearchableDropdown.vue'
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

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--color-surface); border-radius: 12px;
  max-width: 720px; width: 95%; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 0.5px solid var(--color-border); flex-shrink: 0;
}
.modal-title-text { font-size: 15px; font-weight: 600; color: var(--color-text); display: flex; align-items: center; gap: 8px; }
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
  font-size: 13px; font-weight: 600; color: var(--color-text);
  padding-bottom: 10px; border-bottom: 0.5px solid var(--color-border);
}
.section-title i { color: var(--color-primary); font-size: 15px; }
.section-desc { font-size: 12px; color: var(--color-text-muted); margin-top: -8px; }

.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-full { grid-column: 1 / -1; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text); }
.hint { font-weight: 400; color: var(--color-text-muted); font-size: 11px; }
.field-input {
  height: 34px; padding: 0 10px; border: 0.5px solid var(--color-border);
  border-radius: 6px; font-size: 13px; color: var(--color-text);
  background: var(--color-bg); outline: none; width: 100%; box-sizing: border-box;
  transition: border-color .12s;
}
.field-input:focus { border-color: var(--color-primary); }
.input-error { border-color: var(--color-danger) !important; }
.field-textarea {
  padding: 8px 10px; border: 0.5px solid var(--color-border); border-radius: 6px;
  font-size: 13px; color: var(--color-text); background: var(--color-bg);
  outline: none; resize: vertical; font-family: inherit; width: 100%; box-sizing: border-box;
}
.field-textarea:focus { border-color: var(--color-primary); }
.field-error { font-size: 11px; color: var(--color-danger); }

/* Pools */
.pools-grid { display: flex; flex-direction: column; gap: 8px; }
.pool-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: var(--color-bg);
  border-radius: 8px; border: 0.5px solid var(--color-border);
}
.pool-level { flex-shrink: 0; }
.level-badge {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px;
  background: var(--color-primary-light); color: var(--color-primary);
}
.pool-content { flex: 1; display: flex; align-items: center; gap: 8px; }
.pool-empty { font-size: 12px; color: var(--color-text-muted); flex: 1; font-style: italic; }
.pool-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; color: var(--color-surface); flex-shrink: 0;
}
.btn-icon-danger {
  width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-danger-bg); color: var(--color-danger);
  font-size: 14px; flex-shrink: 0; transition: opacity .1s;
}
.btn-icon-danger:hover { opacity: .75; }

/* Buttons */
.btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; white-space: nowrap; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-primary { background: var(--color-primary); color: var(--color-surface); }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

@media (max-width: 640px) {
  .modal-card { width: 97%; max-height: 95vh; }
  .field-grid { grid-template-columns: 1fr; }
}
</style>
