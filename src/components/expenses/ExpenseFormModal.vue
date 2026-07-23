<template>
  <ModalShell
    :open="modelValue"
    :title="editId ? 'Modifier la note de frais' : 'Nouvelle note de frais'"
    max-width="max-w-[800px]"
    @close="$emit('update:modelValue', false)"
  >

    <!-- Bénéficiaire -->
    <ForWhomSelector
      v-model="forWhom"
      :available-employees="availableEmployees"
    />

    <!-- Infos générales -->
    <div class="flex flex-col gap-3">
      <div :class="sectionTitle">Informations générales</div>
      <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <div :class="[cls.field, 'col-span-full']">
          <label :class="cls.fieldLabel">Titre *</label>
          <input v-model="form.title" :class="cls.fieldInput" type="text" placeholder="Ex: Mission Antananarivo – Juin 2026" />
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Mission liée (optionnel)</label>
          <select v-model="form.missionId" :class="cls.fieldSelect">
            <option value="">Aucune</option>
            <option v-for="m in missionStore.missions.filter(m => m.status === 'approved')" :key="m.id" :value="m.id">
              {{ m.code }} — {{ m.destination }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Lignes de dépense -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div :class="sectionTitle">Lignes de dépense</div>
        <button
          class="inline-flex items-center gap-1 px-3 py-[5px] rounded-md bg-primary/10 text-primary text-xs font-semibold cursor-pointer transition-colors hover:bg-primary/20"
          @click="addLine"
        >
          <Plus class="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th :class="thClass">Date</th>
            <th :class="thClass">Catégorie</th>
            <th :class="thClass">Description</th>
            <th :class="thClass">Montant (MGA)</th>
            <th :class="thClass">Justif.</th>
            <th :class="thClass"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(line, idx) in form.lines" :key="line.id">
            <td :class="tdClass"><input v-model="line.date" :class="cellInput" type="date" /></td>
            <td :class="tdClass">
              <select v-model="line.category" :class="cellInput">
                <option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
            </td>
            <td :class="tdClass"><input v-model="line.description" :class="cellInput" type="text" placeholder="Description..." /></td>
            <td :class="tdClass"><input v-model.number="line.amount" :class="[cellInput, 'text-right']" type="number" min="0" /></td>
            <td :class="[tdClass, 'text-center']">
              <input type="checkbox" class="accent-primary" v-model="line.receipt" />
            </td>
            <td :class="tdClass">
              <button
                class="w-[26px] h-[26px] bg-danger-bg text-danger rounded cursor-pointer flex items-center justify-center transition-colors hover:bg-danger hover:text-white"
                @click="removeLine(idx)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
          <tr v-if="form.lines.length === 0">
            <td colspan="6" class="text-center p-5 text-muted-foreground italic">Aucune ligne — cliquez "Ajouter" pour commencer</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Récapitulatif -->
    <div class="bg-background rounded-lg px-4 py-3 flex flex-col gap-1.5 border border-border">
      <div class="flex justify-between text-[13px]">
        <span class="text-muted-foreground">Nombre de lignes</span>
        <span class="font-medium text-foreground">{{ form.lines.length }}</span>
      </div>
      <div class="flex justify-between text-[13px]">
        <span class="text-muted-foreground">Lignes avec justificatif</span>
        <span class="font-medium text-foreground">{{ form.lines.filter(l => l.receipt).length }} / {{ form.lines.length }}</span>
      </div>
      <div class="flex justify-between text-[13px] pt-2 mt-1 border-t border-border">
        <span class="text-muted-foreground">Total</span>
        <span class="text-base font-bold text-primary">{{ fmt(totalAmount) }} MGA</span>
      </div>
    </div>

    <template #footer>
      <button :class="cls.btnOutline" @click="$emit('update:modelValue', false)">Annuler</button>
      <button :class="cls.btnInfo" @click="saveDraft">
        <Save class="w-4 h-4" /> Brouillon
      </button>
      <button :class="cls.btnPrimary" @click="submit">
        <Send class="w-4 h-4" /> Soumettre
      </button>
    </template>

  </ModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus, Trash2, Save, Send } from 'lucide-vue-next'
import ModalShell from '../ui/ModalShell.vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import * as cls from '../../lib/formClasses'
import { useAuthStore }     from '../../stores/auth'
import { useExpenseStore }  from '../../stores/expenses'
import { useMissionStore }  from '../../stores/missions'
import { useEmployeeStore } from '../../stores/employees'
import type { ExpenseLine, ExpenseCategory } from '../../types'

const props = defineProps<{
  modelValue: boolean
  editId?:    string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submitted'): void
}>()

// ── Classes du design system ─────────────────────────────────
const sectionTitle = 'text-[13px] font-bold text-foreground uppercase tracking-[0.04em]'
const thClass = 'px-2 py-[7px] text-left text-[11px] font-semibold text-muted-foreground bg-background border-b border-border whitespace-nowrap'
const tdClass = 'px-1.5 py-[5px] border-b border-border'
const cellInput = 'w-full h-[30px] px-1.5 border border-border rounded text-xs bg-card text-foreground outline-none focus:border-primary'

const auth          = useAuthStore()
const expenseStore  = useExpenseStore()
const missionStore  = useMissionStore()
const employeeStore = useEmployeeStore()

const forWhom = ref<BeneficiaryValue>({ mode: 'self', employeeId: '' })

const availableEmployees = computed(() => {
  if (auth.hasPermission('EMPLOYE_VOIR_TOUT')) {
    return employeeStore.employees.map(e => ({
      id: e.id, label: e.name, sublabel: e.entityName,
      initials: e.avatarText, avatarColor: e.avatarBg,
    }))
  }
  if (auth.hasPermission('EMPLOYE_VOIR_EQUIPE')) {
    return employeeStore.getByEntityId(auth.user?.entityId ?? '').map(e => ({
      id: e.id, label: e.name, sublabel: e.entityName,
      initials: e.avatarText, avatarColor: e.avatarBg,
    }))
  }
  return []
})

function resolveEmployee() {
  if (forWhom.value.mode === 'for-employee' && forWhom.value.employeeId) {
    const emp = employeeStore.getById(forWhom.value.employeeId)
    if (emp) return { id: emp.id, name: emp.name, initials: emp.initials }
  }
  return { id: auth.user?.id ?? '', name: auth.user?.name ?? '', initials: auth.user?.initials ?? '' }
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport:      'Transport',
  hebergement:    'Hébergement',
  repas:          'Repas',
  carburant:      'Carburant',
  fournitures:    'Fournitures',
  communication:  'Communication',
  representation: 'Représentation',
  autre:          'Autre',
}

const existing = props.editId ? expenseStore.getById(props.editId) : undefined

const form = reactive({
  title:     existing?.title     ?? '',
  missionId: existing?.missionId ?? '',
  lines:     (existing?.lines.map(l => ({ ...l })) ?? []) as ExpenseLine[],
})

let lineCounter = 100

function addLine() {
  form.lines.push({
    id:          `new-${++lineCounter}`,
    date:        new Date().toISOString().slice(0, 10),
    category:    'transport' as ExpenseCategory,
    description: '',
    amount:      0,
    currency:    'MGA',
    receipt:     false,
  })
}

function removeLine(idx: number) { form.lines.splice(idx, 1) }

const totalAmount = computed(() => form.lines.reduce((s, l) => s + (l.amount || 0), 0))

function fmt(n: number) { return n.toLocaleString('fr-FR') }

function saveDraft() {
  if (props.editId) {
    expenseStore.updateLines(props.editId, form.lines)
  } else {
    const emp = resolveEmployee()
    expenseStore.createReport({
      employeeId:       emp.id,
      employeeName:     emp.name,
      employeeInitials: emp.initials,
      title:        form.title,
      missionId:    form.missionId || undefined,
      lines:        form.lines,
      totalAmount:  totalAmount.value,
      currency:     'MGA',
    })
  }
  emit('submitted')
}

function submit() {
  const emp = resolveEmployee()
  const r = props.editId
    ? expenseStore.getById(props.editId)
    : expenseStore.createReport({
        employeeId:       emp.id,
        employeeName:     emp.name,
        employeeInitials: emp.initials,
        title:        form.title,
        missionId:    form.missionId || undefined,
        lines:        form.lines,
        totalAmount:  totalAmount.value,
        currency:     'MGA',
      })
  if (r) expenseStore.submitReport(r.id)
  emit('submitted')
}
</script>
