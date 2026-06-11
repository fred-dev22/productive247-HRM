<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <!-- En-tête -->
        <div :class="L.pageHeader">
          <div>
            <div :class="L.pageTitle">{{ isEditMode ? 'Modifier l\'entité' : 'Nouvelle entité' }}</div>
            <div :class="L.pageSub" v-if="isEditMode">{{ editEntity?.name }}</div>
          </div>
          <router-link :to="{ name: 'hr-entities' }" :class="L.btnOutline">
            <ArrowLeft class="w-4 h-4" /> Annuler
          </router-link>
        </div>

        <div class="flex justify-center">
          <div class="w-full max-w-[800px] bg-card border border-border rounded-lg p-6 flex flex-col gap-6">

            <!-- ── Section 1 : Informations générales ── -->
            <div class="flex flex-col gap-3.5">
              <div :class="sectionTitle"><Building class="w-4 h-4 text-primary" /> Informations générales</div>
              <div :class="fieldGrid">
                <div :class="[cls.field, 'col-span-full']">
                  <label :class="cls.fieldLabel">Intitulé *</label>
                  <input v-model="form.name" :class="[cls.fieldInput, errors.name && cls.inputError]" placeholder="ex: Direction des Ressources Humaines" />
                  <div v-if="errors.name" :class="cls.fieldError">{{ errors.name }}</div>
                </div>

                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Code * <span :class="hint">(max 10 car.)</span></label>
                  <input v-model="form.code" :class="[cls.fieldInput, errors.code && cls.inputError]" placeholder="ex: DRH" maxlength="10" @input="form.code = form.code.toUpperCase()" />
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
                  <select v-model="form.parentId" :class="cls.fieldSelect">
                    <option value="">Aucune (entité racine)</option>
                    <option v-for="e in parentOptions" :key="e.id" :value="e.id">{{ e.code }} — {{ e.name }}</option>
                  </select>
                </div>

                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Identifiant légal <span :class="hint">(optionnel)</span></label>
                  <input v-model="form.legalIdentifier" :class="cls.fieldInput" placeholder="ex: GPL-001" />
                </div>

                <div :class="[cls.field, 'col-span-full']">
                  <label :class="cls.fieldLabel">Adresse <span :class="hint">(optionnel)</span></label>
                  <textarea v-model="form.address" :class="cls.fieldTextarea" rows="2" placeholder="Adresse physique de l'entité…"></textarea>
                </div>
              </div>
            </div>

            <!-- ── Section 2 : Contact & Responsable ── -->
            <div class="flex flex-col gap-3.5">
              <div :class="sectionTitle"><User class="w-4 h-4 text-primary" /> Contact & Responsable</div>
              <div :class="fieldGrid">
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Responsable</label>
                  <select v-model="form.responsibleId" :class="cls.fieldSelect" @change="onResponsibleChange">
                    <option value="">-- Aucun --</option>
                    <option v-for="e in empStore.employees" :key="e.id" :value="e.id">
                      {{ e.code }} — {{ e.name }} · {{ e.jobTitle }}
                    </option>
                  </select>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Téléphone principal</label>
                  <input v-model="form.phone" type="tel" :class="cls.fieldInput" placeholder="+230 2xx xxxx" />
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Courrier électronique</label>
                  <input v-model="form.email" type="email" :class="[cls.fieldInput, errors.email && cls.inputError]" placeholder="service@galana.com" />
                  <div v-if="errors.email" :class="cls.fieldError">{{ errors.email }}</div>
                </div>
              </div>
            </div>

            <!-- ── Section 3 : Pools de validation ── -->
            <div class="flex flex-col gap-3.5">
              <div :class="sectionTitle"><ShieldCheck class="w-4 h-4 text-primary" /> Configuration des validateurs</div>
              <p class="text-xs text-muted-foreground -mt-2">
                Définissez qui approuve les demandes des employés de cette entité.
                Les niveaux non configurés seront ignorés dans le circuit de validation.
              </p>

              <div class="flex flex-col gap-2.5">
                <div v-for="level in ([1, 2, 3, 4] as const)" :key="level" class="flex items-center gap-3 px-3 py-2.5 bg-background rounded-lg border border-border">
                  <div class="shrink-0">
                    <span class="text-[11px] font-bold px-2.5 py-[3px] rounded-full bg-primary/10 text-primary border border-primary/20">N+{{ level }}</span>
                  </div>
                  <div class="flex-1 flex items-center gap-2">
                    <template v-if="getPool(level)">
                      <select
                        :class="cls.fieldSelect"
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
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" :style="{ background: getPool(level)!.validatorColor }">
                        {{ getPool(level)!.validatorInitials }}
                      </div>
                      <button class="w-7 h-7 rounded-md cursor-pointer flex items-center justify-center bg-danger-bg text-danger shrink-0 transition-opacity hover:opacity-75" @click="removePool(level)" title="Supprimer ce validateur">
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
            </div>

            <!-- ── Boutons ── -->
            <div class="flex gap-2 justify-end pt-2 border-t border-border">
              <button :class="cls.btnOutline" @click="handleDraft">
                <Save class="w-4 h-4" />
                {{ isEditMode ? 'Enregistrer les modifications' : 'Enregistrer en brouillon' }}
              </button>
              <button :class="cls.btnPrimary" @click="handleSubmit">
                <Send class="w-4 h-4" /> Enregistrer et soumettre
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
import { ArrowLeft, Building, User, ShieldCheck, Trash2, Plus, Save, Send } from 'lucide-vue-next'
import { AppSidebar, AppTopNav } from '../../components'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useAuthStore }     from '../../stores/auth'
import { useEntityStore }   from '../../stores/entities'
import { useEmployeeStore } from '../../stores/employees'
import type { EntityType, ValidatorPool } from '../../types'

const auth        = useAuthStore()
const store       = useEntityStore()
const empStore    = useEmployeeStore()
const router      = useRouter()
const route       = useRoute()

// ── Classes du design system ─────────────────────────────────
const sectionTitle = 'flex items-center gap-2 text-sm font-semibold text-foreground pb-2.5 border-b border-border'
const fieldGrid = 'grid grid-cols-2 gap-3.5 max-sm:grid-cols-1'
const hint = 'font-normal text-muted-foreground'

const entityId   = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!entityId.value)
const editEntity = computed(() => entityId.value ? store.getEntityById(entityId.value) : undefined)

// ── Palette de couleurs pour les validateurs ──────────────────
const COLORS = ['var(--galana-green)', 'var(--galana-green-dark)', '#854F0B', '#993556', '#7C3AED', '#0F766E', '#BE185D']
let colorIdx = 0
function nextColor(): string { return COLORS[colorIdx++ % COLORS.length] ?? 'var(--galana-green)' }

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
  return (parts[0] ?? '?').slice(0, 2).toUpperCase()
}

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
