<script setup lang="ts">
/**
 * Fiche de création d'un ordre de mission — sur CreateModalShell (pattern
 * frontdesk). Reprend la logique métier de l'ancien MissionFormModal :
 * bénéficiaire (self / pour un employé), calcul du per diem, acompte.
 */
import { ref, reactive, computed, watch } from 'vue'
import UserAvatar from '../ui/UserAvatar.vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useMissionStore } from '../../stores/missions'
import { useEmployeeStore } from '../../stores/employees'
import { useAuthStore } from '../../stores/auth'
import type { EmployeeCategory, TransportMode } from '../../types'

const props = withDefaults(defineProps<{ mode?: 'self' | 'for-employee' }>(), { mode: 'self' })
const emit = defineEmits<{ close: []; created: [] }>()

const missionStore = useMissionStore()
const employeeStore = useEmployeeStore()
const auth = useAuthStore()

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
    return u ? { id: u.id, name: u.name, initials: u.initials, role: u.role as string } : null
  }
  const emp = employeeStore.getById(forWhom.value.employeeId)
  return emp ? { id: emp.id, name: emp.name, initials: emp.initials, role: emp.role as string } : null
})

function roleToCategory(role: string): EmployeeCategory {
  if (role === 'hr_director') return 'cat_a'
  if (role === 'hr_admin') return 'cat_b'
  if (role === 'validator') return 'cat_c'
  return 'cat_d'
}
const employeeCategory = computed<EmployeeCategory>(() => selectedEmployee.value ? roleToCategory(selectedEmployee.value.role) : 'cat_d')
const allowance = computed(() => missionStore.getAllowance(employeeCategory.value))

const form = reactive({
  destination: '', purpose: '',
  departureDate: '', returnDate: '',
  transportMode: 'plane' as TransportMode, transportModeReturn: 'plane' as TransportMode,
  advance: 0,
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
        <div class="max-w-3xl">

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

          <div :class="cls.field" class="mt-5">
            <label :class="cls.fieldLabel">Acompte demandé (optionnel)</label>
            <input type="number" min="0" v-model.number="form.advance" :class="cls.fieldInput" placeholder="0" />
          </div>
          </FormSection>

          <div class="mt-6">
            <button :class="cls.btnOutline" @click="saveDraft">Enregistrer comme brouillon</button>
          </div>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
