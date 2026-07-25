<template>
  <div class="px-7 py-6 flex flex-col gap-4">

    <!-- En-tête -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-xl font-bold text-foreground">Métiers</h1>
        <p class="text-[13px] text-muted-foreground mt-0.5">Catalogue des métiers utilisés pour définir les postes</p>
      </div>
      <button :class="L.btnPrimary" @click="openAdd">
        <Plus class="w-4 h-4" /> Ajouter un métier
      </button>
    </div>

    <SkeletonLoader v-if="store.loading" type="table" :lines="5" />
    <div v-else :class="L.tableCard">
      <DataTable :columns="columns" :rows="store.jobs" row-key="id">
        <template #cell-category="{ row }">{{ CATEGORY_LABELS[row.category as Job['category']] }}</template>
        <template #cell-isActive="{ row }">
          <span :class="row.isActive ? 'text-success' : 'text-muted-foreground'">{{ row.isActive ? 'Actif' : 'Inactif' }}</span>
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
      <p v-if="store.jobs.length === 0" class="text-center p-6 text-muted-foreground italic text-sm">Aucun métier configuré</p>
    </div>

  </div>

  <CreateModalShell
    v-if="showModal"
    :title="editingId ? 'Modifier le métier' : 'Nouveau métier'"
    :banner-label="editingId ? 'Modifier le métier' : 'Nouveau métier'"
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
                <input v-model="form.code" :class="cls.fieldInput" placeholder="ex : DEV" @input="form.code = form.code.toUpperCase()" />
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Titre *</label>
                <input v-model="form.title" :class="cls.fieldInput" placeholder="ex : Développeur" />
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Description</label>
                <textarea v-model="form.description" :class="cls.fieldTextarea" rows="2"></textarea>
              </div>
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Catégorie *</label>
                <select v-model="form.category" :class="cls.fieldSelect">
                  <option v-for="(l, v) in CATEGORY_LABELS" :key="v" :value="v">{{ l }}</option>
                </select>
              </div>
              <div class="flex items-center justify-between">
                <span :class="cls.fieldLabel">Actif</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" v-model="form.isActive" />
                  <span class="w-9 h-5 rounded-full bg-foreground/20 transition-colors peer-checked:bg-primary relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:transition-all peer-checked:after:left-[19px]"></span>
                </label>
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
import { useJobStore } from '../../stores/jobs'
import type { Job, JobCategory } from '../../stores/jobs'

const store = useJobStore()
if (store.jobs.length === 0) store.fetchAll()

const iconBtn = 'w-7 h-7 flex items-center justify-center border-0 rounded-md bg-background text-muted-foreground cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary'

const CATEGORY_LABELS: Record<JobCategory, string> = {
  SeniorExecutive: 'Cadre supérieur', Manager: 'Manager', Technician: 'Technicien', Employee: 'Employé',
}

const columns = [
  { key: 'code',     label: 'Code',      width: '100px' },
  { key: 'title',    label: 'Titre' },
  { key: 'category', label: 'Catégorie', width: '150px' },
  { key: 'isActive', label: 'Statut',    width: '90px', align: 'center' as const },
  { key: 'actions',  label: 'Actions',   width: '90px', align: 'center' as const },
]

const showModal = ref(false)
const editingId = ref<string | null>(null)
const error = ref('')
const form = reactive({
  code: '', title: '', description: '', category: 'Employee' as JobCategory, isActive: true,
})

function openAdd() {
  editingId.value = null
  error.value = ''
  Object.assign(form, { code: '', title: '', description: '', category: 'Employee' as JobCategory, isActive: true })
  showModal.value = true
}
function openEdit(job: Job) {
  editingId.value = job.id
  error.value = ''
  Object.assign(form, { code: job.code, title: job.title, description: job.description ?? '', category: job.category, isActive: job.isActive })
  showModal.value = true
}

async function save() {
  if (!form.code.trim() || !form.title.trim()) { error.value = 'Code et titre sont obligatoires'; return }
  error.value = ''
  try {
    if (editingId.value) {
      await store.updateJob(editingId.value, { ...form, description: form.description || undefined })
    } else {
      await store.createJob({ ...form, description: form.description || undefined })
    }
    showModal.value = false
  } catch {
    error.value = store.error ?? "L'enregistrement a échoué. Veuillez réessayer."
  }
}

async function remove(job: Job) {
  if (!confirm(`Supprimer le métier « ${job.title} » ?`)) return
  try {
    await store.deleteJob(job.id)
  } catch {
    // store.error porte le message pour l'UI (toast)
  }
}
</script>
