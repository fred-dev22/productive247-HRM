<script setup lang="ts">
/**
 * Fiche d'une note de frais (lecture / édition) — sur CardModalShell, pattern
 * frontdesk. Lignes de dépense éditables pour les brouillons.
 */
import { ref, computed, watch } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import UserAvatar from '../ui/UserAvatar.vue'
import ValidationTimeline from '../ui/ValidationTimeline.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import ExpenseWorkflowActions from './ExpenseWorkflowActions.vue'
import * as cls from '../../lib/formClasses'
import { useExpenseStore } from '../../stores/expenses'
import type { ExpenseReport, ExpenseLine, ExpenseCategory } from '../../types'

const props = defineProps<{ reports: ExpenseReport[]; reportId: string }>()
const emit = defineEmits<{ close: [] }>()

const expenseStore = useExpenseStore()

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport: 'Transport', hebergement: 'Hébergement', repas: 'Repas', carburant: 'Carburant',
  fournitures: 'Fournitures', communication: 'Communication', representation: 'Représentation', autre: 'Autre',
}
const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[]
function fmt(n: number) { return n.toLocaleString('fr-FR') }

const currentId = ref(props.reportId)
watch(() => props.reportId, (v) => { currentId.value = v; isEditMode.value = false })

const current = computed<ExpenseReport | null>(() => props.reports.find(r => r.id === currentId.value) ?? null)
const currentIndex = computed(() => props.reports.findIndex(r => r.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.reports.length - 1)

const sidebarItems = computed(() => props.reports.map(r => ({ no: r.code, label: `${r.employeeName} · ${r.title}` })))
const currentNo = computed(() => current.value?.code ?? null)

function goPrev() { if (hasPrev.value) { currentId.value = props.reports[currentIndex.value - 1]!.id; isEditMode.value = false } }
function goNext() { if (hasNext.value) { currentId.value = props.reports[currentIndex.value + 1]!.id; isEditMode.value = false } }
function selectSidebar(no: string) {
  const r = props.reports.find(x => x.code === no)
  if (r) { currentId.value = r.id; isEditMode.value = false }
}

/* ── Mode édition (brouillons) ──────────────────────────────── */
const isEditMode = ref(false)
const canEdit = computed(() => current.value?.status === 'draft')
const lines = ref<ExpenseLine[]>([])
let lineSeq = 100

function enterEdit() {
  if (!current.value) return
  lines.value = current.value.lines.map(l => ({ ...l }))
  isEditMode.value = true
}
function cancelEdit() { isEditMode.value = false }
function addLine() {
  lines.value.push({ id: `new-${++lineSeq}`, date: new Date().toISOString().slice(0, 10), category: 'transport', description: '', amount: 0, currency: 'MGA', receipt: false })
}
function removeLine(i: number) { lines.value.splice(i, 1) }
const editTotal = computed(() => lines.value.reduce((s, l) => s + (l.amount || 0), 0))
function save() {
  if (!current.value) return
  expenseStore.updateLines(current.value.id, lines.value)
  isEditMode.value = false
}

const pageTitle = computed(() => (current.value ? `${current.value.code} · ${current.value.title}` : ''))
const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'
const th = 'text-left px-2.5 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border'
const td = 'px-2.5 py-2 border-b border-border'
const cellInput = 'w-full h-8 px-2 border border-border rounded bg-card text-xs text-foreground outline-none focus:border-primary'
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="pageTitle"
    :page-number="current.code"
    banner-label="Note de frais"
    :is-edit-mode="isEditMode"
    :show-edit="canEdit"
    :show-title-new-button="false"
    :sidebar-items="sidebarItems"
    :current-no="currentNo"
    :has-prev="hasPrev"
    :has-next="hasNext"
    :has-unsaved-changes="isEditMode"
    @close="emit('close')"
    @enter-edit="enterEdit"
    @cancel-edit="cancelEdit"
    @save="save"
    @go-prev="goPrev"
    @go-next="goNext"
    @select-sidebar="selectSidebar"
  >
    <template #title-badges>
      <StatusPill :status="current.status" />
    </template>

    <template v-if="!isEditMode" #action-buttons>
      <ExpenseWorkflowActions :report="current" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Général -->
        <FormSection title="Général" :recaps="[current.employeeName, current.title]">
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Employé</label>
            <div class="flex items-center gap-2 h-[38px]">
              <UserAvatar :name="current.employeeName" size="sm" />
              <span class="text-[13px] font-medium text-foreground">{{ current.employeeName }}</span>
            </div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Soumis le</label>
            <div :class="readBox">{{ current.submittedAt ?? '—' }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Titre</label>
            <div :class="readBox">{{ current.title }}</div>
          </div>
        </div>
        </FormSection>

        <!-- Lignes -->
        <FormSection :title="`Lignes de dépense (${current.lines.length})`" :recaps="[`${fmt(current.totalAmount)} MGA`]">
          <div v-if="isEditMode" class="flex justify-end mb-2">
            <button class="inline-flex items-center gap-1 px-3 py-[5px] rounded-md bg-primary/10 text-primary text-xs font-semibold cursor-pointer hover:bg-primary/20" @click="addLine">
              <Plus class="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
        <table class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th :class="th">Date</th>
              <th :class="th">Catégorie</th>
              <th :class="th">Description</th>
              <th :class="[th, 'text-right']">Montant</th>
              <th :class="[th, 'text-center']">Justif.</th>
              <th v-if="isEditMode" :class="th"></th>
            </tr>
          </thead>
          <tbody>
            <!-- Lecture -->
            <template v-if="!isEditMode">
              <tr v-for="l in current.lines" :key="l.id">
                <td :class="td">{{ l.date }}</td>
                <td :class="td">{{ CATEGORY_LABELS[l.category] }}</td>
                <td :class="td">{{ l.description }}</td>
                <td :class="[td, 'text-right tabular-nums']">{{ fmt(l.amount) }} {{ l.currency }}</td>
                <td :class="[td, 'text-center']">{{ l.receipt ? '✓' : '—' }}</td>
              </tr>
            </template>
            <!-- Édition -->
            <template v-else>
              <tr v-for="(l, i) in lines" :key="l.id">
                <td :class="td"><input type="date" v-model="l.date" :class="cellInput" /></td>
                <td :class="td">
                  <select v-model="l.category" :class="cellInput">
                    <option v-for="c in CATEGORIES" :key="c" :value="c">{{ CATEGORY_LABELS[c] }}</option>
                  </select>
                </td>
                <td :class="td"><input v-model="l.description" :class="cellInput" placeholder="Description…" /></td>
                <td :class="td"><input type="number" min="0" v-model.number="l.amount" :class="[cellInput, 'text-right']" /></td>
                <td :class="[td, 'text-center']"><input type="checkbox" class="accent-primary" v-model="l.receipt" /></td>
                <td :class="td">
                  <button class="w-7 h-7 rounded-md bg-danger-bg text-danger flex items-center justify-center cursor-pointer hover:brightness-95" @click="removeLine(i)"><Trash2 class="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr>
              <td :colspan="isEditMode ? 3 : 3" class="px-2.5 py-2 bg-background font-bold">TOTAL</td>
              <td class="px-2.5 py-2 bg-background font-bold text-right text-primary tabular-nums">{{ fmt(isEditMode ? editTotal : current.totalAmount) }} MGA</td>
              <td class="bg-background" :colspan="isEditMode ? 2 : 1"></td>
            </tr>
          </tfoot>
        </table>
        </FormSection>

        <!-- Motif de refus -->
        <div v-if="current.rejectionReason" class="mb-3">
          <label :class="cls.fieldLabel">Motif du refus</label>
          <div class="text-[13px] text-danger bg-danger-bg border border-danger/20 rounded-md px-2.5 py-2 mt-1">{{ current.rejectionReason }}</div>
        </div>

        <!-- Historique -->
        <FormSection v-if="current.validationHistory?.length" title="Historique de validation">
          <ValidationTimeline :history="current.validationHistory" />
        </FormSection>
      </div>
    </template>
  </CardModalShell>
</template>
