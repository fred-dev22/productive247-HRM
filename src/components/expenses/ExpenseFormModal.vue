<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('update:modelValue', false)">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ editId ? 'Modifier la note de frais' : 'Nouvelle note de frais' }}</h2>
          <button class="close-btn" @click="$emit('update:modelValue', false)"><i class="ti ti-x"></i></button>
        </div>

        <div class="modal-body">

          <!-- Bénéficiaire -->
          <div class="section">
            <ForWhomSelector
              v-model="forWhom"
              :available-employees="availableEmployees"
            />
          </div>

          <!-- Infos générales -->
          <div class="section">
            <div class="section-title">Informations générales</div>
            <div class="form-grid">
              <div class="form-field form-full">
                <label class="field-label">Titre *</label>
                <input v-model="form.title" class="field-input" type="text" placeholder="Ex: Mission Antananarivo – Juin 2026" />
              </div>
              <div class="form-field">
                <label class="field-label">Mission liée (optionnel)</label>
                <select v-model="form.missionId" class="field-input">
                  <option value="">Aucune</option>
                  <option v-for="m in missionStore.missions.filter(m => m.status === 'approved')" :key="m.id" :value="m.id">
                    {{ m.code }} — {{ m.destination }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Lignes de dépense -->
          <div class="section">
            <div class="section-header">
              <div class="section-title">Lignes de dépense</div>
              <button class="add-line-btn" @click="addLine"><i class="ti ti-plus"></i> Ajouter</button>
            </div>
            <table class="lines-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Catégorie</th>
                  <th>Description</th>
                  <th>Montant (MGA)</th>
                  <th>Justif.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in form.lines" :key="line.id">
                  <td><input v-model="line.date" class="cell-input" type="date" /></td>
                  <td>
                    <select v-model="line.category" class="cell-input">
                      <option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
                    </select>
                  </td>
                  <td><input v-model="line.description" class="cell-input" type="text" placeholder="Description..." /></td>
                  <td><input v-model.number="line.amount" class="cell-input cell-amount" type="number" min="0" /></td>
                  <td class="center">
                    <input type="checkbox" v-model="line.receipt" />
                  </td>
                  <td>
                    <button class="remove-line-btn" @click="removeLine(idx)"><i class="ti ti-trash"></i></button>
                  </td>
                </tr>
                <tr v-if="form.lines.length === 0">
                  <td colspan="6" class="no-lines">Aucune ligne — cliquez "Ajouter" pour commencer</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Récapitulatif -->
          <div class="recap">
            <div class="recap-row">
              <span class="recap-label">Nombre de lignes</span>
              <span class="recap-val">{{ form.lines.length }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-label">Lignes avec justificatif</span>
              <span class="recap-val">{{ form.lines.filter(l => l.receipt).length }} / {{ form.lines.length }}</span>
            </div>
            <div class="recap-row recap-total">
              <span class="recap-label">Total</span>
              <span class="recap-val">{{ fmt(totalAmount) }} MGA</span>
            </div>
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="$emit('update:modelValue', false)">Annuler</button>
          <button class="btn btn-secondary" @click="saveDraft">
            <i class="ti ti-device-floppy"></i> Brouillon
          </button>
          <button class="btn btn-primary" @click="submit">
            <i class="ti ti-send"></i> Soumettre
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
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

const auth          = useAuthStore()
const expenseStore  = useExpenseStore()
const missionStore  = useMissionStore()
const employeeStore = useEmployeeStore()

const forWhom = ref<BeneficiaryValue>({ mode: 'self', employeeId: '' })

const availableEmployees = computed(() => {
  const role = auth.user?.role ?? ''
  if (role === 'hr_admin' || role === 'hr_director') {
    return employeeStore.employees.map(e => ({
      id: e.id, label: e.name, sublabel: e.entityName,
      initials: e.avatarText, avatarColor: e.avatarBg,
    }))
  }
  if (role === 'validator') {
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

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal   { background: var(--color-surface); border-radius: 12px; width: 800px; max-width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 12px 48px rgba(0,0,0,.2); }

.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 0.5px solid var(--color-border); flex-shrink: 0; }
.modal-title  { font-size: 16px; font-weight: 700; color: var(--color-text); }
.close-btn    { width: 30px; height: 30px; border: none; background: var(--color-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 16px; }

.modal-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }

.section { display: flex; flex-direction: column; gap: 12px; }
.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 13px; font-weight: 700; color: var(--color-text); text-transform: uppercase; letter-spacing: .04em; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-full { grid-column: 1 / -1; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text-muted); }
.field-input { height: 36px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 13px; color: var(--color-text); background: var(--color-bg); outline: none; }
.field-input:focus { border-color: var(--color-primary); }

.add-line-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 6px; border: none; background: var(--color-primary-light); color: var(--color-primary); font-size: 12px; font-weight: 600; cursor: pointer; }

.lines-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.lines-table th { padding: 7px 8px; text-align: left; font-size: 11px; font-weight: 600; color: var(--color-text-muted); background: var(--color-bg); border-bottom: 0.5px solid var(--color-border); white-space: nowrap; }
.lines-table td { padding: 5px 6px; border-bottom: 0.5px solid var(--color-border); }
.cell-input { width: 100%; height: 30px; padding: 0 6px; border: 0.5px solid var(--color-border); border-radius: 5px; font-size: 12px; background: var(--color-surface); color: var(--color-text); outline: none; box-sizing: border-box; }
.cell-input:focus { border-color: var(--color-primary); }
.cell-amount { text-align: right; }
.center { text-align: center; }
.remove-line-btn { width: 26px; height: 26px; border: none; background: var(--color-danger-bg); color: var(--color-danger); border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.no-lines { text-align: center; padding: 20px; color: var(--color-text-muted); font-style: italic; }

.recap { background: var(--color-bg); border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; border: 0.5px solid var(--color-border); }
.recap-row { display: flex; justify-content: space-between; font-size: 13px; }
.recap-label { color: var(--color-text-muted); }
.recap-val   { font-weight: 500; color: var(--color-text); }
.recap-total { padding-top: 8px; margin-top: 4px; border-top: 0.5px solid var(--color-border); }
.recap-total .recap-val { font-size: 16px; font-weight: 700; color: var(--color-primary); }

.modal-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 14px 20px; border-top: 0.5px solid var(--color-border); flex-shrink: 0; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; }
.btn-primary   { background: var(--color-primary); color: #fff; }
.btn-secondary { background: var(--color-info-bg); color: var(--color-info); }
.btn-outline   { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }

@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .modal-body { padding: 14px; } }
</style>
