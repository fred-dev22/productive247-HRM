<template>
  <div class="px-7 py-6">

        <!-- En-tête -->
        <div class="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 class="text-xl font-bold text-foreground">Types d'absence</h1>
            <p class="text-[13px] text-muted-foreground mt-0.5">Configurez les types d'absence et leurs règles</p>
          </div>
          <div class="flex gap-2">
            <button :class="L.btnOutline" @click="showImportToast">
              <Upload class="w-4 h-4" />
              Importer
            </button>
            <button :class="L.btnPrimary" @click="openAdd">
              <Plus class="w-4 h-4" />
              Ajouter un type
            </button>
          </div>
        </div>

        <!-- Toast -->
        <div v-if="showToast" class="fixed bottom-6 right-6 bg-primary text-white px-5 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 z-[2000] shadow-[0_4px_16px_rgba(0,0,0,0.16)] max-w-md">
          <Info class="w-[15px] h-[15px] shrink-0" />
          {{ toastMsg }}
        </div>

        <!-- Table -->
        <DataTable :columns="columns" :rows="store.leaveTypes" row-key="id" empty-message="Aucun type configuré">

          <template #cell-name="{ row }">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-md flex items-center justify-center shrink-0" :style="{ background: row.color }">
                <i :class="`ti ${row.icon}`" class="text-white text-[13px]" aria-hidden="true"></i>
              </span>
              <span class="text-[13px] font-medium text-foreground">{{ row.name }}</span>
              <Lock v-if="row.isSystem" class="w-3 h-3 text-muted-foreground" title="Type système" />
            </div>
          </template>

          <template #cell-code="{ row }">
            <code class="text-[11px] font-bold font-mono bg-background border border-border rounded px-1.5 py-0.5 text-muted-foreground">{{ row.code }}</code>
          </template>

          <template #cell-daysPerYear="{ row }">
            {{ row.daysPerYear > 0 ? `${row.daysPerYear} j/an` : 'Illimité' }}
          </template>

          <template #cell-workflow="{ row }">
            <span class="inline-flex items-center text-[11px] font-semibold rounded-full px-2 py-0.5"
              :class="row.workflow === 'standard' ? 'bg-primary/10 text-primary' : 'bg-danger-bg text-danger'">
              {{ row.workflow === 'standard' ? 'Standard' : 'Médical' }}
            </span>
          </template>

          <template #cell-requiresDocument="{ row }">
            <Check v-if="row.requiresDocument" class="w-4 h-4 text-success inline-block" />
            <Minus v-else class="w-4 h-4 text-muted-foreground inline-block" />
          </template>

          <template #cell-isActive="{ row }">
            <label class="relative inline-flex items-center cursor-pointer" :title="row.isSystem ? 'Type système — toujours actif' : ''">
              <input type="checkbox" class="sr-only peer" :checked="row.isActive" :disabled="row.isSystem" @change="store.toggleLeaveType(row.id)" />
              <span :class="toggleTrack"></span>
            </label>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex gap-1 items-center justify-center">
              <button :class="iconBtn" title="Modifier" @click="openEdit(row.id)">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button v-if="!row.isSystem" :class="[iconBtn, 'hover:!bg-danger-bg hover:!text-danger']" title="Supprimer" @click="confirmDelete(row.id, row.name)">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
              <span v-else class="text-muted-foreground px-1" title="Type système non supprimable">
                <Lock class="w-3.5 h-3.5" />
              </span>
            </div>
          </template>

        </DataTable>

  </div>

  <LeaveTypeFormModal
    v-model="showModal"
    :edit-id="editId"
    @saved="onSaved"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Plus, Info, Lock, Check, Minus, Pencil, Trash2 } from 'lucide-vue-next'
import DataTable  from '../../components/ui/DataTable.vue'
import LeaveTypeFormModal from '../../components/configuration/LeaveTypeFormModal.vue'
import * as L from '../../lib/listClasses'
import { useAuthStore }       from '../../stores/auth'
import { useLeaveTypesStore } from '../../stores/leaveTypes'

const auth  = useAuthStore()
const store = useLeaveTypesStore()

// ── Classes du design system ─────────────────────────────────
const iconBtn = 'w-7 h-7 flex items-center justify-center border-0 rounded-md bg-background text-muted-foreground cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary'
const toggleTrack = "w-8 h-[18px] rounded-full bg-border transition-colors peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:left-[16px]"

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
