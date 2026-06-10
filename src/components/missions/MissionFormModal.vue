<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-card">

        <!-- ── En-tête ── -->
        <div class="modal-header">
          <span class="modal-title-text">
            {{ editId ? 'Modifier la mission' : 'Nouvelle mission' }}
          </span>
          <button class="modal-close-btn" @click="close">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <div class="modal-body">

          <!-- Section : Informations générales -->
          <div class="section-title">Informations générales</div>

          <!-- Sélecteur de bénéficiaire -->
          <ForWhomSelector
            v-model="forWhom"
            :available-employees="employeeItems"
            :error-employee="errors.employee"
          />

          <!-- Badge employé avec catégorie -->
          <div v-if="selectedEmployee" class="emp-badge">
            <UserAvatar :name="selectedEmployee.name" size="sm" />
            <div class="emp-badge-info">
              <div class="emp-badge-name">{{ selectedEmployee.name }}</div>
              <div class="emp-badge-cat">
                <i class="ti ti-tag" aria-hidden="true"></i>
                {{ perdiemCategoryLabel }}
              </div>
            </div>
          </div>

          <!-- Destination -->
          <div class="field">
            <label class="field-label">Destination *</label>
            <input
              v-model="form.destination"
              class="field-input"
              :class="{ 'input-error': errors.destination }"
              placeholder="ex: Antananarivo, Toamasina..."
            />
            <div v-if="errors.destination" class="field-error">{{ errors.destination }}</div>
          </div>

          <!-- Objet / Motif -->
          <div class="field">
            <label class="field-label">Objet / Motif de la mission *</label>
            <textarea
              v-model="form.purpose"
              class="field-textarea"
              rows="2"
              :class="{ 'input-error': errors.purpose }"
              placeholder="Décrivez l'objet de la mission..."
            ></textarea>
            <div v-if="errors.purpose" class="field-error">{{ errors.purpose }}</div>
          </div>

          <!-- Section : Déplacement -->
          <div class="section-title">Déplacement</div>

          <div class="field-row">
            <div class="field">
              <label class="field-label">Date et heure de départ *</label>
              <input
                type="datetime-local"
                v-model="form.departureDate"
                class="field-input"
                :class="{ 'input-error': errors.departureDate }"
              />
              <div v-if="errors.departureDate" class="field-error">{{ errors.departureDate }}</div>
            </div>
            <div class="field">
              <label class="field-label">Date et heure de retour *</label>
              <input
                type="datetime-local"
                v-model="form.returnDate"
                class="field-input"
                :class="{ 'input-error': errors.returnDate }"
                :min="form.departureDate"
              />
              <div v-if="errors.returnDate" class="field-error">{{ errors.returnDate }}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label class="field-label">Transport aller</label>
              <SearchableDropdown
                :items="transportItems"
                :model-value="form.transportMode"
                :show-avatar="false"
                @update:model-value="form.transportMode = $event as TransportMode"
              />
            </div>
            <div class="field">
              <label class="field-label">Transport retour</label>
              <SearchableDropdown
                :items="transportItems"
                :model-value="form.transportModeReturn"
                :show-avatar="false"
                @update:model-value="form.transportModeReturn = $event as TransportMode"
              />
            </div>
          </div>

          <!-- Section : Indemnité per diem -->
          <div class="section-title">Indemnité per diem</div>

          <div v-if="selectedEmployee && form.departureDate && form.returnDate && perdiemRate" class="perdiem-card">
            <div class="pd-row">
              <span class="pd-label">Catégorie</span>
              <span class="pd-val">{{ perdiemCategoryLabel }}</span>
            </div>
            <div class="pd-row">
              <span class="pd-label">Taux journalier</span>
              <span class="pd-val">{{ fmt(perdiemRate.ratePerDay) }} {{ perdiemRate.currency }}</span>
            </div>
            <div class="pd-row">
              <span class="pd-label">Nombre de jours</span>
              <span class="pd-val">{{ computedDays }} jour(s)</span>
            </div>
            <div class="pd-divider"></div>
            <div class="pd-row pd-total">
              <span class="pd-label">Total per diem</span>
              <span class="pd-val">{{ fmt(perdiemTotal) }} {{ perdiemRate.currency }}</span>
            </div>
          </div>
          <div v-else class="allowance-empty">
            <i class="ti ti-calculator" aria-hidden="true"></i>
            {{
              !selectedEmployee
                ? 'Sélectionnez un employé et des dates pour calculer le per diem'
                : 'Sélectionnez des dates pour calculer le per diem'
            }}
          </div>

          <!-- Section : Frais supplémentaires -->
          <div class="section-title">
            Frais supplémentaires
            <span class="section-opt">(optionnel)</span>
          </div>

          <div v-if="expenseLines.length > 0" class="expense-table">
            <div class="expense-header">
              <span>Catégorie</span>
              <span>Description</span>
              <span>Montant</span>
              <span></span>
            </div>
            <div v-for="(line, i) in expenseLines" :key="i" class="expense-row">
              <select v-model="line.category" class="field-input field-input-sm">
                <option v-for="cat in EXPENSE_CATS" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
              <input
                v-model="line.description"
                class="field-input field-input-sm"
                placeholder="Description..."
              />
              <input
                v-model.number="line.amount"
                type="number"
                class="field-input field-input-sm"
                min="0"
                placeholder="0"
              />
              <button class="remove-line-btn" @click="removeLine(i)" title="Supprimer">
                <i class="ti ti-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <button class="add-line-btn" @click="addLine">
            <i class="ti ti-plus" aria-hidden="true"></i> Ajouter un frais
          </button>

          <!-- Section : Récapitulatif -->
          <template v-if="perdiemRate || expenseLines.length > 0">
            <div class="section-title">Récapitulatif</div>
            <div class="recap-card">
              <div v-if="perdiemRate" class="recap-row">
                <span>Per diem ({{ computedDays }}j × {{ fmt(perdiemRate.ratePerDay) }})</span>
                <span>{{ fmt(perdiemTotal) }} {{ perdiemRate.currency }}</span>
              </div>
              <div v-if="expenseLines.length > 0" class="recap-row">
                <span>Frais supplémentaires</span>
                <span>{{ fmt(expenseTotal) }} {{ perdiemRate?.currency ?? 'MGA' }}</span>
              </div>
              <div class="recap-divider"></div>
              <div class="recap-row recap-total">
                <span>TOTAL MISSION</span>
                <span>{{ fmt(grandTotal) }} {{ perdiemRate?.currency ?? 'MGA' }}</span>
              </div>
              <div class="field" style="margin-top:12px">
                <label class="field-label">Acompte demandé (optionnel)</label>
                <input
                  type="number"
                  v-model.number="form.advance"
                  class="field-input"
                  :max="grandTotal"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </template>

          <!-- Section : Notes -->
          <div class="section-title">Notes</div>
          <div class="field">
            <label class="field-label">Description (optionnelle)</label>
            <textarea
              v-model="form.description"
              class="field-textarea"
              rows="2"
              placeholder="Informations complémentaires..."
            ></textarea>
          </div>

        </div>

        <!-- ── Pied ── -->
        <div class="modal-footer">
          <button class="btn btn-outline" @click="handleDraft">
            <i class="ti ti-device-floppy" aria-hidden="true"></i> Brouillon
          </button>
          <button class="btn btn-primary" @click="handleSubmit">
            <i class="ti ti-send" aria-hidden="true"></i> Soumettre
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import UserAvatar         from '../ui/UserAvatar.vue'
import { useMissionStore }  from '../../stores/missions'
import { useEmployeeStore } from '../../stores/employees'
import { useAuthStore }     from '../../stores/auth'
import { useCalendarStore } from '../../stores/calendar'
import type { EmployeeCategory, TransportMode } from '../../types'

const props = withDefaults(defineProps<{
  modelValue: boolean
  mode?:      'self' | 'for-employee'
  editId?:    string
}>(), { mode: 'self' })

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'submitted': []
  'drafted':   []
}>()

const missionStore  = useMissionStore()
const employeeStore = useEmployeeStore()
const auth          = useAuthStore()
const calendarStore = useCalendarStore()

const TRANSPORT_MODES: { value: TransportMode; label: string }[] = [
  { value: 'personal_car',     label: 'Voiture personnelle' },
  { value: 'company_car',      label: 'Voiture société' },
  { value: 'public_transport', label: 'Transport en commun' },
  { value: 'plane',            label: 'Avion' },
  { value: 'other',            label: 'Autre' },
]

const EXPENSE_CATS = [
  { value: 'transport',     label: 'Transport' },
  { value: 'hebergement',   label: 'Hébergement' },
  { value: 'repas',         label: 'Repas' },
  { value: 'carburant',     label: 'Carburant' },
  { value: 'communication', label: 'Communication' },
  { value: 'autre',         label: 'Autre' },
]

// ── Qui soumet ? ─────────────────────────────────────────────
const forWhom = ref<BeneficiaryValue>({ mode: props.mode, employeeId: '' })

const employeeItems = computed(() =>
  employeeStore.employees.map(e => ({
    id:          e.id,
    label:       e.name,
    sublabel:    e.entityName,
    initials:    e.avatarText,
    avatarColor: e.avatarBg,
  }))
)

const transportItems = TRANSPORT_MODES.map(m => ({ id: m.value, label: m.label }))

const selectedEmployee = computed(() => {
  if (forWhom.value.mode === 'self') {
    const u = auth.user
    if (!u) return null
    return { id: u.id, name: u.name, initials: u.initials, role: u.role as string }
  }
  const emp = employeeStore.getById(forWhom.value.employeeId)
  if (!emp) return null
  return { id: emp.id, name: emp.name, initials: emp.initials, role: emp.role as string }
})

// ── Catégorie auto-dérivée du rôle ────────────────────────────
function roleToEmployeeCategory(role: string): EmployeeCategory {
  if (role === 'hr_director') return 'cat_a'
  if (role === 'hr_admin')    return 'cat_b'
  if (role === 'validator')   return 'cat_c'
  return 'cat_d'
}

function roleToPerdiemLabel(role: string): string {
  if (role === 'hr_director' || role === 'hr_admin') return 'Cadre supérieur'
  if (role === 'validator') return 'Cadre'
  return 'Employé'
}

const employeeCategory = computed((): EmployeeCategory =>
  selectedEmployee.value ? roleToEmployeeCategory(selectedEmployee.value.role) : 'cat_d'
)

const perdiemCategoryLabel = computed(() =>
  selectedEmployee.value ? roleToPerdiemLabel(selectedEmployee.value.role) : ''
)

const perdiemRate = computed(() =>
  perdiemCategoryLabel.value
    ? calendarStore.getPerdiemRate(perdiemCategoryLabel.value)
    : undefined
)

// ── Formulaire ────────────────────────────────────────────────
const form = reactive({
  destination:         '',
  purpose:             '',
  departureDate:       '',
  returnDate:          '',
  transportMode:       'personal_car' as TransportMode,
  transportModeReturn: 'personal_car' as TransportMode,
  advance:             0,
  description:         '',
})

const errors = reactive({
  employee: '', destination: '', purpose: '',
  departureDate: '', returnDate: '',
})

interface ExpenseLine { category: string; description: string; amount: number }
const expenseLines = reactive<ExpenseLine[]>([])

// ── Calculs ───────────────────────────────────────────────────
const computedDays = computed(() => {
  if (!form.departureDate || !form.returnDate) return 0
  const d = new Date(form.departureDate)
  const r = new Date(form.returnDate)
  return Math.max(1, Math.ceil((r.getTime() - d.getTime()) / 86400000))
})

const perdiemTotal = computed(() =>
  perdiemRate.value ? perdiemRate.value.ratePerDay * computedDays.value : 0
)
const expenseTotal = computed(() =>
  expenseLines.reduce((s, l) => s + (l.amount || 0), 0)
)
const grandTotal = computed(() => perdiemTotal.value + expenseTotal.value)

function fmt(n: number): string { return n.toLocaleString('fr-FR') }

function addLine() { expenseLines.push({ category: 'transport', description: '', amount: 0 }) }
function removeLine(i: number) { expenseLines.splice(i, 1) }

// ── Reset ─────────────────────────────────────────────────────
function reset() {
  forWhom.value            = { mode: props.mode, employeeId: '' }
  form.destination         = ''
  form.purpose             = ''
  form.departureDate       = ''
  form.returnDate          = ''
  form.transportMode       = 'personal_car'
  form.transportModeReturn = 'personal_car'
  form.advance             = 0
  form.description         = ''
  expenseLines.splice(0, expenseLines.length)
  Object.assign(errors, { employee: '', destination: '', purpose: '', departureDate: '', returnDate: '' })
}

watch(() => props.modelValue, v => { if (v) reset() })

// ── Validation ────────────────────────────────────────────────
function validate(): boolean {
  Object.assign(errors, { employee: '', destination: '', purpose: '', departureDate: '', returnDate: '' })
  let ok = true
  if (forWhom.value.mode === 'for-employee' && !forWhom.value.employeeId) {
    errors.employee = 'Sélectionnez un employé'; ok = false
  }
  if (!form.destination)   { errors.destination  = 'Destination requise'; ok = false }
  if (!form.purpose)       { errors.purpose      = 'Motif requis'; ok = false }
  if (!form.departureDate) { errors.departureDate = 'Date de départ requise'; ok = false }
  if (!form.returnDate)    { errors.returnDate   = 'Date de retour requise'; ok = false }
  else if (form.returnDate < form.departureDate) {
    errors.returnDate = 'Le retour doit être après le départ'; ok = false
  }
  return ok
}

function resolveEmployee() {
  if (forWhom.value.mode === 'self') {
    return { id: auth.user?.id ?? '', name: auth.user?.name ?? '', initials: auth.user?.initials ?? '' }
  }
  const emp = employeeStore.getById(forWhom.value.employeeId)
  return { id: emp?.id ?? '', name: emp?.name ?? '', initials: emp?.initials ?? '' }
}

function close() { emit('update:modelValue', false) }

function handleDraft() {
  if (!validate()) return
  const emp = resolveEmployee()
  missionStore.createMission({
    employeeId: emp.id, employeeName: emp.name, employeeInitials: emp.initials,
    employeeCategory: employeeCategory.value,
    destination: form.destination, purpose: form.purpose,
    departureDate: form.departureDate, returnDate: form.returnDate,
    transportMode: form.transportMode, transportModeReturn: form.transportModeReturn,
    description: form.description || undefined,
    advanceRequested: form.advance,
  })
  close()
  emit('drafted')
}

function handleSubmit() {
  if (!validate()) return
  const emp = resolveEmployee()
  const m = missionStore.createMission({
    employeeId: emp.id, employeeName: emp.name, employeeInitials: emp.initials,
    employeeCategory: employeeCategory.value,
    destination: form.destination, purpose: form.purpose,
    departureDate: form.departureDate, returnDate: form.returnDate,
    transportMode: form.transportMode, transportModeReturn: form.transportModeReturn,
    description: form.description || undefined,
    advanceRequested: form.advance,
  })
  missionStore.submitMission(m.id)
  close()
  emit('submitted')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--color-surface); border-radius: 12px;
  max-width: 640px; width: 95%; max-height: 92vh;
  display: flex; flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 0.5px solid var(--color-border); flex-shrink: 0;
}
.modal-title-text { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-close-btn {
  width: 28px; height: 28px; border: none; background: var(--color-bg);
  border-radius: 6px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: var(--color-text-muted); font-size: 14px;
}
.modal-close-btn:hover { background: var(--color-border); }
.modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 24px; border-top: 0.5px solid var(--color-border); flex-shrink: 0;
}

.section-title {
  font-size: 11px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .06em;
  padding: 4px 0; border-bottom: 0.5px solid var(--color-border); margin-top: 4px;
  display: flex; align-items: center; gap: 6px;
}
.section-opt { font-weight: 400; text-transform: none; letter-spacing: 0; font-style: italic; }


.emp-badge {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; background: var(--color-bg);
  border: 0.5px solid var(--color-border); border-radius: 8px;
}
.emp-badge-info { display: flex; flex-direction: column; gap: 2px; }
.emp-badge-name { font-size: 13px; font-weight: 500; color: var(--color-text); }
.emp-badge-cat  { font-size: 11px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; }

.field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-input {
  height: 38px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); font-size: 13px; color: var(--color-text);
  outline: none; width: 100%; box-sizing: border-box; transition: border-color .12s;
}
.field-input:focus { border-color: var(--color-primary); }
.field-input.input-error { border-color: var(--color-danger) !important; }
.field-input-sm { height: 32px; font-size: 12px; }
.field-textarea {
  padding: 8px 10px; border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); font-size: 13px; color: var(--color-text);
  outline: none; resize: vertical; font-family: inherit; width: 100%; box-sizing: border-box;
}
.field-textarea:focus { border-color: var(--color-primary); }
.field-error { font-size: 11px; color: var(--color-danger); }

.perdiem-card {
  background: var(--color-bg); border: 0.5px solid var(--color-border);
  border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 8px;
}
.pd-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.pd-label { color: var(--color-text-muted); }
.pd-val   { font-weight: 500; color: var(--color-text); }
.pd-divider { height: 0.5px; background: var(--color-border); }
.pd-total .pd-label { font-weight: 700; color: var(--color-text); }
.pd-total .pd-val   { font-size: 15px; font-weight: 700; color: var(--color-primary); }

.allowance-empty {
  background: var(--color-bg); border: 0.5px dashed var(--color-border);
  border-radius: 8px; padding: 20px; text-align: center;
  font-size: 12px; color: var(--color-text-muted);
  display: flex; align-items: center; justify-content: center; gap: 8px;
}

.expense-table { display: flex; flex-direction: column; gap: 6px; }
.expense-header {
  display: grid; grid-template-columns: 130px 1fr 110px 32px; gap: 6px;
  font-size: 10px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .05em; padding: 0 2px;
}
.expense-row { display: grid; grid-template-columns: 130px 1fr 110px 32px; gap: 6px; align-items: center; }
.remove-line-btn {
  width: 32px; height: 32px; border: none; border-radius: 6px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-danger-bg); color: var(--color-danger); font-size: 14px;
  transition: opacity .1s; flex-shrink: 0;
}
.remove-line-btn:hover { opacity: .75; }
.add-line-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
  cursor: pointer; border: 0.5px dashed var(--color-border);
  background: none; color: var(--color-text-muted); transition: all .12s; align-self: flex-start;
}
.add-line-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light); }

.recap-card {
  background: var(--color-bg); border: 0.5px solid var(--color-border);
  border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 8px;
}
.recap-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--color-text-muted); }
.recap-divider { height: 0.5px; background: var(--color-border); }
.recap-total { font-weight: 700; color: var(--color-text); }
.recap-total span:last-child { font-size: 15px; color: var(--color-primary); }

.btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; white-space: nowrap; }
.btn-primary { background: var(--color-primary); color: var(--color-surface); }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

@media (max-width: 600px) {
  .modal-card { width: 97%; }
  .field-row { grid-template-columns: 1fr; }
  .expense-header, .expense-row { grid-template-columns: 100px 1fr 90px 32px; }
  .mode-toggle { flex-wrap: wrap; }
}
</style>
