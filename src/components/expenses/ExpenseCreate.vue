<script setup lang="ts">
/**
 * Fiche de création d'une note de frais — sur CreateModalShell (pattern
 * frontdesk). Bénéficiaire + lignes de dépense (catégorie = ExpenseType réel,
 * partagé avec le per diem des missions) + récapitulatif.
 */
import { ref, reactive, computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import UserAvatar from '../ui/UserAvatar.vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useAuthStore } from '../../stores/auth'
import { useExpenseStore } from '../../stores/expenses'
import type { ExpenseLinePayload } from '../../stores/expenses'
import { useMissionStore } from '../../stores/missions'
import { useMissionConfigStore } from '../../stores/missionConfig'
import { useEmployeeStore } from '../../stores/employees'
import { useEmployeeCategoryStore } from '../../stores/employeeCategories'

const props = withDefaults(defineProps<{ mode?: 'self' | 'for-employee' }>(), { mode: 'self' })
const emit = defineEmits<{ close: []; created: [] }>()

const auth = useAuthStore()
const expenseStore = useExpenseStore()
const missionStore = useMissionStore()
const missionConfigStore = useMissionConfigStore()
const employeeStore = useEmployeeStore()
const categoryStore = useEmployeeCategoryStore()

if (missionConfigStore.expenseTypes.length === 0) missionConfigStore.fetchExpenseTypes()
if (missionStore.mine.length === 0) missionStore.fetchMine()
if (categoryStore.categories.length === 0) categoryStore.fetchAll()

function fmt(n: number) { return n.toLocaleString('fr-FR') }

const forWhom = ref<BeneficiaryValue>({ mode: props.mode, employeeId: '' })
const employeeItems = computed(() =>
  employeeStore.employees.map(e => ({ id: e.id, label: e.name, sublabel: e.entityName, initials: e.avatarText, avatarColor: e.avatarBg })),
)

// Carte "bénéficiaire" en lecture seule quand ForWhomSelector n'affiche pas
// le sélecteur (simple employé sans EMPLOYE_VOIR_TOUT/EMPLOYE_VOIR_EQUIPE) —
// même pattern que MissionCreate.vue.
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

const form = reactive({ title: '', missionOrderId: '' })
const approvedMissions = computed(() => missionStore.mine.filter(m => m.status === 'Approved'))
const lines = ref<ExpenseLinePayload[]>([])
const error = ref('')
let lineSeq = 0

function firstExpenseTypeId() { return missionConfigStore.expenseTypes[0]?.id ?? '' }
function addLine() {
  lineSeq++
  lines.value.push({ date: new Date().toISOString().slice(0, 10), expenseTypeId: firstExpenseTypeId(), description: '', amount: 0, hasDocument: false })
}
function removeLine(i: number) { lines.value.splice(i, 1) }
const total = computed(() => lines.value.reduce((s, l) => s + (l.amount || 0), 0))

function validate(): boolean {
  if (forWhom.value.mode === 'for-employee' && !forWhom.value.employeeId) { error.value = 'Sélectionnez un employé'; return false }
  if (!form.title.trim()) { error.value = 'Le titre est obligatoire'; return false }
  if (lines.value.length === 0) { error.value = 'Ajoutez au moins une ligne de dépense'; return false }
  error.value = ''
  return true
}

function buildPayload() {
  return {
    employeeId: forWhom.value.mode === 'for-employee' ? forWhom.value.employeeId : undefined,
    title: form.title,
    missionOrderId: form.missionOrderId || undefined,
    lines: lines.value,
  }
}

async function build(submit: boolean) {
  if (!validate()) return
  try {
    if (submit) await expenseStore.createAndSubmit(buildPayload())
    else await expenseStore.saveDraft(buildPayload())
    emit('created'); emit('close')
  } catch {
    error.value = expenseStore.error ?? "L'opération a échoué."
  }
}

const th = 'text-left px-2.5 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border'
const td = 'px-2.5 py-2 border-b border-border'
const cellInput = 'w-full h-8 px-2 border border-border rounded bg-card text-xs text-foreground outline-none focus:border-primary'
</script>

<template>
  <CreateModalShell
    title="Nouvelle note de frais"
    banner-label="Nouvelle note de frais"
    create-label="Soumettre"
    :save-error="error"
    @close="emit('close')"
    @create="build(true)"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-3xl mx-auto">
          <!-- Bénéficiaire -->
          <FormSection title="Général">
          <ForWhomSelector v-model="forWhom" :available-employees="employeeItems" />
          <div v-if="selectedEmployee" class="flex items-center gap-2.5 mt-3 px-3.5 py-2.5 bg-background border border-border rounded-lg">
            <UserAvatar :name="selectedEmployee.name" size="sm" />
            <div>
              <div class="text-[13px] font-medium text-foreground">{{ selectedEmployee.name }}</div>
              <div class="text-[11px] text-muted-foreground">{{ selectedEmployee.categoryName || 'Sans catégorie' }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1 mt-4">
            <div :class="[cls.field, 'col-span-full']">
              <label :class="cls.fieldLabel">Titre <span class="text-danger">*</span></label>
              <input v-model="form.title" :class="cls.fieldInput" placeholder="ex : Mission Antananarivo – Juin 2026" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Mission liée <span class="font-normal text-muted-foreground">(optionnel)</span></label>
              <select v-model="form.missionOrderId" :class="cls.fieldSelect">
                <option value="">Aucune</option>
                <option v-for="m in approvedMissions" :key="m.id" :value="m.id">{{ m.referenceCode }} — {{ m.destination }}</option>
              </select>
            </div>
          </div>
          </FormSection>

          <!-- Lignes -->
          <FormSection title="Lignes de dépense">
          <div class="flex justify-end mb-2">
            <button class="inline-flex items-center gap-1 px-3 py-[5px] rounded-md bg-primary/10 text-primary text-xs font-semibold cursor-pointer hover:bg-primary/20" @click="addLine">
              <Plus class="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <table class="w-full border-collapse text-[13px] mb-5">
            <thead>
              <tr>
                <th :class="th">Date</th>
                <th :class="th">Catégorie</th>
                <th :class="th">Description</th>
                <th :class="[th, 'text-right']">Montant</th>
                <th :class="[th, 'text-center']">Justif.</th>
                <th :class="th"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(l, i) in lines" :key="i">
                <td :class="td"><input type="date" v-model="l.date" :class="cellInput" /></td>
                <td :class="td">
                  <select v-model="l.expenseTypeId" :class="cellInput">
                    <option v-for="t in missionConfigStore.expenseTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </td>
                <td :class="td"><input v-model="l.description" :class="cellInput" placeholder="Description…" /></td>
                <td :class="td"><input type="number" min="0" v-model.number="l.amount" :class="[cellInput, 'text-right']" /></td>
                <td :class="[td, 'text-center']"><input type="checkbox" class="accent-primary" v-model="l.hasDocument" /></td>
                <td :class="td"><button class="w-7 h-7 rounded-md bg-danger-bg text-danger flex items-center justify-center cursor-pointer hover:brightness-95" @click="removeLine(i)"><Trash2 class="w-3.5 h-3.5" /></button></td>
              </tr>
              <tr v-if="lines.length === 0"><td colspan="6" class="px-2.5 py-5 text-center text-muted-foreground italic">Aucune ligne — cliquez « Ajouter »</td></tr>
            </tbody>
            <tfoot v-if="lines.length > 0">
              <tr>
                <td colspan="3" class="px-2.5 py-2 bg-background font-bold">TOTAL</td>
                <td class="px-2.5 py-2 bg-background font-bold text-right text-primary tabular-nums">{{ fmt(total) }} MGA</td>
                <td class="bg-background" colspan="2"></td>
              </tr>
            </tfoot>
          </table>
          </FormSection>

          <div class="mt-6">
            <button :class="cls.btnOutline" @click="build(false)">Enregistrer comme brouillon</button>
          </div>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
