<script setup lang="ts">
/**
 * Fiche de création d'une entité — sur CreateModalShell (pattern frontdesk).
 * Entité parente via TableLookupField.
 */
import { ref, reactive, computed } from 'vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import TableLookupField from '../ui/table-lookup/TableLookupField.vue'
import type { LookupFetchParams } from '../ui/table-lookup/TableLookupField.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useEntityStore } from '../../stores/entities'
import type { EntityType } from '../../types'

const emit = defineEmits<{ close: []; created: [] }>()
const store = useEntityStore()

const entityColumns = [{ key: 'code', label: 'Code', width: '90px' }, { key: 'name', label: 'Nom' }]
function fetchParents({ searchQuery }: LookupFetchParams) {
  let items = store.approvedEntities
  if (searchQuery) { const q = searchQuery.toLowerCase(); items = items.filter(e => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)) }
  return { items, total: items.length }
}

const parentCode = ref('')
const form = reactive({ name: '', code: '', type: '' as EntityType | '', parentId: '' as string | null, parentName: '', legalIdentifier: '', address: '', responsibleName: '', phone: '', email: '' })
const error = ref('')

function onParentSelect(item: Record<string, unknown>) { form.parentId = String(item.id); form.parentName = String(item.name); parentCode.value = String(item.code) }

function validate(): boolean {
  if (!form.name.trim()) { error.value = "L'intitulé est obligatoire"; return false }
  if (!form.code.trim()) { error.value = 'Le code est obligatoire'; return false }
  if (!form.type) { error.value = 'Veuillez choisir un type'; return false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { error.value = 'Format email invalide'; return false }
  error.value = ''
  return true
}

function buildPayload(): Parameters<typeof store.createEntity>[0] {
  return {
    code: form.code, name: form.name, type: form.type as EntityType, parentId: form.parentId || null,
    legalIdentifier: form.legalIdentifier || undefined, address: form.address || undefined,
    phone: form.phone || undefined, email: form.email || undefined,
    responsibleName: form.responsibleName || undefined, headcount: 0, validatorPools: [],
  }
}

function create() {
  if (!validate()) return
  store.createEntity(buildPayload())
  const created = store.entities[store.entities.length - 1]
  if (created) store.submitEntity(created.id)
  emit('created'); emit('close')
}
function saveDraft() {
  if (!validate()) return
  store.createEntity(buildPayload())
  emit('created'); emit('close')
}
</script>

<template>
  <CreateModalShell
    title="Nouvelle entité"
    banner-label="Nouvelle entité"
    create-label="Enregistrer et soumettre"
    :save-error="error"
    @close="emit('close')"
    @create="create"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-3xl">
          <FormSection title="Informations générales">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Intitulé <span class="text-danger">*</span></label>
              <input v-model="form.name" :class="cls.fieldInput" placeholder="ex : Direction des Ressources Humaines" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Code <span class="text-danger">*</span></label>
              <input v-model="form.code" :class="cls.fieldInput" maxlength="10" placeholder="ex : DRH" @input="form.code = form.code.toUpperCase()" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Type <span class="text-danger">*</span></label>
              <select v-model="form.type" :class="cls.fieldSelect"><option value="">-- Choisir --</option><option value="direction">Direction</option><option value="department">Département</option><option value="service">Service</option></select>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Entité parente</label>
              <TableLookupField :code="parentCode" :name="form.parentName" value-key="code" name-key="name" :columns="entityColumns" :fetch-fn="fetchParents" modal-title="Sélectionner l'entité parente" placeholder="Code entité" @update:code="parentCode = $event" @update:name="form.parentName = $event" @select="onParentSelect" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Identifiant légal</label>
              <input v-model="form.legalIdentifier" :class="cls.fieldInput" placeholder="ex : GPL-001" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Adresse</label>
              <textarea v-model="form.address" :class="cls.fieldTextarea" rows="2"></textarea>
            </div>
          </div>

          </FormSection>

          <FormSection title="Contact & Responsable">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Responsable</label>
              <input v-model="form.responsibleName" :class="cls.fieldInput" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Téléphone</label>
              <input type="tel" v-model="form.phone" :class="cls.fieldInput" placeholder="+261 …" />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Email</label>
              <input type="email" v-model="form.email" :class="cls.fieldInput" placeholder="service@galana.com" />
            </div>
          </div>
          </FormSection>

          <div class="mt-6">
            <button :class="cls.btnOutline" @click="saveDraft">Enregistrer en brouillon</button>
          </div>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
