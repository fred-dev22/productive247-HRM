<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- En-tête -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Perdiems</h1>
            <p class="page-sub">Taux de per diem par catégorie d'employé</p>
          </div>
          <button class="btn btn-primary" @click="openAdd">
            <i class="ti ti-plus" aria-hidden="true"></i>
            Ajouter un taux
          </button>
        </div>

        <!-- Banner avertissement -->
        <div class="warning-banner">
          <i class="ti ti-alert-triangle warning-icon" aria-hidden="true"></i>
          <span>
            Les montants affichés sont <strong>provisoires</strong>.
            Ils doivent être validés avec la direction avant la mise en production.
          </span>
        </div>

        <!-- Table perdiems -->
        <div class="section-card">
          <table class="pd-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Taux / jour</th>
                <th>Devise</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pd in calendar.perdiemRates ?? []" :key="pd.id">
                <td class="pd-cat">{{ pd.category }}</td>
                <td class="pd-desc">{{ pd.description }}</td>
                <td class="pd-rate">{{ pd.ratePerDay.toLocaleString('fr-FR') }}</td>
                <td class="pd-currency">{{ pd.currency }}</td>
                <td>
                  <div class="actions-cell">
                    <button class="icon-btn" @click="openEdit(pd.id)">
                      <i class="ti ti-edit" aria-hidden="true"></i>
                    </button>
                    <button class="icon-btn icon-btn--danger" @click="calStore.removePerdiemRate(pd.id)">
                      <i class="ti ti-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!calendar.perdiemRates?.length">
                <td colspan="5" class="pd-empty">Aucun taux configuré</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  </div>

  <!-- Modal perdiem -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">{{ editingId ? 'Modifier le taux' : 'Nouveau taux perdiem' }}</span>
          <button class="modal-close" @click="showModal = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">Catégorie *</label>
            <input type="text" class="field-input" v-model="pdForm.category" placeholder="Ex: Cadre supérieur" />
          </div>
          <div class="field">
            <label class="field-label">Description</label>
            <input type="text" class="field-input" v-model="pdForm.description" placeholder="Ex: Direction / Cadres A — valeur provisoire" />
          </div>
          <div class="field">
            <label class="field-label">Taux / jour *</label>
            <input type="number" min="0" class="field-input" v-model.number="pdForm.ratePerDay" />
          </div>
          <div class="field">
            <label class="field-label">Devise</label>
            <select class="field-input" v-model="pdForm.currency">
              <option value="MGA">MGA (Ariary)</option>
              <option value="MUR">MUR (Roupie mauricienne)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showModal = false">Annuler</button>
          <button class="btn btn-primary" @click="savePerdiem">Enregistrer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import { useAuthStore }     from '../../stores/auth'
import { useCalendarStore } from '../../stores/calendar'

const auth      = useAuthStore()
const calStore  = useCalendarStore()
const { calendar } = storeToRefs(calStore)

const showModal  = ref(false)
const editingId  = ref<string | null>(null)
const pdForm     = reactive({ category: '', description: '', ratePerDay: 0, currency: 'MGA' })

function openAdd() {
  editingId.value      = null
  pdForm.category      = ''
  pdForm.description   = ''
  pdForm.ratePerDay    = 0
  pdForm.currency      = 'MGA'
  showModal.value      = true
}

function openEdit(id: string) {
  editingId.value = id
  const pd = (calendar.value.perdiemRates ?? []).find(r => r.id === id)
  if (pd) {
    pdForm.category    = pd.category
    pdForm.description = pd.description
    pdForm.ratePerDay  = pd.ratePerDay
    pdForm.currency    = pd.currency
  }
  showModal.value = true
}

function savePerdiem() {
  if (!pdForm.category.trim()) return
  if (editingId.value) {
    calStore.updatePerdiemRate(editingId.value, { category: pdForm.category, description: pdForm.description, ratePerDay: pdForm.ratePerDay, currency: pdForm.currency })
  } else {
    calStore.addPerdiemRate({ category: pdForm.category, description: pdForm.description, ratePerDay: pdForm.ratePerDay, currency: pdForm.currency })
  }
  showModal.value = false
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
  background: var(--color-warning-bg); border-left: 4px solid var(--color-warning);
  border-radius: 6px; padding: 12px 16px;
  font-size: 13px; color: var(--color-text); line-height: 1.5;
}
.warning-icon { color: var(--color-warning); font-size: 16px; flex-shrink: 0; }

.section-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.pd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pd-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; background: var(--color-bg); border-bottom: 0.5px solid var(--color-border); }
.pd-table td { padding: 12px 16px; border-bottom: 0.5px solid var(--color-border); }
.pd-table tbody tr:last-child td { border-bottom: none; }
.pd-table tbody tr:hover { background: var(--color-bg); }
.pd-cat      { font-weight: 600; color: var(--color-text); }
.pd-desc     { color: var(--color-text-muted); font-size: 12px; }
.pd-rate     { font-weight: 600; color: var(--color-text); }
.pd-currency { color: var(--color-text-muted); }
.pd-empty    { text-align: center; padding: 24px; color: var(--color-text-muted); font-style: italic; }

.actions-cell { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: var(--color-bg); color: var(--color-text-muted); cursor: pointer; font-size: 14px; transition: all .12s; }
.icon-btn:hover { background: var(--color-primary-light); color: var(--color-primary); }
.icon-btn--danger:hover { background: var(--color-danger-bg); color: var(--color-danger); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card    { background: var(--color-surface); border-radius: 12px; padding: 24px; max-width: 420px; width: 95%; box-shadow: 0 8px 32px rgba(0,0,0,.18); }
.modal-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-title   { font-size: 15px; font-weight: 600; color: var(--color-text); }
.modal-close   { width: 28px; height: 28px; border: none; background: var(--color-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px; }
.modal-close:hover { background: var(--color-border); }
.modal-body    { display: flex; flex-direction: column; gap: 14px; }
.modal-footer  { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 0.5px solid var(--color-border); }
.field         { display: flex; flex-direction: column; gap: 4px; }
.field-label   { font-size: 12px; font-weight: 500; color: var(--color-text); }
.field-input   { height: 38px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none; width: 100%; box-sizing: border-box; }
.field-input:focus { border-color: var(--color-primary); }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all .12s; white-space: nowrap; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
</style>
