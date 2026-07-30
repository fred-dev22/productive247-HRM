<script setup lang="ts">
/**
 * Fiche de création d'un ordre de mission — sur CreateModalShell (pattern
 * frontdesk). Reprend la logique métier de l'ancien MissionFormModal :
 * bénéficiaire (self / pour un employé), calcul du per diem, acompte.
 */
import { ref, reactive, computed, watch } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import UserAvatar from '../ui/UserAvatar.vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useMissionStore } from '../../stores/missions'
import { useEmployeeStore } from '../../stores/employees'
import { useEmployeeCategoryStore } from '../../stores/employeeCategories'
import { useAuthStore } from '../../stores/auth'
import type { EmployeeCategory, TransportMode } from '../../types'

const props = withDefaults(defineProps<{ mode?: 'self' | 'for-employee' }>(), { mode: 'self' })
const emit = defineEmits<{ close: []; created: [] }>()

const missionStore = useMissionStore()
const employeeStore = useEmployeeStore()
const categoryStore = useEmployeeCategoryStore()
const auth = useAuthStore()
if (categoryStore.categories.length === 0) categoryStore.fetchAll()

const TRANSPORT_MODES: { value: TransportMode; label: string }[] = [
  { value: 'personal_car', label: 'Voiture personnelle' },
  { value: 'company_car', label: 'Voiture société' },
  { value: 'public_transport', label: 'Transport en commun' },
  { value: 'plane', label: 'Avion' },
  { value: 'other', label: 'Autre' },
]

const forWhom = ref<BeneficiaryValue>({ mode: props.mode, employeeId: '' })

const employeeItems = computed(() =>
  employeeStore.employees.map(e => ({ id: e.id, label: e.name, sublabel: e.entityName, code: e.code, initials: e.avatarText, avatarColor: e.avatarBg })),
)

const selectedEmployee = computed(() => {
  if (forWhom.value.mode === 'self') {
    const u = auth.user
    return u ? { id: u.id, name: u.name, initials: u.initials, categoryName: auth.categoryName ?? '' } : null
  }
  const emp = employeeStore.getById(forWhom.value.employeeId)
  if (!emp) return null
  const categoryName = categoryStore.categories.find(c => c.id === emp.employeeCategoryId)?.name ?? ''
  return { id: emp.id, name: emp.name, initials: emp.initials, categoryName }
})

// Estimation provisoire (voir mission-order.service.ts côté backend pour le
// vrai calcul basé sur ExpenseConfig) — mappe le nom de la catégorie réelle
// de l'employé sur les 4 paliers mock du store missions.ts en attendant que
// cet écran soit branché sur /mission-orders/estimate (Domaine 5 frontend).
function categoryNameToTier(name: string): EmployeeCategory {
  if (name === 'Directeur RH') return 'cat_a'
  if (name === 'Admin RH') return 'cat_b'
  if (name === 'Cadre supérieur' || name === 'Manager' || name === 'Validateur') return 'cat_c'
  return 'cat_d'
}
const employeeCategory = computed<EmployeeCategory>(() => selectedEmployee.value ? categoryNameToTier(selectedEmployee.value.categoryName) : 'cat_d')
const allowance = computed(() => missionStore.getAllowance(employeeCategory.value))

const form = reactive({
  destination: '', purpose: '',
  departureDate: '', returnDate: '',
  transportMode: 'plane' as TransportMode, transportModeReturn: 'plane' as TransportMode,
  advance: 0, description: '',
})
const error = ref('')

const computedDays = computed(() => {
  if (!form.departureDate || !form.returnDate) return 0
  const d = new Date(form.departureDate), r = new Date(form.returnDate)
  return Math.max(1, Math.ceil((r.getTime() - d.getTime()) / 86400000))
})
const perdiemTotal = computed(() => {
  const a = allowance.value
  return a.hotelPerDay * computedDays.value + a.transportFlat + a.mealPerDay * computedDays.value
})
function fmt(n: number) { return n.toLocaleString('fr-FR') }

// Frais supplémentaires — local uniquement, comme sous l'ancien
// MissionFormModal : MissionOrder n'a pas de colonne pour stocker des lignes
// de frais détaillées, seul le total (per diem + ces lignes) alimente le
// récapitulatif et plafonne l'acompte demandé.
const EXPENSE_CATS = [
  { value: 'transport', label: 'Transport' },
  { value: 'hebergement', label: 'Hébergement' },
  { value: 'repas', label: 'Repas' },
  { value: 'fournitures', label: 'Fournitures' },
  { value: 'autre', label: 'Autre' },
]
interface MissionExpenseLine { category: string; description: string; amount: number }
const expenseLines = reactive<MissionExpenseLine[]>([])
function addLine() { expenseLines.push({ category: 'transport', description: '', amount: 0 }) }
function removeLine(i: number) { expenseLines.splice(i, 1) }
const expenseTotal = computed(() => expenseLines.reduce((s, l) => s + (l.amount || 0), 0))
const grandTotal = computed(() => perdiemTotal.value + expenseTotal.value)

watch(() => forWhom.value.mode, () => { if (forWhom.value.mode === 'self') forWhom.value.employeeId = '' })

function resolveEmployee() {
  if (forWhom.value.mode === 'self') {
    return { id: auth.user?.id ?? '', name: auth.user?.name ?? '', initials: auth.user?.initials ?? '' }
  }
  const emp = employeeStore.getById(forWhom.value.employeeId)
  return { id: emp?.id ?? '', name: emp?.name ?? '', initials: emp?.initials ?? '' }
}

function validate(): boolean {
  if (forWhom.value.mode === 'for-employee' && !forWhom.value.employeeId) { error.value = 'Sélectionnez un employé'; return false }
  if (!form.destination.trim()) { error.value = 'Destination requise'; return false }
  if (!form.purpose.trim()) { error.value = 'Motif requis'; return false }
  if (!form.departureDate || !form.returnDate) { error.value = 'Dates de départ et de retour requises'; return false }
  if (form.returnDate < form.departureDate) { error.value = 'Le retour doit être après le départ'; return false }
  error.value = ''
  return true
}

function buildPayload() {
  const emp = resolveEmployee()
  return {
    employeeId: emp.id, employeeName: emp.name, employeeInitials: emp.initials,
    employeeCategory: employeeCategory.value,
    destination: form.destination, purpose: form.purpose,
    departureDate: form.departureDate, returnDate: form.returnDate,
    transportMode: form.transportMode, transportModeReturn: form.transportModeReturn,
    advanceRequested: form.advance,
    description: form.description || undefined,
  }
}

function create() {
  if (!validate()) return
  const m = missionStore.createMission(buildPayload())
  missionStore.submitMission(m.id)
  emit('created'); emit('close')
}
function saveDraft() {
  if (!validate()) return
  missionStore.createMission(buildPayload())
  emit('created'); emit('close')
}
</script>

<template>
  <CreateModalShell
    title="Nouvelle mission"
    banner-label="Nouvel ordre de mission"
    create-label="Soumettre"
    :save-error="error"
    @close="emit('close')"
    @create="create"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-3xl mx-auto">

          <!-- Bénéficiaire -->
          <FormSection title="Bénéficiaire">
          <ForWhomSelector v-model="forWhom" :available-employees="employeeItems" />
          <div v-if="selectedEmployee" class="flex items-center gap-2.5 mt-3 mb-7 px-3.5 py-2.5 bg-background border border-border rounded-lg">
            <UserAvatar :name="selectedEmployee.name" size="sm" />
            <div>
              <div class="text-[13px] font-medium text-foreground">{{ selectedEmployee.name }}</div>
              <div class="text-[11px] text-muted-foreground">Catégorie {{ employeeCategory.slice(-1).toUpperCase() }}</div>
            </div>
          </div>
          </FormSection>

          <!-- Déplacement -->
          <FormSection title="Déplacement">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Destination <span class="text-danger">*</span></label>
              <input v-model="form.destination" :class="cls.fieldInput" placeholder="ex : Antananarivo, Toamasina…" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Objet / Motif <span class="text-danger">*</span></label>
              <textarea v-model="form.purpose" :class="cls.fieldTextarea" rows="2" placeholder="Décrivez l'objet de la mission…"></textarea>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Départ <span class="text-danger">*</span></label>
              <input type="datetime-local" v-model="form.departureDate" :class="cls.fieldInput" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Retour <span class="text-danger">*</span></label>
              <input type="datetime-local" v-model="form.returnDate" :min="form.departureDate" :class="cls.fieldInput" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Transport aller</label>
              <select v-model="form.transportMode" :class="cls.fieldSelect">
                <option v-for="m in TRANSPORT_MODES" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Transport retour</label>
              <select v-model="form.transportModeReturn" :class="cls.fieldSelect">
                <option v-for="m in TRANSPORT_MODES" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
          </div>
          </FormSection>

          <!-- Per diem -->
          <FormSection title="Indemnité per diem">
          <div v-if="selectedEmployee && computedDays > 0" class="bg-background border border-border rounded-lg p-3.5 flex flex-col gap-2">
            <div class="flex items-center justify-between text-[13px]"><span class="text-muted-foreground">Taux hôtel / jour</span><span class="font-medium text-foreground">{{ fmt(allowance.hotelPerDay) }} MGA</span></div>
            <div class="flex items-center justify-between text-[13px]"><span class="text-muted-foreground">Taux repas / jour</span><span class="font-medium text-foreground">{{ fmt(allowance.mealPerDay) }} MGA</span></div>
            <div class="flex items-center justify-between text-[13px]"><span class="text-muted-foreground">Transport (forfait)</span><span class="font-medium text-foreground">{{ fmt(allowance.transportFlat) }} MGA</span></div>
            <div class="flex items-center justify-between text-[13px]"><span class="text-muted-foreground">Nombre de jours</span><span class="font-medium text-foreground">{{ computedDays }}</span></div>
            <div class="h-px bg-border"></div>
            <div class="flex items-center justify-between"><span class="font-bold text-foreground">Total per diem</span><span class="text-[15px] font-bold text-primary">{{ fmt(perdiemTotal) }} MGA</span></div>
          </div>
          <div v-else class="bg-background border border-dashed border-border rounded-lg p-5 text-center text-xs text-muted-foreground">
            Sélectionnez un employé et des dates pour calculer le per diem
          </div>

          </FormSection>

          <!-- Frais supplémentaires -->
          <FormSection title="Frais supplémentaires">
          <p class="text-xs text-muted-foreground -mt-2 mb-3">Optionnel — frais additionnels non couverts par le per diem.</p>
          <div v-if="expenseLines.length > 0" class="flex flex-col gap-1.5 mb-3">
            <div class="grid grid-cols-[1fr_1fr_120px_36px] gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.05em] px-0.5">
              <span>Catégorie</span><span>Description</span><span>Montant (MGA)</span><span></span>
            </div>
            <div v-for="(line, i) in expenseLines" :key="i" class="grid grid-cols-[1fr_1fr_120px_36px] gap-1.5 items-center">
              <select v-model="line.category" :class="cls.fieldInput" class="!h-8 !text-xs">
                <option v-for="c in EXPENSE_CATS" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
              <input v-model="line.description" :class="cls.fieldInput" class="!h-8 !text-xs" placeholder="Description…" />
              <input v-model.number="line.amount" type="number" min="0" :class="cls.fieldInput" class="!h-8 !text-xs" placeholder="0" />
              <button class="w-8 h-8 rounded-md cursor-pointer flex items-center justify-center bg-danger-bg text-danger shrink-0 transition-opacity hover:opacity-75" @click="removeLine(i)" title="Supprimer">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer border border-dashed border-border bg-transparent text-muted-foreground transition-colors hover:border-primary hover:text-primary hover:bg-primary/10"
            @click="addLine"
          >
            <Plus class="w-3.5 h-3.5" /> Ajouter un frais
          </button>
          </FormSection>

          <!-- Récapitulatif -->
          <FormSection v-if="computedDays > 0 || expenseLines.length > 0" title="Récapitulatif">
          <div class="bg-background border border-border rounded-lg p-3.5 flex flex-col gap-2">
            <div v-if="computedDays > 0" class="flex items-center justify-between text-[13px] text-muted-foreground">
              <span>Per diem ({{ computedDays }}j)</span><span>{{ fmt(perdiemTotal) }} MGA</span>
            </div>
            <div v-if="expenseLines.length > 0" class="flex items-center justify-between text-[13px] text-muted-foreground">
              <span>Frais supplémentaires</span><span>{{ fmt(expenseTotal) }} MGA</span>
            </div>
            <div class="h-px bg-border"></div>
            <div class="flex items-center justify-between">
              <span class="font-bold text-foreground">TOTAL MISSION</span>
              <span class="text-[15px] font-bold text-primary">{{ fmt(grandTotal) }} MGA</span>
            </div>
            <div :class="cls.field" class="mt-3">
              <label :class="cls.fieldLabel">Acompte demandé (optionnel)</label>
              <input type="number" min="0" :max="grandTotal" v-model.number="form.advance" :class="cls.fieldInput" placeholder="0" />
            </div>
          </div>
          </FormSection>
          <div v-else :class="cls.field">
            <label :class="cls.fieldLabel">Acompte demandé (optionnel)</label>
            <input type="number" min="0" v-model.number="form.advance" :class="cls.fieldInput" placeholder="0" />
          </div>

          <!-- Notes -->
          <FormSection title="Notes">
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Description <span class="font-normal text-muted-foreground">(optionnelle)</span></label>
            <textarea v-model="form.description" :class="cls.fieldTextarea" rows="2" placeholder="Informations complémentaires…"></textarea>
          </div>
          </FormSection>

          <div class="mt-6 pt-4 border-t border-border flex justify-end">
            <button :class="cls.btnOutline" @click="saveDraft">Enregistrer comme brouillon</button>
          </div>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
