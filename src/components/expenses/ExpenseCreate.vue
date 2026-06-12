<script setup lang="ts">
/**
 * Fiche de création d'une note de frais — sur CreateModalShell (pattern
 * frontdesk). Bénéficiaire + lignes de dépense + récapitulatif.
 */
import { ref, reactive, computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import * as cls from '../../lib/formClasses'
import { useAuthStore } from '../../stores/auth'
import { useExpenseStore } from '../../stores/expenses'
import { useEmployeeStore } from '../../stores/employees'
import type { ExpenseLine, ExpenseCategory } from '../../types'

const props = withDefaults(defineProps<{ mode?: 'self' | 'for-employee' }>(), { mode: 'self' })
const emit = defineEmits<{ close: []; created: [] }>()

const auth = useAuthStore()
const expenseStore = useExpenseStore()
const employeeStore = useEmployeeStore()

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport: 'Transport', hebergement: 'Hébergement', repas: 'Repas', carburant: 'Carburant',
  fournitures: 'Fournitures', communication: 'Communication', representation: 'Représentation', autre: 'Autre',
}
const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[]
function fmt(n: number) { return n.toLocaleString('fr-FR') }

const forWhom = ref<BeneficiaryValue>({ mode: props.mode, employeeId: '' })
const employeeItems = computed(() =>
  employeeStore.employees.map(e => ({ id: e.id, label: e.name, sublabel: e.entityName, initials: e.avatarText, avatarColor: e.avatarBg })),
)

const form = reactive({ title: '' })
const lines = ref<ExpenseLine[]>([])
const error = ref('')
let lineSeq = 100

function addLine() {
  lines.value.push({ id: `new-${++lineSeq}`, date: new Date().toISOString().slice(0, 10), category: 'transport', description: '', amount: 0, currency: 'MGA', receipt: false })
}
function removeLine(i: number) { lines.value.splice(i, 1) }
const total = computed(() => lines.value.reduce((s, l) => s + (l.amount || 0), 0))

function resolveEmployee() {
  if (forWhom.value.mode === 'for-employee' && forWhom.value.employeeId) {
    const emp = employeeStore.getById(forWhom.value.employeeId)
    if (emp) return { id: emp.id, name: emp.name, initials: emp.initials }
  }
  return { id: auth.user?.id ?? '', name: auth.user?.name ?? '', initials: auth.user?.initials ?? '' }
}

function validate(): boolean {
  if (forWhom.value.mode === 'for-employee' && !forWhom.value.employeeId) { error.value = 'Sélectionnez un employé'; return false }
  if (!form.title.trim()) { error.value = 'Le titre est obligatoire'; return false }
  if (lines.value.length === 0) { error.value = 'Ajoutez au moins une ligne de dépense'; return false }
  error.value = ''
  return true
}

function build(submit: boolean) {
  if (!validate()) return
  const emp = resolveEmployee()
  const r = expenseStore.createReport({
    employeeId: emp.id, employeeName: emp.name, employeeInitials: emp.initials,
    title: form.title, lines: lines.value, totalAmount: total.value, currency: 'MGA',
  })
  if (submit) expenseStore.submitReport(r.id)
  emit('created'); emit('close')
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
        <div class="max-w-3xl">
          <!-- Bénéficiaire -->
          <div class="flex items-center border-b-2 border-primary pb-2 mb-5">
            <h2 class="text-base font-bold text-foreground">Général</h2>
          </div>
          <ForWhomSelector v-model="forWhom" :available-employees="employeeItems" />
          <div :class="cls.field" class="mt-4 mb-7">
            <label :class="cls.fieldLabel">Titre <span class="text-danger">*</span></label>
            <input v-model="form.title" :class="cls.fieldInput" placeholder="ex : Mission Antananarivo – Juin 2026" />
          </div>

          <!-- Lignes -->
          <div class="flex items-center justify-between border-b-2 border-primary pb-2 mb-4">
            <h2 class="text-base font-bold text-foreground">Lignes de dépense</h2>
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
              <tr v-for="(l, i) in lines" :key="l.id">
                <td :class="td"><input type="date" v-model="l.date" :class="cellInput" /></td>
                <td :class="td"><select v-model="l.category" :class="cellInput"><option v-for="c in CATEGORIES" :key="c" :value="c">{{ CATEGORY_LABELS[c] }}</option></select></td>
                <td :class="td"><input v-model="l.description" :class="cellInput" placeholder="Description…" /></td>
                <td :class="td"><input type="number" min="0" v-model.number="l.amount" :class="[cellInput, 'text-right']" /></td>
                <td :class="[td, 'text-center']"><input type="checkbox" class="accent-primary" v-model="l.receipt" /></td>
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

          <div class="mt-6">
            <button :class="cls.btnOutline" @click="build(false)">Enregistrer comme brouillon</button>
          </div>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
