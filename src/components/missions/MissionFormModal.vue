<template>
  <ModalShell
    :open="modelValue"
    :title="editId ? 'Modifier la mission' : 'Nouvelle mission'"
    max-width="max-w-[640px]"
    @close="close"
  >

    <!-- Section : Informations générales -->
    <div :class="sectionTitle">Informations générales</div>

    <!-- Sélecteur de bénéficiaire -->
    <ForWhomSelector
      v-model="forWhom"
      :available-employees="employeeItems"
      :error-employee="errors.employee"
    />

    <!-- Badge employé avec catégorie -->
    <div v-if="selectedEmployee" class="flex items-center gap-2.5 px-3.5 py-2.5 bg-background border border-border rounded-lg">
      <UserAvatar :name="selectedEmployee.name" size="sm" />
      <div class="flex flex-col gap-0.5">
        <div class="text-[13px] font-medium text-foreground">{{ selectedEmployee.name }}</div>
        <div class="text-[11px] text-muted-foreground flex items-center gap-1">
          <Tag class="w-3 h-3" />
          {{ perdiemCategoryLabel }}
        </div>
      </div>
    </div>

    <!-- Destination -->
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Destination *</label>
      <input
        v-model="form.destination"
        :class="[cls.fieldInput, errors.destination && cls.inputError]"
        placeholder="ex: Antananarivo, Toamasina..."
      />
      <div v-if="errors.destination" :class="cls.fieldError">{{ errors.destination }}</div>
    </div>

    <!-- Objet / Motif -->
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Objet / Motif de la mission *</label>
      <textarea
        v-model="form.purpose"
        :class="[cls.fieldTextarea, errors.purpose && cls.inputError]"
        rows="2"
        placeholder="Décrivez l'objet de la mission..."
      ></textarea>
      <div v-if="errors.purpose" :class="cls.fieldError">{{ errors.purpose }}</div>
    </div>

    <!-- Section : Déplacement -->
    <div :class="sectionTitle">Déplacement</div>

    <div :class="cls.fieldRow">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Date et heure de départ *</label>
        <input
          type="datetime-local"
          v-model="form.departureDate"
          :class="[cls.fieldInput, errors.departureDate && cls.inputError]"
        />
        <div v-if="errors.departureDate" :class="cls.fieldError">{{ errors.departureDate }}</div>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Date et heure de retour *</label>
        <input
          type="datetime-local"
          v-model="form.returnDate"
          :class="[cls.fieldInput, errors.returnDate && cls.inputError]"
          :min="form.departureDate"
        />
        <div v-if="errors.returnDate" :class="cls.fieldError">{{ errors.returnDate }}</div>
      </div>
    </div>

    <div :class="cls.fieldRow">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Transport aller</label>
        <SearchableDropdown
          :items="transportItems"
          :model-value="form.transportMode"
          :show-avatar="false"
          @update:model-value="form.transportMode = $event as TransportMode"
        />
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Transport retour</label>
        <SearchableDropdown
          :items="transportItems"
          :model-value="form.transportModeReturn"
          :show-avatar="false"
          @update:model-value="form.transportModeReturn = $event as TransportMode"
        />
      </div>
    </div>

    <!-- Section : Indemnité per diem -->
    <div :class="sectionTitle">Indemnité per diem</div>

    <div v-if="selectedEmployee && form.departureDate && form.returnDate && perdiemRate" class="bg-background border border-border rounded-lg p-3.5 flex flex-col gap-2">
      <div :class="pdRow">
        <span class="text-muted-foreground">Catégorie</span>
        <span class="font-medium text-foreground">{{ perdiemCategoryLabel }}</span>
      </div>
      <div :class="pdRow">
        <span class="text-muted-foreground">Taux journalier</span>
        <span class="font-medium text-foreground">{{ fmt(perdiemRate.ratePerDay) }} {{ perdiemRate.currency }}</span>
      </div>
      <div :class="pdRow">
        <span class="text-muted-foreground">Nombre de jours</span>
        <span class="font-medium text-foreground">{{ computedDays }} jour(s)</span>
      </div>
      <div class="h-px bg-border"></div>
      <div :class="pdRow">
        <span class="font-bold text-foreground">Total per diem</span>
        <span class="text-[15px] font-bold text-primary">{{ fmt(perdiemTotal) }} {{ perdiemRate.currency }}</span>
      </div>
    </div>
    <div v-else class="bg-background border border-dashed border-border rounded-lg p-5 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
      <Calculator class="w-4 h-4" />
      {{
        !selectedEmployee
          ? 'Sélectionnez un employé et des dates pour calculer le per diem'
          : 'Sélectionnez des dates pour calculer le per diem'
      }}
    </div>

    <!-- Section : Frais supplémentaires -->
    <div :class="sectionTitle">
      Frais supplémentaires
      <span class="font-normal normal-case tracking-normal italic">(optionnel)</span>
    </div>

    <div v-if="expenseLines.length > 0" class="flex flex-col gap-1.5">
      <div :class="[expenseGrid, 'text-[10px] font-bold text-muted-foreground uppercase tracking-[0.05em] px-0.5']">
        <span>Catégorie</span>
        <span>Description</span>
        <span>Montant</span>
        <span></span>
      </div>
      <div v-for="(line, i) in expenseLines" :key="i" :class="[expenseGrid, 'items-center']">
        <select v-model="line.category" :class="cellInput">
          <option v-for="cat in EXPENSE_CATS" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
        </select>
        <input v-model="line.description" :class="cellInput" placeholder="Description..." />
        <input v-model.number="line.amount" type="number" :class="cellInput" min="0" placeholder="0" />
        <button
          class="w-8 h-8 rounded-md cursor-pointer flex items-center justify-center bg-danger-bg text-danger shrink-0 transition-opacity hover:opacity-75"
          @click="removeLine(i)" title="Supprimer"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <button
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer border border-dashed border-border bg-transparent text-muted-foreground transition-colors self-start hover:border-primary hover:text-primary hover:bg-primary/10"
      @click="addLine"
    >
      <Plus class="w-3.5 h-3.5" /> Ajouter un frais
    </button>

    <!-- Section : Récapitulatif -->
    <template v-if="perdiemRate || expenseLines.length > 0">
      <div :class="sectionTitle">Récapitulatif</div>
      <div class="bg-background border border-border rounded-lg p-3.5 flex flex-col gap-2">
        <div v-if="perdiemRate" :class="[pdRow, 'text-muted-foreground']">
          <span>Per diem ({{ computedDays }}j × {{ fmt(perdiemRate.ratePerDay) }})</span>
          <span>{{ fmt(perdiemTotal) }} {{ perdiemRate.currency }}</span>
        </div>
        <div v-if="expenseLines.length > 0" :class="[pdRow, 'text-muted-foreground']">
          <span>Frais supplémentaires</span>
          <span>{{ fmt(expenseTotal) }} {{ perdiemRate?.currency ?? 'MGA' }}</span>
        </div>
        <div class="h-px bg-border"></div>
        <div :class="[pdRow, 'font-bold text-foreground']">
          <span>TOTAL MISSION</span>
          <span class="text-[15px] text-primary">{{ fmt(grandTotal) }} {{ perdiemRate?.currency ?? 'MGA' }}</span>
        </div>
        <div :class="[cls.field, 'mt-3']">
          <label :class="cls.fieldLabel">Acompte demandé (optionnel)</label>
          <input
            type="number"
            v-model.number="form.advance"
            :class="cls.fieldInput"
            :max="grandTotal"
            min="0"
            placeholder="0"
          />
        </div>
      </div>
    </template>

    <!-- Section : Notes -->
    <div :class="sectionTitle">Notes</div>
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Description (optionnelle)</label>
      <textarea
        v-model="form.description"
        :class="cls.fieldTextarea"
        rows="2"
        placeholder="Informations complémentaires..."
      ></textarea>
    </div>

    <!-- ── Pied ── -->
    <template #footer>
      <button :class="cls.btnOutline" @click="handleDraft">
        <Save class="w-4 h-4" /> Brouillon
      </button>
      <button :class="cls.btnPrimary" @click="handleSubmit">
        <Send class="w-4 h-4" /> Soumettre
      </button>
    </template>

  </ModalShell>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { Tag, Calculator, Trash2, Plus, Save, Send } from 'lucide-vue-next'
import ModalShell from '../ui/ModalShell.vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import UserAvatar         from '../ui/UserAvatar.vue'
import * as cls from '../../lib/formClasses'
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

// ── Classes du design system ─────────────────────────────────
const sectionTitle = 'text-[11px] font-bold text-muted-foreground uppercase tracking-[0.06em] py-1 border-b border-border mt-1 flex items-center gap-1.5'
const pdRow = 'flex items-center justify-between text-[13px]'
const expenseGrid = 'grid grid-cols-[130px_1fr_110px_32px] gap-1.5 max-sm:grid-cols-[100px_1fr_90px_32px]'
const cellInput = 'w-full h-8 px-2.5 border border-border rounded-md bg-background text-xs text-foreground outline-none focus:border-primary'

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
