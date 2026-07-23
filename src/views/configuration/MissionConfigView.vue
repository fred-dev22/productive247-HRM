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

        <!-- Toast -->
        <div v-if="showToast" class="fixed bottom-6 right-6 bg-success text-white px-5 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 z-[2000] shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
          <Check class="w-4 h-4" />
          {{ toastMsg }}
        </div>

        <!-- Section 1 : Catégories d'employés -->
        <SkeletonLoader v-if="store.loading" type="table" :lines="4" />
        <div v-else :class="L.tableCard">
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
          <div class="flex items-start justify-between px-5 pt-4 gap-3">
            <h2 class="text-[15px] font-semibold text-foreground">Types de frais</h2>
            <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="openAddFee">
              <Plus class="w-3.5 h-3.5" /> Ajouter un type de frais
            </button>
          </div>

          <div class="overflow-x-auto pb-1">
            <table class="w-full border-collapse text-[13px] min-w-[700px]">
              <thead>
                <tr>
                  <th :class="thUpper">Type de frais</th>
                  <th v-for="cat in store.categories" :key="cat.id" :class="thUpper">{{ cat.code }}</th>
                  <th :class="thUpper">Justif.</th>
                  <th :class="thUpper">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ft in store.feeTypes" :key="ft.id" class="hover:bg-background">
                  <td :class="tdCell">
                    <div class="flex flex-col gap-0.5">
                      <span class="font-medium text-foreground">{{ ft.name }}</span>
                      <span class="text-[11px] text-muted-foreground">{{ unitLabel(ft.unit) }}</span>
                    </div>
                  </td>
                  <td v-for="cat in store.categories" :key="cat.id" :class="tdCell">
                    <div class="flex items-center gap-1">
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
                        >{{ fmt(getAmount(ft.id, cat.id)) }}<span class="text-[10px] text-muted-foreground ml-0.5">MGA/j</span></span>
                      </template>
                    </div>
                  </td>
                  <td :class="[tdCell, 'text-center']">
                    <Check v-if="ft.requiresReceipt" class="w-4 h-4 text-success inline-block" />
                    <Minus v-else class="w-4 h-4 text-muted-foreground inline-block" />
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
                <tr v-if="store.feeTypes.length === 0">
                  <td :colspan="store.categories.length + 3" class="text-center p-6 text-muted-foreground italic">Aucun type de frais configuré</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground px-4 pt-2 pb-3">Cliquez sur un montant pour le modifier. "Au réel" signifie remboursement sur justificatif.</p>
        </div>

  </div>

  <!-- Modal catégorie -->
  <ModalShell :open="showCatModal" :title="editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'" max-width="max-w-[440px]" @close="showCatModal = false">
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Code *</label>
      <input v-model="catForm.code" :class="cls.fieldInput" placeholder="ex: CAT-E" />
    </div>
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Libellé *</label>
      <input v-model="catForm.name" :class="cls.fieldInput" placeholder="ex: Stagiaire" />
    </div>
    <template #footer>
      <button :class="cls.btnOutline" @click="showCatModal = false">Annuler</button>
      <button :class="cls.btnPrimary" @click="saveCat">Enregistrer</button>
    </template>
  </ModalShell>

  <!-- Modal type de frais -->
  <ModalShell :open="showFeeModal" :title="editingFeeId ? 'Modifier le type de frais' : 'Nouveau type de frais'" max-width="max-w-[440px]" @close="showFeeModal = false">
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Nom *</label>
      <input v-model="feeForm.name" :class="cls.fieldInput" placeholder="ex: Repas" />
    </div>
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Code</label>
      <input v-model="feeForm.code" :class="cls.fieldInput" placeholder="ex: REPAS" />
    </div>
    <div :class="cls.field">
      <label :class="cls.fieldLabel">Unité</label>
      <select v-model="feeForm.unit" :class="cls.fieldSelect">
        <option value="per_day">Par jour</option>
        <option value="flat">Forfait</option>
        <option value="real">Au réel</option>
      </select>
    </div>
    <div class="flex items-center justify-between">
      <span :class="cls.fieldLabel">Justificatif obligatoire</span>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" class="sr-only peer" v-model="feeForm.requiresReceipt" />
        <span class="w-9 h-5 rounded-full bg-foreground/20 transition-colors peer-checked:bg-primary relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:transition-all peer-checked:after:left-[19px]"></span>
      </label>
    </div>
    <template #footer>
      <button :class="cls.btnOutline" @click="showFeeModal = false">Annuler</button>
      <button :class="cls.btnPrimary" @click="saveFee">Enregistrer</button>
    </template>
  </ModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { Upload, TriangleAlert, Check, Plus, Pencil, Trash2, Minus } from 'lucide-vue-next'
import DataTable  from '../../components/ui/DataTable.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import { SkeletonLoader } from '../../components'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useAuthStore }         from '../../stores/auth'
import { useMissionConfigStore } from '../../stores/missionConfig'
import type { EmpCategory, MissionFeeType } from '../../stores/missionConfig'

const auth  = useAuthStore()
const store = useMissionConfigStore()
if (store.categories.length === 0) store.fetchCategories()

// ── Classes du design system ─────────────────────────────────
const thUpper = 'px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border whitespace-nowrap'
const tdCell = 'px-3 py-2.5 border-b border-border'
const iconBtn = 'w-7 h-7 flex items-center justify-center border-0 rounded-md bg-background text-muted-foreground cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary'

const showToast = ref(false)
const toastMsg  = ref('')
const amountInputRef = ref<HTMLInputElement | null>(null)

function triggerToast(msg: string) {
  toastMsg.value  = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}

function showImportToast() {
  triggerToast('Import disponible prochainement')
}

function fmt(n: number): string { return n.toLocaleString('fr-FR') }
function unitLabel(unit: string): string {
  return unit === 'per_day' ? '/jour' : unit === 'flat' ? 'forfait' : 'au réel'
}

// ── Table catégories ──
const catColumns = [
  { key: 'code',        label: 'Code',        width: '100px' },
  { key: 'name',        label: 'Libellé',     width: '180px' },
  { key: 'actions',     label: 'Actions',     width: '80px', align: 'center' as const },
]

// ── Modal catégorie ──
const showCatModal = ref(false)
const editingCat   = ref<EmpCategory | null>(null)
const catForm      = reactive({ code: '', name: '' })

function openEditCat(cat: EmpCategory) {
  editingCat.value = cat
  catForm.code        = cat.code
  catForm.name        = cat.name
  showCatModal.value  = true
}

async function saveCat() {
  if (!catForm.name.trim()) return
  try {
    if (editingCat.value) {
      await store.updateCategory(editingCat.value.id, { code: catForm.code, name: catForm.name })
    } else {
      await store.addCategory({ code: catForm.code, name: catForm.name })
    }
    showCatModal.value = false
    editingCat.value   = null
    triggerToast('Catégorie enregistrée')
  } catch {
    // store.error porte le message pour l'UI
  }
}

// ── Montants inline ──
const editing = ref<{ feeId: string; catId: string } | null>(null)

function getAmount(feeId: string, catId: string): number {
  const ft = store.feeTypes.find(f => f.id === feeId)
  return ft?.rules.find(r => r.categoryId === catId)?.amount ?? 0
}

function startEdit(feeId: string, catId: string) {
  editing.value = { feeId, catId }
  nextTick(() => amountInputRef.value?.focus())
}

function onAmountChange(feeId: string, catId: string, event: Event) {
  const val = Number((event.target as HTMLInputElement).value)
  store.updateFeeRule(feeId, catId, val)
}

// ── Modal type de frais ──
const showFeeModal  = ref(false)
const editingFeeId  = ref<string | null>(null)
const feeForm       = reactive({ name: '', code: '', unit: 'per_day' as MissionFeeType['unit'], requiresReceipt: false })

function openAddFee() {
  editingFeeId.value  = null
  feeForm.name        = ''
  feeForm.code        = ''
  feeForm.unit        = 'per_day'
  feeForm.requiresReceipt = false
  showFeeModal.value  = true
}

function openEditFee(id: string) {
  const ft = store.feeTypes.find(f => f.id === id)
  if (!ft) return
  editingFeeId.value      = id
  feeForm.name            = ft.name
  feeForm.code            = ft.code
  feeForm.unit            = ft.unit
  feeForm.requiresReceipt = ft.requiresReceipt
  showFeeModal.value      = true
}

function saveFee() {
  if (!feeForm.name.trim()) return
  if (editingFeeId.value) {
    store.updateFeeType(editingFeeId.value, {
      name: feeForm.name, code: feeForm.code,
      unit: feeForm.unit, requiresReceipt: feeForm.requiresReceipt,
    })
  } else {
    store.addFeeType({
      name: feeForm.name, code: feeForm.code, unit: feeForm.unit,
      requiresReceipt: feeForm.requiresReceipt, isActive: true,
      rules: store.categories.map(c => ({ categoryId: c.id, amount: 0, currency: 'MGA' })),
    })
  }
  showFeeModal.value = false
  triggerToast('Type de frais enregistré')
}

function deleteFee(id: string, name: string) {
  if (confirm(`Supprimer le type de frais « ${name} » ?`)) {
    store.deleteFeeType(id)
    triggerToast(`Type « ${name} » supprimé`)
  }
}
</script>
