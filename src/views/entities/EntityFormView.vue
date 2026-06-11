<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- En-tête -->
        <div class="page-header">
          <div>
            <div class="page-title">{{ isEditMode ? 'Modifier l\'entité' : 'Nouvelle entité' }}</div>
            <div class="page-sub" v-if="isEditMode">{{ editEntity?.name }}</div>
          </div>
          <router-link :to="{ name: 'hr-entities' }" class="btn btn-outline">
            <i class="ti ti-arrow-left"></i> Annuler
          </router-link>
        </div>

        <div class="form-wrapper">
          <div class="form-card card">

            <!-- ── Section 1 : Informations générales ── -->
            <div class="form-section">
              <div class="section-title">
                <i class="ti ti-building"></i> Informations générales
              </div>
              <div class="field-grid">
                <div class="field field-full">
                  <label class="field-label">Intitulé *</label>
                  <input v-model="form.name" class="field-input" :class="{ 'input-error': errors.name }" placeholder="ex: Direction des Ressources Humaines" />
                  <div v-if="errors.name" class="error-msg">{{ errors.name }}</div>
                </div>

                <div class="field">
                  <label class="field-label">Code * <span class="hint">(max 10 car.)</span></label>
                  <input v-model="form.code" class="field-input" :class="{ 'input-error': errors.code }" placeholder="ex: DRH" maxlength="10" @input="form.code = form.code.toUpperCase()" />
                  <div v-if="errors.code" class="error-msg">{{ errors.code }}</div>
                </div>

                <div class="field">
                  <label class="field-label">Type *</label>
                  <select v-model="form.type" class="field-input" :class="{ 'input-error': errors.type }">
                    <option value="">-- Choisir un type --</option>
                    <option value="direction">Direction</option>
                    <option value="department">Département</option>
                    <option value="service">Service</option>
                  </select>
                  <div v-if="errors.type" class="error-msg">{{ errors.type }}</div>
                </div>

                <div class="field">
                  <label class="field-label">Entité parente</label>
                  <select v-model="form.parentId" class="field-input">
                    <option value="">Aucune (entité racine)</option>
                    <option
                      v-for="e in parentOptions"
                      :key="e.id"
                      :value="e.id"
                    >{{ e.code }} — {{ e.name }}</option>
                  </select>
                </div>

                <div class="field">
                  <label class="field-label">Identifiant légal <span class="hint">(optionnel)</span></label>
                  <input v-model="form.legalIdentifier" class="field-input" placeholder="ex: GPL-001" />
                </div>

                <div class="field field-full">
                  <label class="field-label">Adresse <span class="hint">(optionnel)</span></label>
                  <textarea v-model="form.address" class="field-textarea" rows="2" placeholder="Adresse physique de l'entité…"></textarea>
                </div>
              </div>
            </div>

            <!-- ── Section 2 : Contact & Responsable ── -->
            <div class="form-section">
              <div class="section-title">
                <i class="ti ti-user"></i> Contact & Responsable
              </div>
              <div class="field-grid">
                <div class="field">
                  <label class="field-label">Responsable</label>
                  <select v-model="form.responsibleId" class="field-input" @change="onResponsibleChange">
                    <option value="">-- Aucun --</option>
                    <option v-for="e in empStore.employees" :key="e.id" :value="e.id">
                      {{ e.code }} — {{ e.name }} · {{ e.jobTitle }}
                    </option>
                  </select>
                </div>
                <div class="field">
                  <label class="field-label">Téléphone principal</label>
                  <input v-model="form.phone" type="tel" class="field-input" placeholder="+230 2xx xxxx" />
                </div>
                <div class="field">
                  <label class="field-label">Courrier électronique</label>
                  <input v-model="form.email" type="email" class="field-input" :class="{ 'input-error': errors.email }" placeholder="service@galana.com" />
                  <div v-if="errors.email" class="error-msg">{{ errors.email }}</div>
                </div>
              </div>
            </div>

            <!-- ── Section 3 : Pools de validation ── -->
            <div class="form-section">
              <div class="section-title">
                <i class="ti ti-shield-check"></i> Configuration des validateurs
              </div>
              <p class="section-desc">
                Définissez qui approuve les demandes des employés de cette entité.
                Les niveaux non configurés seront ignorés dans le circuit de validation.
              </p>

              <div class="pools-grid">
                <div
                  v-for="level in ([1, 2, 3, 4] as const)"
                  :key="level"
                  class="pool-row"
                >
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
                        <option value="">-- Choisir un employé --</option>
                        <optgroup label="Directeurs RH">
                          <option v-for="e in empStore.employees.filter(x => x.role === 'hr_director')" :key="e.id" :value="e.id">
                            {{ e.name }} · {{ e.jobTitle }}
                          </option>
                        </optgroup>
                        <optgroup label="Admins RH">
                          <option v-for="e in empStore.employees.filter(x => x.role === 'hr_admin')" :key="e.id" :value="e.id">
                            {{ e.name }} · {{ e.jobTitle }}
                          </option>
                        </optgroup>
                        <optgroup label="Managers / Validateurs">
                          <option v-for="e in empStore.employees.filter(x => x.role === 'validator')" :key="e.id" :value="e.id">
                            {{ e.name }} · {{ e.jobTitle }}
                          </option>
                        </optgroup>
                      </select>
                      <div class="pool-avatar" :style="{ background: getPool(level)!.validatorColor, color: 'white' }">
                        {{ getPool(level)!.validatorInitials }}
                      </div>
                      <button class="btn-icon-danger" @click="removePool(level)" title="Supprimer ce validateur">
                        <i class="ti ti-trash"></i>
                      </button>
                    </template>
                    <template v-else>
                      <div class="pool-empty">Non configuré</div>
                      <button class="btn btn-outline btn-sm" @click="addPool(level)">
                        <i class="ti ti-plus"></i> Ajouter
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Boutons ── -->
            <div class="form-actions">
              <button class="btn btn-outline" @click="handleDraft">
                <i class="ti ti-device-floppy"></i>
                {{ isEditMode ? 'Enregistrer les modifications' : 'Enregistrer en brouillon' }}
              </button>
              <button class="btn btn-primary" @click="handleSubmit">
                <i class="ti ti-send"></i> Enregistrer et soumettre
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { AppSidebar, AppTopNav } from '../../components'
import { useAuthStore }     from '../../stores/auth'
import { useEntityStore }   from '../../stores/entities'
import { useEmployeeStore } from '../../stores/employees'
import { getInitials } from '../../utils/helpers'
import type { EntityType, ValidatorPool } from '../../types'

const auth        = useAuthStore()
const store       = useEntityStore()
const empStore    = useEmployeeStore()
const router      = useRouter()
const route       = useRoute()

const entityId   = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!entityId.value)
const editEntity = computed(() => entityId.value ? store.getEntityById(entityId.value) : undefined)

// ── Palette de couleurs pour les validateurs ──────────────────
const COLORS = ['var(--galana-green)', 'var(--galana-green-dark)', '#854F0B', '#993556', '#7C3AED', '#0F766E', '#BE185D']
let colorIdx = 0
function nextColor(): string { return COLORS[colorIdx++ % COLORS.length] ?? 'var(--galana-green)' }

// ── Formulaire ────────────────────────────────────────────────
const form = reactive({
  name:            '',
  code:            '',
  type:            '' as EntityType | '',
  parentId:        '' as string | null,
  legalIdentifier: '',
  address:         '',
  responsibleId:   '' as string | undefined,
  responsibleName: '',
  phone:           '',
  email:           '',
})
const errors = reactive({ name: '', code: '', type: '', email: '' })

// Pools locaux (tableau réactif)
const localPools = ref<ValidatorPool[]>([])

// Options entité parente
const parentOptions = computed(() =>
  store.entities.filter(e => e.status === 'approved' && e.id !== entityId.value)
)

// Pré-remplissage en mode édition
onMounted(() => {
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
  }
})

// Auto-uppercase code
watch(() => form.code, v => { form.code = v.toUpperCase() })

// ── Gestion pools ─────────────────────────────────────────────
function getPool(level: 1 | 2 | 3 | 4): ValidatorPool | undefined {
  return localPools.value.find(p => p.level === level)
}
function addPool(level: 1 | 2 | 3 | 4) {
  localPools.value.push({
    level,
    validatorName:     '',
    validatorInitials: '??',
    validatorColor:    nextColor(),
  })
}
function removePool(level: number) {
  localPools.value = localPools.value.filter(p => p.level !== level)
}
function updatePoolName(level: number, name: string) {
  const pool = localPools.value.find(p => p.level === level)
  if (pool) {
    pool.validatorName     = name
    pool.validatorInitials = getInitials(name)
  }
}

function updatePoolEmployee(level: number, employeeId: string) {
  const pool = localPools.value.find(p => p.level === level)
  if (!pool) return
  if (!employeeId) { pool.employeeId = undefined; pool.validatorName = ''; pool.validatorInitials = '??'; return }
  const emp = empStore.getById(employeeId)
  if (emp) {
    pool.employeeId        = emp.id
    pool.validatorName     = emp.name
    pool.validatorInitials = emp.initials
    pool.validatorColor    = emp.avatarBg
  }
}

function onResponsibleChange() {
  const emp = empStore.getById(form.responsibleId ?? '')
  form.responsibleName = emp?.name ?? ''
}

// ── Validation ────────────────────────────────────────────────
function validate(): boolean {
  errors.name = errors.code = errors.type = errors.email = ''
  let ok = true
  if (!form.name.trim())  { errors.name = "L'intitulé est obligatoire"; ok = false }
  if (!form.code.trim())  { errors.code = "Le code est obligatoire";    ok = false }
  if (!form.type)         { errors.type = "Veuillez choisir un type";   ok = false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Format email invalide"; ok = false
  }
  return ok
}

function buildPayload() {
  return {
    code:            form.code,
    name:            form.name,
    type:            form.type as EntityType,
    parentId:        form.parentId || null,
    legalIdentifier: form.legalIdentifier || undefined,
    address:         form.address || undefined,
    phone:           form.phone || undefined,
    email:           form.email || undefined,
    responsibleId:   form.responsibleId   || undefined,
    responsibleName: form.responsibleName || undefined,
    headcount:       editEntity.value?.headcount ?? 0,
    validatorPools:  localPools.value.filter(p => p.validatorName.trim()),
  }
}

async function handleDraft() {
  if (!validate()) return
  if (isEditMode.value && entityId.value) {
    store.updateEntity(entityId.value, buildPayload())
  } else {
    store.createEntity(buildPayload())
  }
  router.push({ name: 'hr-entities' })
}

async function handleSubmit() {
  if (!validate()) return
  if (isEditMode.value && entityId.value) {
    store.updateEntity(entityId.value, buildPayload())
    store.submitEntity(entityId.value)
  } else {
    store.createEntity(buildPayload())
    const newId = store.entities[store.entities.length - 1]!.id
    store.submitEntity(newId)
  }
  router.push({ name: 'hr-entities' })
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--p247-bg); }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title  { font-size: 18px; font-weight: 600; }
.page-sub    { font-size: 13px; color: var(--p247-muted); margin-top: 1px; }

.btn     { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-sm  { padding: 5px 12px; font-size: 12px; }
.btn-primary { background: var(--p247-orange); color: white; }
.btn-primary:hover { background: var(--p247-orange-dark); }
.btn-outline { background: var(--p247-white); color: var(--p247-text); border: 0.5px solid var(--p247-border); }
.btn-outline:hover { background: var(--p247-bg); }

.form-wrapper { display: flex; justify-content: center; }
.form-card    { width: 100%; max-width: 800px; }
.card { background: var(--p247-white); border: 0.5px solid var(--p247-border); border-radius: 8px; padding: 24px; display: flex; flex-direction: column; gap: 24px; }

.form-section { display: flex; flex-direction: column; gap: 14px; }
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: var(--p247-text);
  padding-bottom: 10px; border-bottom: 0.5px solid var(--p247-border);
}
.section-title i { color: var(--p247-orange); font-size: 16px; }
.section-desc { font-size: 12px; color: var(--p247-muted); margin-top: -8px; }

.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-full { grid-column: 1 / -1; }
.field-label { font-size: 12px; font-weight: 500; color: var(--p247-text); }
.hint { font-weight: 400; color: var(--p247-muted); }
.field-input {
  height: 34px; padding: 0 10px; border: 0.5px solid var(--p247-border);
  border-radius: 6px; font-size: 13px; color: var(--p247-text);
  background: var(--p247-white); outline: none; transition: border-color .12s;
}
.field-input:focus { border-color: var(--p247-orange); }
.input-error { border-color: var(--p247-danger) !important; }
.field-textarea {
  padding: 8px 10px; border: 0.5px solid var(--p247-border);
  border-radius: 6px; font-size: 13px; color: var(--p247-text);
  background: var(--p247-white); outline: none; resize: vertical;
  font-family: inherit; transition: border-color .12s;
}
.field-textarea:focus { border-color: var(--p247-orange); }
.error-msg { font-size: 11px; color: var(--p247-danger); }

/* ── Validator pools ── */
.pools-grid { display: flex; flex-direction: column; gap: 10px; }
.pool-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; background: var(--p247-bg);
  border-radius: 8px; border: 0.5px solid var(--p247-border);
}
.pool-level { flex-shrink: 0; }
.level-badge {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 12px; background: var(--p247-orange-light); color: var(--p247-orange);
  border: 1px solid rgba(200, 16, 46, 0.2);
}
.pool-content { flex: 1; display: flex; align-items: center; gap: 8px; }
.pool-empty { font-size: 12px; color: var(--p247-muted); flex: 1; font-style: italic; }
.pool-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; flex-shrink: 0;
}
.btn-icon-danger {
  width: 28px; height: 28px; border-radius: 6px; border: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  background: var(--p247-danger-bg); color: var(--p247-danger); font-size: 14px;
  flex-shrink: 0; transition: background .1s;
}
.btn-icon-danger:hover { background: var(--color-danger-bg); }

.form-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 8px; border-top: 0.5px solid var(--p247-border); }

@media (max-width: 640px) {
  .field-grid { grid-template-columns: 1fr; }
  .content { padding: 16px; }
}
</style>
