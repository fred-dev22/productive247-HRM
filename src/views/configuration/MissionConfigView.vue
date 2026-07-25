<template>
  <div class="px-7 py-6 flex flex-col gap-4">

        <!-- En-tête -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 class="text-xl font-bold text-foreground">Configuration des missions</h1>
            <p class="text-[13px] text-muted-foreground mt-0.5">Définissez les types de frais et leurs règles par catégorie d'employé</p>
          </div>
          <button :class="L.btnOutline" @click="showImportToast">
            <Upload class="w-4 h-4" />
            Importer
          </button>
        </div>

        <!-- Banner avertissement -->
        <div class="flex items-start gap-2.5 bg-warning-bg border-l-4 border-warning rounded-md px-4 py-3 text-[13px] text-foreground leading-relaxed">
          <TriangleAlert class="w-4 h-4 text-warning shrink-0 mt-px" />
          <span>
            Les catégories et montants affichés sont <strong>provisoires</strong>.
            Ils doivent être validés avec la direction avant la mise en production.
          </span>
        </div>

        <!-- Toast (bouton Importer uniquement — les autres actions passent par le toast global) -->
        <div v-if="showToast" class="fixed bottom-6 right-6 bg-success text-white px-5 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 z-[2000] shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
          <Check class="w-4 h-4" />
          {{ toastMsg }}
        </div>

        <SkeletonLoader v-if="initialLoading" type="table" :lines="6" />
        <template v-else>

        <!-- Section 1 : Catégories d'employés -->
        <div :class="L.tableCard">
          <div class="flex items-start justify-between px-5 pt-4 gap-3">
            <div>
              <h2 class="text-[15px] font-semibold text-foreground">Catégories d'employés</h2>
              <p class="text-[11px] text-warning mt-0.5">⚠️ À valider avec la direction — les catégories sont provisoires</p>
            </div>
            <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="showCatModal = true">
              <Plus class="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          <DataTable :columns="catColumns" :rows="store.categories" row-key="id">
            <template #cell-actions="{ row }">
              <div class="flex gap-1 justify-center">
                <button :class="iconBtn" title="Modifier" @click="openEditCat(row)">
                  <Pencil class="w-3.5 h-3.5" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Section 2 : Types de frais -->
        <div :class="L.tableCard">
          <div class="flex items-start justify-between px-5 pt-4 gap-3 flex-wrap">
            <h2 class="text-[15px] font-semibold text-foreground">Types de frais</h2>
            <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="openAddFee">
              <Plus class="w-3.5 h-3.5" /> Ajouter un type de frais
            </button>
          </div>

          <div class="flex items-center gap-2 px-5 pt-3">
            <span class="text-[12px] font-medium text-muted-foreground">Catégorie de mission :</span>
            <div class="flex rounded-md border border-border overflow-hidden">
              <button
                v-for="mc in MISSION_CATEGORIES"
                :key="mc"
                :class="[
                  'px-3 py-1.5 text-[12px] font-medium transition-colors',
                  selectedMissionCategory === mc ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-background',
                ]"
                @click="selectedMissionCategory = mc"
              >{{ MISSION_CATEGORY_LABELS[mc] }}</button>
            </div>
          </div>

          <div class="overflow-x-auto pb-1">
            <table class="w-full border-collapse text-[13px] min-w-[700px]">
              <thead>
                <tr>
                  <th :class="thUpper">Type de frais</th>
                  <th v-for="cat in store.categories" :key="cat.id" :class="thUpper">{{ cat.code }}</th>
                  <th :class="thUpper">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ft in store.expenseTypes" :key="ft.id" class="hover:bg-background">
                  <td :class="tdCell">
                    <div class="flex flex-col gap-0.5">
                      <span class="font-medium text-foreground">{{ ft.name }}</span>
                      <span class="text-[11px] text-muted-foreground">{{ unitLabel(ft.unit) }}</span>
                    </div>
                  </td>
                  <td v-for="cat in store.categories" :key="cat.id" :class="tdCell">
                    <div class="flex items-center gap-1.5">
                      <template v-if="editing?.feeId === ft.id && editing?.catId === cat.id">
                        <input
                          type="number"
                          min="0"
                          class="w-[90px] h-7 px-1.5 border border-primary rounded text-[13px] bg-card outline-none"
                          :value="getAmount(ft.id, cat.id)"
                          @change="onAmountChange(ft.id, cat.id, $event)"
                          @blur="editing = null"
                          ref="amountInputRef"
                        />
                      </template>
                      <template v-else>
                        <span
                          v-if="getAmount(ft.id, cat.id) === 0"
                          class="text-[11px] font-semibold bg-info-bg text-info rounded px-[7px] py-0.5 cursor-pointer whitespace-nowrap hover:opacity-75"
                          @click="startEdit(ft.id, cat.id)"
                        >Au réel</span>
                        <span
                          v-else
                          class="text-[13px] font-medium text-foreground cursor-pointer whitespace-nowrap hover:text-primary"
                          @click="startEdit(ft.id, cat.id)"
                        >{{ fmt(getAmount(ft.id, cat.id)) }}<span class="text-[10px] text-muted-foreground ml-0.5">{{ getCurrency(ft.id, cat.id) }}</span></span>
                      </template>
                      <button
                        :class="[
                          'w-5 h-5 flex items-center justify-center rounded shrink-0 transition-colors',
                          isDocRequired(ft.id, cat.id) ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-background',
                        ]"
                        :title="isDocRequired(ft.id, cat.id) ? 'Justificatif requis — cliquer pour désactiver' : 'Justificatif non requis — cliquer pour activer'"
                        @click="toggleDocRequired(ft.id, cat.id)"
                      >
                        <Paperclip class="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td :class="tdCell">
                    <div class="flex gap-1 justify-center">
                      <button :class="iconBtn" @click="openEditFee(ft.id)">
                        <Pencil class="w-3.5 h-3.5" />
                      </button>
                      <button :class="[iconBtn, 'hover:!bg-danger-bg hover:!text-danger']" @click="deleteFee(ft.id, ft.name)">
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="store.expenseTypes.length === 0">
                  <td :colspan="store.categories.length + 2" class="text-center p-6 text-muted-foreground italic">Aucun type de frais configuré</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground px-4 pt-2 pb-3">
            Cliquez sur un montant pour le modifier. "Au réel" signifie remboursement sur justificatif.
            <Paperclip class="w-3 h-3 inline-block text-primary" /> indique un justificatif obligatoire pour cette case.
          </p>
        </div>

        </template>

  </div>

  <!-- Modal catégorie -->
  <CreateModalShell
    v-if="showCatModal"
    :title="editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'"
    :banner-label="editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'"
    :create-label="editingCat ? 'Enregistrer' : 'Ajouter'"
    :save-error="catError"
    @close="showCatModal = false"
    @create="saveCat"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-md mx-auto">
          <FormSection title="Informations générales">
            <div class="flex flex-col gap-3.5">
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Code *</label>
                <input v-model="catForm.code" :class="cls.fieldInput" placeholder="ex: CAT-E" @input="catForm.code = catForm.code.toUpperCase()" />
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Libellé *</label>
                <input v-model="catForm.name" :class="cls.fieldInput" placeholder="ex: Stagiaire" />
              </div>
            </div>
          </FormSection>
        </div>
      </div>
    </template>
  </CreateModalShell>

  <!-- Modal type de frais -->
  <CreateModalShell
    v-if="showFeeModal"
    :title="editingFeeId ? 'Modifier le type de frais' : 'Nouveau type de frais'"
    :banner-label="editingFeeId ? 'Modifier le type de frais' : 'Nouveau type de frais'"
    :create-label="editingFeeId ? 'Enregistrer' : 'Ajouter'"
    :save-error="feeError"
    @close="showFeeModal = false"
    @create="saveFee"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-md mx-auto">
          <FormSection title="Informations générales">
            <div class="flex flex-col gap-3.5">
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Nom *</label>
                <input v-model="feeForm.name" :class="cls.fieldInput" placeholder="ex: Repas" />
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Code</label>
                <input v-model="feeForm.code" :class="cls.fieldInput" placeholder="ex: REPAS" @input="feeForm.code = feeForm.code.toUpperCase()" />
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Unité</label>
                <select v-model="feeForm.unit" :class="cls.fieldSelect">
                  <option value="PerDay">Par jour</option>
                  <option value="PerTrip">Forfait (par mission)</option>
                  <option value="PerItem">Par unité</option>
                </select>
              </div>
            </div>
          </FormSection>
          <p class="text-[11px] text-muted-foreground mt-3">
            Le taux et le justificatif requis se configurent ensuite directement dans la grille, pour chaque catégorie d'employé et chaque catégorie de mission.
          </p>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { Upload, TriangleAlert, Check, Plus, Pencil, Trash2, Paperclip } from 'lucide-vue-next'
import DataTable  from '../../components/ui/DataTable.vue'
import CreateModalShell from '../../components/shared/CreateModalShell.vue'
import FormSection from '../../components/ui/form-field/FormSection.vue'
import { SkeletonLoader } from '../../components'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useMissionConfigStore } from '../../stores/missionConfig'
import type { EmpCategory, ExpenseUnit, MissionCategory } from '../../stores/missionConfig'

const store = useMissionConfigStore()

const initialLoading = ref(true)
;(async () => {
  await Promise.all([
    store.categories.length === 0 ? store.fetchCategories() : Promise.resolve(),
    store.expenseTypes.length === 0 ? store.fetchExpenseTypes() : Promise.resolve(),
    store.configs.length === 0 ? store.fetchConfigs() : Promise.resolve(),
  ])
  initialLoading.value = false
})()

// ── Classes du design system ─────────────────────────────────
const thUpper = 'px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border whitespace-nowrap'
const tdCell = 'px-3 py-2.5 border-b border-border'
const iconBtn = 'w-7 h-7 flex items-center justify-center border-0 rounded-md bg-background text-muted-foreground cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary'

const showToast = ref(false)
const toastMsg  = ref('')
const amountInputRef = ref<HTMLInputElement | null>(null)

function showImportToast() {
  toastMsg.value  = 'Import disponible prochainement'
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}

function fmt(n: number): string { return n.toLocaleString('fr-FR') }
function unitLabel(unit: ExpenseUnit): string {
  return unit === 'PerDay' ? '/jour' : unit === 'PerTrip' ? 'forfait mission' : 'par unité'
}

// ── Catégorie de mission (3e dimension de la matrice ExpenseConfig) ──
const MISSION_CATEGORIES: MissionCategory[] = ['Local', 'National', 'International']
const MISSION_CATEGORY_LABELS: Record<MissionCategory, string> = {
  Local: 'Locale', National: 'Nationale', International: 'Internationale',
}
const selectedMissionCategory = ref<MissionCategory>('Local')

// ── Table catégories ──
const catColumns = [
  { key: 'code',        label: 'Code',        width: '100px' },
  { key: 'name',        label: 'Libellé',     width: '180px' },
  { key: 'actions',     label: 'Actions',     width: '80px', align: 'center' as const },
]

// ── Modal catégorie ──
const showCatModal = ref(false)
const editingCat   = ref<EmpCategory | null>(null)
const catError     = ref('')
const catForm      = reactive({ code: '', name: '' })

function openEditCat(cat: EmpCategory) {
  editingCat.value = cat
  catError.value      = ''
  catForm.code        = cat.code
  catForm.name        = cat.name
  showCatModal.value  = true
}

async function saveCat() {
  if (!catForm.code.trim() || !catForm.name.trim()) { catError.value = 'Code et libellé sont obligatoires'; return }
  catError.value = ''
  try {
    if (editingCat.value) {
      await store.updateCategory(editingCat.value.id, { code: catForm.code, name: catForm.name })
    } else {
      await store.addCategory({ code: catForm.code, name: catForm.name })
    }
    showCatModal.value = false
    editingCat.value   = null
  } catch {
    catError.value = store.error ?? "L'enregistrement a échoué. Veuillez réessayer."
  }
}

// ── Montants + justificatif inline (grille 3D) ──
const editing = ref<{ feeId: string; catId: string } | null>(null)

function getAmount(feeId: string, catId: string): number {
  return store.getConfig(feeId, catId, selectedMissionCategory.value)?.dailyRate ?? 0
}
function getCurrency(feeId: string, catId: string): string {
  return store.getConfig(feeId, catId, selectedMissionCategory.value)?.currency ?? 'MGA'
}
function isDocRequired(feeId: string, catId: string): boolean {
  return store.getConfig(feeId, catId, selectedMissionCategory.value)?.documentRequired ?? false
}

function startEdit(feeId: string, catId: string) {
  editing.value = { feeId, catId }
  nextTick(() => amountInputRef.value?.focus())
}

function onAmountChange(feeId: string, catId: string, event: Event) {
  const val = Number((event.target as HTMLInputElement).value)
  store.upsertConfig(feeId, catId, selectedMissionCategory.value, { dailyRate: val })
}

function toggleDocRequired(feeId: string, catId: string) {
  store.upsertConfig(feeId, catId, selectedMissionCategory.value, { documentRequired: !isDocRequired(feeId, catId) })
}

// ── Modal type de frais ──
const showFeeModal  = ref(false)
const editingFeeId  = ref<string | null>(null)
const feeError      = ref('')
const feeForm       = reactive({ name: '', code: '', unit: 'PerDay' as ExpenseUnit })

function openAddFee() {
  editingFeeId.value  = null
  feeError.value      = ''
  feeForm.name        = ''
  feeForm.code        = ''
  feeForm.unit        = 'PerDay'
  showFeeModal.value  = true
}

function openEditFee(id: string) {
  const ft = store.expenseTypes.find(f => f.id === id)
  if (!ft) return
  editingFeeId.value = id
  feeError.value     = ''
  feeForm.name       = ft.name
  feeForm.code       = ft.code
  feeForm.unit       = ft.unit
  showFeeModal.value = true
}

async function saveFee() {
  if (!feeForm.name.trim()) { feeError.value = 'Le nom est obligatoire'; return }
  feeError.value = ''
  try {
    if (editingFeeId.value) {
      await store.updateExpenseType(editingFeeId.value, { name: feeForm.name, code: feeForm.code, unit: feeForm.unit })
    } else {
      await store.addExpenseType({ name: feeForm.name, code: feeForm.code, unit: feeForm.unit })
    }
    showFeeModal.value = false
  } catch {
    feeError.value = store.error ?? "L'enregistrement a échoué. Veuillez réessayer."
  }
}

async function deleteFee(id: string, name: string) {
  if (!confirm(`Supprimer le type de frais « ${name} » ?`)) return
  try {
    await store.deleteExpenseType(id)
  } catch {
    // store.error porte le message pour l'UI (toast)
  }
}
</script>
