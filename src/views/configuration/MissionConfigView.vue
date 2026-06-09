<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- En-tête -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Configuration des missions</h1>
            <p class="page-sub">Définissez les types de frais et leurs règles par catégorie d'employé</p>
          </div>
          <button class="btn btn-outline" @click="showImportToast">
            <i class="ti ti-upload" aria-hidden="true"></i>
            Importer
          </button>
        </div>

        <!-- Banner avertissement -->
        <div class="warning-banner">
          <i class="ti ti-alert-triangle warning-icon" aria-hidden="true"></i>
          <span>
            Les catégories et montants affichés sont <strong>provisoires</strong>.
            Ils doivent être validés avec la direction avant la mise en production.
          </span>
        </div>

        <!-- Toast -->
        <Transition name="toast">
          <div v-if="showToast" class="toast-notif">
            <i class="ti ti-check" aria-hidden="true"></i>
            {{ toastMsg }}
          </div>
        </Transition>

        <!-- Section 1 : Catégories d'employés -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h2 class="section-title">Catégories d'employés</h2>
              <p class="section-note">⚠️ À valider avec la direction — les catégories sont provisoires</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="showCatModal = true">
              <i class="ti ti-plus" aria-hidden="true"></i> Ajouter
            </button>
          </div>

          <DataTable :columns="catColumns" :rows="store.categories" row-key="id">
            <template #cell-actions="{ row }">
              <div class="actions-cell">
                <button class="icon-btn" title="Modifier" @click="openEditCat(row)">
                  <i class="ti ti-edit" aria-hidden="true"></i>
                </button>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Section 2 : Types de frais -->
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title">Types de frais</h2>
            <button class="btn btn-outline btn-sm" @click="openAddFee">
              <i class="ti ti-plus" aria-hidden="true"></i> Ajouter un type de frais
            </button>
          </div>

          <div class="fee-table-wrap">
            <table class="fee-table">
              <thead>
                <tr>
                  <th>Type de frais</th>
                  <th v-for="cat in store.categories" :key="cat.id">{{ cat.code }}</th>
                  <th>Justif.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ft in store.feeTypes" :key="ft.id">
                  <td>
                    <div class="fee-name">
                      <span class="fee-label">{{ ft.name }}</span>
                      <span class="fee-unit">{{ unitLabel(ft.unit) }}</span>
                    </div>
                  </td>
                  <td v-for="cat in store.categories" :key="cat.id">
                    <div class="amount-cell">
                      <template v-if="editing?.feeId === ft.id && editing?.catId === cat.id">
                        <input
                          type="number"
                          min="0"
                          class="amount-input"
                          :value="getAmount(ft.id, cat.id)"
                          @change="onAmountChange(ft.id, cat.id, $event)"
                          @blur="editing = null"
                          ref="amountInputRef"
                        />
                      </template>
                      <template v-else>
                        <span
                          v-if="getAmount(ft.id, cat.id) === 0"
                          class="badge-reel"
                          @click="startEdit(ft.id, cat.id)"
                        >Au réel</span>
                        <span
                          v-else
                          class="amount-val"
                          @click="startEdit(ft.id, cat.id)"
                        >{{ fmt(getAmount(ft.id, cat.id)) }}<span class="amount-unit">MGA/j</span></span>
                      </template>
                    </div>
                  </td>
                  <td class="center">
                    <i
                      :class="ft.requiresReceipt ? 'ti ti-check text-success' : 'ti ti-minus text-muted'"
                      aria-hidden="true"
                    ></i>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <button class="icon-btn" @click="openEditFee(ft.id)">
                        <i class="ti ti-edit" aria-hidden="true"></i>
                      </button>
                      <button class="icon-btn icon-btn--danger" @click="deleteFee(ft.id, ft.name)">
                        <i class="ti ti-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="store.feeTypes.length === 0">
                  <td :colspan="store.categories.length + 3" class="empty-cell">Aucun type de frais configuré</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="table-hint">Cliquez sur un montant pour le modifier. "Au réel" signifie remboursement sur justificatif.</p>
        </div>

      </main>
    </div>
  </div>

  <!-- Modal catégorie -->
  <Teleport to="body">
    <div v-if="showCatModal" class="modal-overlay" @click.self="showCatModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">{{ editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</span>
          <button class="modal-close" @click="showCatModal = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">Code *</label>
            <input v-model="catForm.code" class="field-input" placeholder="ex: CAT-E" />
          </div>
          <div class="field">
            <label class="field-label">Libellé *</label>
            <input v-model="catForm.label" class="field-input" placeholder="ex: Stagiaire" />
          </div>
          <div class="field">
            <label class="field-label">Description</label>
            <input v-model="catForm.description" class="field-input" placeholder="Description optionnelle..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showCatModal = false">Annuler</button>
          <button class="btn btn-primary" @click="saveCat">Enregistrer</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal type de frais -->
  <Teleport to="body">
    <div v-if="showFeeModal" class="modal-overlay" @click.self="showFeeModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">{{ editingFeeId ? 'Modifier le type de frais' : 'Nouveau type de frais' }}</span>
          <button class="modal-close" @click="showFeeModal = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">Nom *</label>
            <input v-model="feeForm.name" class="field-input" placeholder="ex: Repas" />
          </div>
          <div class="field">
            <label class="field-label">Code</label>
            <input v-model="feeForm.code" class="field-input" placeholder="ex: REPAS" />
          </div>
          <div class="field">
            <label class="field-label">Unité</label>
            <select v-model="feeForm.unit" class="field-input">
              <option value="per_day">Par jour</option>
              <option value="flat">Forfait</option>
              <option value="real">Au réel</option>
            </select>
          </div>
          <div class="toggle-row">
            <span class="field-label">Justificatif obligatoire</span>
            <label class="toggle-wrap">
              <input type="checkbox" class="toggle-input" v-model="feeForm.requiresReceipt" />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showFeeModal = false">Annuler</button>
          <button class="btn btn-primary" @click="saveFee">Enregistrer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import DataTable  from '../../components/ui/DataTable.vue'
import { useAuthStore }         from '../../stores/auth'
import { useMissionConfigStore } from '../../stores/missionConfig'
import type { EmpCategory, MissionFeeType } from '../../stores/missionConfig'

const auth  = useAuthStore()
const store = useMissionConfigStore()

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
  { key: 'label',       label: 'Libellé',     width: '180px' },
  { key: 'description', label: 'Description'                  },
  { key: 'actions',     label: 'Actions',     width: '80px', align: 'center' as const },
]

// ── Modal catégorie ──
const showCatModal = ref(false)
const editingCat   = ref<EmpCategory | null>(null)
const catForm      = reactive({ code: '', label: '', description: '' })

function openEditCat(cat: EmpCategory) {
  editingCat.value = cat
  catForm.code        = cat.code
  catForm.label       = cat.label
  catForm.description = cat.description ?? ''
  showCatModal.value  = true
}

function saveCat() {
  if (!catForm.label.trim()) return
  if (editingCat.value) {
    // update inline
    editingCat.value.label       = catForm.label
    editingCat.value.description = catForm.description
  } else {
    store.addCategory({ code: catForm.code, label: catForm.label, description: catForm.description || undefined })
  }
  showCatModal.value = false
  editingCat.value   = null
  triggerToast('Catégorie enregistrée')
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

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }

.page-header  { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title   { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub     { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }

.warning-banner {
  display: flex; align-items: flex-start; gap: 10px;
  background: var(--color-warning-bg);
  border-left: 4px solid var(--color-warning);
  border-radius: 6px; padding: 12px 16px;
  font-size: 13px; color: var(--color-text); line-height: 1.5;
}
.warning-icon { color: var(--color-warning); font-size: 16px; margin-top: 1px; flex-shrink: 0; }

.toast-notif { position: fixed; bottom: 24px; right: 24px; background: var(--color-success); color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; z-index: 2000; box-shadow: 0 4px 16px rgba(0,0,0,.16); }
.toast-enter-active, .toast-leave-active { transition: all .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

.section-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.section-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 16px 20px 0; gap: 12px; }
.section-title  { font-size: 15px; font-weight: 600; color: var(--color-text); }
.section-note   { font-size: 11px; color: var(--color-warning); margin-top: 2px; }

.fee-table-wrap { overflow-x: auto; padding: 0 0 4px; }
.fee-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px; }
.fee-table th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; background: var(--color-bg); border-bottom: 0.5px solid var(--color-border); white-space: nowrap; }
.fee-table td { padding: 10px 12px; border-bottom: 0.5px solid var(--color-border); }
.fee-table tbody tr:last-child td { border-bottom: none; }
.fee-table tbody tr:hover { background: var(--color-bg); }

.fee-name { display: flex; flex-direction: column; gap: 2px; }
.fee-label { font-weight: 500; color: var(--color-text); }
.fee-unit  { font-size: 11px; color: var(--color-text-muted); }

.amount-cell { display: flex; align-items: center; gap: 4px; }
.badge-reel { font-size: 11px; font-weight: 600; background: var(--color-info-bg); color: var(--color-info); border-radius: 4px; padding: 2px 7px; cursor: pointer; white-space: nowrap; }
.badge-reel:hover { opacity: .75; }
.amount-val { font-size: 13px; font-weight: 500; color: var(--color-text); cursor: pointer; white-space: nowrap; }
.amount-val:hover { color: var(--color-primary); }
.amount-unit { font-size: 10px; color: var(--color-text-muted); margin-left: 2px; }
.amount-input { width: 90px; height: 28px; padding: 0 6px; border: 1px solid var(--color-primary); border-radius: 4px; font-size: 13px; background: var(--color-surface); outline: none; }

.center { text-align: center; }
.text-success { color: var(--color-success); }
.text-muted   { color: var(--color-text-muted); }
.actions-cell { display: flex; gap: 4px; justify-content: center; }
.empty-cell { text-align: center; padding: 24px; color: var(--color-text-muted); font-style: italic; }
.table-hint { font-size: 11px; color: var(--color-text-muted); padding: 8px 16px 12px; }

.icon-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: var(--color-bg); color: var(--color-text-muted); cursor: pointer; font-size: 14px; transition: all .12s; }
.icon-btn:hover { background: var(--color-primary-light); color: var(--color-primary); }
.icon-btn--danger:hover { background: var(--color-danger-bg); color: var(--color-danger); }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card    { background: var(--color-surface); border-radius: 12px; padding: 24px; max-width: 440px; width: 95%; box-shadow: 0 8px 32px rgba(0,0,0,.18); }
.modal-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-title   { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-close   { width: 28px; height: 28px; border: none; background: var(--color-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px; }
.modal-close:hover { background: var(--color-border); }
.modal-body    { display: flex; flex-direction: column; gap: 14px; }
.modal-footer  { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 0.5px solid var(--color-border); }

.field       { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-input { height: 38px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none; width: 100%; box-sizing: border-box; }
.field-input:focus { border-color: var(--color-primary); }

.toggle-row  { display: flex; align-items: center; justify-content: space-between; }
.toggle-wrap { position: relative; display: inline-flex; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track { width: 36px; height: 20px; background: var(--color-border-strong); border-radius: 10px; position: relative; cursor: pointer; transition: background .2s; }
.toggle-input:checked + .toggle-track { background: var(--color-primary); }
.toggle-thumb { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: left .2s; }
.toggle-input:checked + .toggle-track .toggle-thumb { left: 19px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all .12s; white-space: nowrap; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
</style>
