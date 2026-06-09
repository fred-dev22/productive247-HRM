<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- En-tête -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Types d'absence</h1>
            <p class="page-sub">Configurez les types d'absence et leurs règles</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline" @click="showImportToast">
              <i class="ti ti-upload" aria-hidden="true"></i>
              Importer
            </button>
            <button class="btn btn-primary" @click="openAdd">
              <i class="ti ti-plus" aria-hidden="true"></i>
              Ajouter un type
            </button>
          </div>
        </div>

        <!-- Toast -->
        <Transition name="toast">
          <div v-if="showToast" class="toast-notif">
            <i class="ti ti-info-circle" aria-hidden="true"></i>
            {{ toastMsg }}
          </div>
        </Transition>

        <!-- Table -->
        <div class="table-card">
          <DataTable :columns="columns" :rows="store.leaveTypes" row-key="id" empty-message="Aucun type configuré">

            <template #cell-name="{ row }">
              <div class="type-name-cell">
                <span class="type-dot" :style="{ background: row.color }">
                  <i :class="`ti ${row.icon}`" aria-hidden="true"></i>
                </span>
                <span class="type-name">{{ row.name }}</span>
                <span v-if="row.isSystem" class="badge-system" title="Type système">
                  <i class="ti ti-lock" aria-hidden="true"></i>
                </span>
              </div>
            </template>

            <template #cell-code="{ row }">
              <code class="type-code">{{ row.code }}</code>
            </template>

            <template #cell-daysPerYear="{ row }">
              {{ row.daysPerYear > 0 ? `${row.daysPerYear} j/an` : 'Illimité' }}
            </template>

            <template #cell-workflow="{ row }">
              <span class="badge-workflow" :class="`badge-workflow--${row.workflow}`">
                {{ row.workflow === 'standard' ? 'Standard' : 'Médical' }}
              </span>
            </template>

            <template #cell-requiresDocument="{ row }">
              <i
                :class="row.requiresDocument ? 'ti ti-check text-success' : 'ti ti-minus text-muted'"
                aria-hidden="true"
              ></i>
            </template>

            <template #cell-isActive="{ row }">
              <label class="toggle-wrap" :title="row.isSystem ? 'Type système — toujours actif' : ''">
                <input
                  type="checkbox"
                  class="toggle-input"
                  :checked="row.isActive"
                  :disabled="row.isSystem"
                  @change="store.toggleLeaveType(row.id)"
                />
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
              </label>
            </template>

            <template #cell-actions="{ row }">
              <div class="actions-cell">
                <button class="icon-btn" title="Modifier" @click="openEdit(row.id)">
                  <i class="ti ti-edit" aria-hidden="true"></i>
                </button>
                <button
                  v-if="!row.isSystem"
                  class="icon-btn icon-btn--danger"
                  title="Supprimer"
                  @click="confirmDelete(row.id, row.name)"
                >
                  <i class="ti ti-trash" aria-hidden="true"></i>
                </button>
                <span v-else class="lock-icon" title="Type système non supprimable">
                  <i class="ti ti-lock" aria-hidden="true"></i>
                </span>
              </div>
            </template>

          </DataTable>
        </div>

      </main>
    </div>
  </div>

  <LeaveTypeFormModal
    v-model="showModal"
    :edit-id="editId"
    @saved="onSaved"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import DataTable  from '../../components/ui/DataTable.vue'
import LeaveTypeFormModal from '../../components/configuration/LeaveTypeFormModal.vue'
import { useAuthStore }       from '../../stores/auth'
import { useLeaveTypesStore } from '../../stores/leaveTypes'

const auth  = useAuthStore()
const store = useLeaveTypesStore()

const showModal = ref(false)
const editId    = ref<string | undefined>(undefined)
const showToast = ref(false)
const toastMsg  = ref('')

const columns = [
  { key: 'name',             label: 'Nom',            width: '220px' },
  { key: 'code',             label: 'Code',           width: '110px' },
  { key: 'daysPerYear',      label: 'Jours/an',       width: '100px' },
  { key: 'noticeDays',       label: 'Préavis (j)',    width: '90px'  },
  { key: 'requiresDocument', label: 'Justificatif',   width: '110px', align: 'center' as const },
  { key: 'workflow',         label: 'Workflow',        width: '120px' },
  { key: 'isActive',         label: 'Actif',           width: '70px',  align: 'center' as const },
  { key: 'actions',          label: 'Actions',         width: '100px', align: 'center' as const },
]

function triggerToast(msg: string) {
  toastMsg.value  = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

function showImportToast() {
  triggerToast('Import CSV disponible prochainement. Format attendu : Nom, Code, Jours/an, Préavis, Justificatif (oui/non)')
}

function openAdd() {
  editId.value    = undefined
  showModal.value = true
}

function openEdit(id: string) {
  editId.value    = id
  showModal.value = true
}

function confirmDelete(id: string, name: string) {
  if (confirm(`Supprimer le type « ${name} » ?`)) {
    store.deleteLeaveType(id)
    triggerToast(`Type « ${name} » supprimé`)
  }
}

function onSaved() {
  triggerToast('Type d\'absence enregistré')
}
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header  { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.page-title   { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub     { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; }

.toast-notif { position: fixed; bottom: 24px; right: 24px; background: var(--color-primary); color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; z-index: 2000; box-shadow: 0 4px 16px rgba(0,0,0,.16); max-width: 420px; }
.toast-enter-active, .toast-leave-active { transition: all .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

.table-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; overflow: hidden; }

.type-name-cell { display: flex; align-items: center; gap: 8px; }
.type-dot {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.type-dot i { color: #fff; font-size: 13px; }
.type-name  { font-size: 13px; font-weight: 500; color: var(--color-text); }
.badge-system { color: var(--color-text-muted); font-size: 12px; }

.type-code { font-size: 11px; font-weight: 700; font-family: monospace; background: var(--color-bg); border: 0.5px solid var(--color-border); border-radius: 4px; padding: 2px 6px; color: var(--color-text-muted); }

.badge-workflow {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 600;
  border-radius: 20px; padding: 2px 8px;
}
.badge-workflow--standard { background: var(--color-primary-light); color: var(--color-primary); }
.badge-workflow--medical  { background: var(--color-danger-bg);     color: var(--color-danger);  }

.text-success { color: var(--color-success); }
.text-muted   { color: var(--color-text-muted); }

.toggle-wrap  { position: relative; display: inline-flex; align-items: center; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track { width: 32px; height: 18px; background: var(--color-border-strong); border-radius: 9px; position: relative; cursor: pointer; transition: background .2s; }
.toggle-input:checked + .toggle-track { background: var(--color-primary); }
.toggle-input:disabled + .toggle-track { opacity: .5; cursor: not-allowed; }
.toggle-thumb { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
.toggle-input:checked + .toggle-track .toggle-thumb { left: 16px; }

.actions-cell { display: flex; gap: 4px; align-items: center; justify-content: center; }
.icon-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: var(--color-bg); color: var(--color-text-muted); cursor: pointer; font-size: 14px; transition: all .12s; }
.icon-btn:hover { background: var(--color-primary-light); color: var(--color-primary); }
.icon-btn--danger:hover { background: var(--color-danger-bg); color: var(--color-danger); }
.lock-icon { font-size: 14px; color: var(--color-text-muted); padding: 0 4px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all .12s; white-space: nowrap; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
</style>
