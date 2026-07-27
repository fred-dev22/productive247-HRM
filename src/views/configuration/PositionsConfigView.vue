<template>
  <div class="px-7 py-6 flex flex-col gap-4">

    <!-- En-tête -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-xl font-bold text-foreground">Postes</h1>
        <p class="text-[13px] text-muted-foreground mt-0.5">Postes rattachés à un métier et à une entité, utilisés pour affecter les employés</p>
      </div>
      <button :class="L.btnPrimary" @click="openAdd">
        <Plus class="w-4 h-4" /> Ajouter un poste
      </button>
    </div>

    <SkeletonLoader v-if="store.loading" type="table" :lines="5" />
    <div v-else :class="L.tableCard">
      <DataTable :columns="columns" :rows="store.positions" row-key="id">
        <template #cell-job="{ row }">{{ jobTitle(row.jobId) }}</template>
        <template #cell-entity="{ row }">{{ entityName(row.organizationUnitId) }}</template>
        <template #cell-occupationStatus="{ row }">
          <span :class="row.occupationStatus === 'Occupied' ? 'text-warning' : 'text-success'">
            {{ row.occupationStatus === 'Occupied' ? 'Occupé' : 'Vacant' }}
          </span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1 justify-center">
            <button :class="iconBtn" title="Modifier" @click="openEdit(row)">
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button :class="[iconBtn, 'hover:!bg-danger-bg hover:!text-danger']" title="Supprimer" @click="remove(row)">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>
      </DataTable>
      <p v-if="store.positions.length === 0" class="text-center p-6 text-muted-foreground italic text-sm">Aucun poste configuré</p>
    </div>

  </div>

  <CreateModalShell
    v-if="showModal"
    :title="editingId ? 'Modifier le poste' : 'Nouveau poste'"
    :banner-label="editingId ? 'Modifier le poste' : 'Nouveau poste'"
    :create-label="editingId ? 'Enregistrer' : 'Ajouter'"
    :save-error="error"
    @close="showModal = false"
    @create="save"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-md mx-auto">
          <FormSection title="Informations générales">
            <div class="flex flex-col gap-3.5">
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Code *</label>
                <input v-model="form.code" :class="cls.fieldInput" placeholder="ex : POS-001" @input="form.code = form.code.toUpperCase()" />
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Titre *</label>
                <input v-model="form.title" :class="cls.fieldInput" placeholder="ex : Comptable Senior" />
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Métier *</label>
                <select v-model="form.jobId" :class="cls.fieldSelect">
                  <option value="">-- Choisir --</option>
                  <option v-for="j in jobStore.jobs" :key="j.id" :value="j.id">{{ j.code }} — {{ j.title }}</option>
                </select>
              </div>
            </div>
          </FormSection>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import DataTable  from '../../components/ui/DataTable.vue'
import CreateModalShell from '../../components/shared/CreateModalShell.vue'
import FormSection from '../../components/ui/form-field/FormSection.vue'
import { SkeletonLoader } from '../../components'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { usePositionStore } from '../../stores/positions'
import type { Position } from '../../stores/positions'
import { useJobStore } from '../../stores/jobs'
import { useEntityStore } from '../../stores/entities'

const store = usePositionStore()
const jobStore = useJobStore()
const entityStore = useEntityStore()
if (store.positions.length === 0) store.fetchAll()
if (jobStore.jobs.length === 0) jobStore.fetchAll()
if (entityStore.entities.length === 0) entityStore.fetchAll()

const iconBtn = 'w-7 h-7 flex items-center justify-center border-0 rounded-md bg-background text-muted-foreground cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary'

const columns = [
  { key: 'code',             label: 'Code',    width: '100px' },
  { key: 'title',            label: 'Titre' },
  { key: 'job',               label: 'Métier',  width: '160px' },
  { key: 'entity',            label: 'Entité',  width: '160px' },
  { key: 'occupationStatus', label: 'Statut',  width: '90px', align: 'center' as const },
  { key: 'actions',          label: 'Actions', width: '90px', align: 'center' as const },
]

function jobTitle(jobId: string): string {
  return jobStore.jobs.find(j => j.id === jobId)?.title ?? '—'
}
function entityName(entityId?: string): string {
  if (!entityId) return '—'
  return entityStore.getEntityById(entityId)?.name ?? '—'
}

const showModal = ref(false)
const editingId = ref<string | null>(null)
const error = ref('')
const form = reactive({ code: '', title: '', jobId: '' })

function openAdd() {
  editingId.value = null
  error.value = ''
  Object.assign(form, { code: '', title: '', jobId: '' })
  showModal.value = true
}
function openEdit(position: Position) {
  editingId.value = position.id
  error.value = ''
  Object.assign(form, { code: position.code, title: position.title, jobId: position.jobId })
  showModal.value = true
}

async function save() {
  if (!form.code.trim() || !form.title.trim()) { error.value = 'Code et titre sont obligatoires'; return }
  if (!form.jobId) { error.value = 'Le métier est obligatoire'; return }
  error.value = ''
  const payload = { code: form.code, title: form.title, jobId: form.jobId }
  try {
    if (editingId.value) {
      await store.updatePosition(editingId.value, payload)
    } else {
      await store.createPosition({ ...payload, occupationStatus: 'Vacant' })
    }
    showModal.value = false
  } catch {
    error.value = store.error ?? "L'enregistrement a échoué. Veuillez réessayer."
  }
}

async function remove(position: Position) {
  if (!confirm(`Supprimer le poste « ${position.title} » ?`)) return
  try {
    await store.deletePosition(position.id)
  } catch {
    // store.error porte le message pour l'UI (toast)
  }
}
</script>
