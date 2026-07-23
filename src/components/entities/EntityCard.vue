<script setup lang="ts">
/**
 * Fiche d'une entité (lecture / édition) — sur CardModalShell, pattern
 * frontdesk. Entité parente via TableLookupField. Pools de validation,
 * sous-entités, historique.
 */
import { ref, computed, watch } from 'vue'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import TableLookupField from '../ui/table-lookup/TableLookupField.vue'
import type { LookupFetchParams } from '../ui/table-lookup/TableLookupField.vue'
import EntityWorkflowActions from './EntityWorkflowActions.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useEntityStore } from '../../stores/entities'
import type { Entity, EntityType } from '../../types'

const props = defineProps<{ entities: Entity[]; entityId: string }>()
const emit = defineEmits<{ close: [] }>()

const store = useEntityStore()

const TYPE_LABELS: Record<string, string> = { Direction: 'Direction', Department: 'Département', Service: 'Service' }
const TYPE_BADGE: Record<string, string> = { Direction: 'bg-danger-bg text-danger', Department: 'bg-success-bg text-success', Service: 'bg-primary/10 text-primary' }

const entityColumns = [{ key: 'code', label: 'Code', width: '90px' }, { key: 'name', label: 'Nom' }]
function fetchParents({ searchQuery }: LookupFetchParams) {
  let items = store.approvedEntities.filter(e => e.id !== currentId.value)
  if (searchQuery) { const q = searchQuery.toLowerCase(); items = items.filter(e => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)) }
  return { items, total: items.length }
}

const currentId = ref(props.entityId)
watch(() => props.entityId, (v) => { currentId.value = v; isEditMode.value = false })

const current = computed<Entity | null>(() => props.entities.find(e => e.id === currentId.value) ?? null)
const currentIndex = computed(() => props.entities.findIndex(e => e.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.entities.length - 1)
const sidebarItems = computed(() => props.entities.map(e => ({ no: e.code, label: e.name })))
const currentNo = computed(() => current.value?.code ?? null)

const parentEntity = computed(() => current.value?.parentId ? store.getEntityById(current.value.parentId) : undefined)
const children = computed(() => current.value ? store.getChildren(current.value.id) : [])
const sortedPools = computed(() => [...(current.value?.validatorPools ?? [])].sort((a, b) => a.level - b.level))

function goPrev() { if (hasPrev.value) { currentId.value = props.entities[currentIndex.value - 1]!.id; isEditMode.value = false } }
function goNext() { if (hasNext.value) { currentId.value = props.entities[currentIndex.value + 1]!.id; isEditMode.value = false } }
function selectSidebar(no: string) { const e = props.entities.find(x => x.code === no); if (e) { currentId.value = e.id; isEditMode.value = false } }

/* ── Édition ────────────────────────────────────────────────── */
const isEditMode = ref(false)
const canEdit = computed(() => current.value?.status === 'Draft' || current.value?.status === 'Active')
const parentCode = ref('')
const form = ref({ name: '', code: '', type: 'Service' as EntityType, parentId: '' as string | null, parentName: '', legalIdentifier: '', address: '', responsibleName: '', phone: '', email: '' })

function enterEdit() {
  if (!current.value) return
  const e = current.value
  form.value = {
    name: e.name, code: e.code, type: e.type, parentId: e.parentId ?? '', parentName: parentEntity.value?.name ?? '',
    legalIdentifier: e.legalIdentifier ?? '', address: e.address ?? '', responsibleName: e.responsibleName ?? '', phone: e.phone ?? '', email: e.email ?? '',
  }
  parentCode.value = parentEntity.value?.code ?? ''
  isEditMode.value = true
}
function cancelEdit() { isEditMode.value = false }
function onParentSelect(item: Record<string, unknown>) { form.value.parentId = String(item.id); form.value.parentName = String(item.name); parentCode.value = String(item.code) }
async function save() {
  if (!current.value) return
  await store.updateEntity(current.value.id, { name: form.value.name, type: form.value.type, parentId: form.value.parentId || null, address: form.value.address, phone: form.value.phone, email: form.value.email })
  isEditMode.value = false
}

const pageTitle = computed(() => (current.value ? `${current.value.code} · ${current.value.name}` : ''))
const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="pageTitle"
    :page-number="current.code"
    banner-label="Fiche entité"
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
      <EntityWorkflowActions :entity="current" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Informations -->
        <FormSection title="Informations générales" :recaps="[current.code, current.name, TYPE_LABELS[current.type]]">
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Intitulé</label>
            <input v-if="isEditMode" v-model="form.name" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.name }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Code</label>
            <div :class="readBox">{{ current.code }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Type</label>
            <select v-if="isEditMode" v-model="form.type" :class="cls.fieldSelect"><option value="Direction">Direction</option><option value="Department">Département</option><option value="Service">Service</option></select>
            <div v-else :class="readBox"><span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="TYPE_BADGE[current.type]">{{ TYPE_LABELS[current.type] }}</span></div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Entité parente</label>
            <TableLookupField v-if="isEditMode" :code="parentCode" :name="form.parentName" value-key="code" name-key="name" :columns="entityColumns" :fetch-fn="fetchParents" modal-title="Sélectionner l'entité parente" placeholder="Code entité" @update:code="parentCode = $event" @update:name="form.parentName = $event" @select="onParentSelect" />
            <div v-else :class="readBox">{{ parentEntity?.name ?? '— Racine —' }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Identifiant légal</label>
            <input v-if="isEditMode" v-model="form.legalIdentifier" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.legalIdentifier || '—' }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Adresse</label>
            <textarea v-if="isEditMode" v-model="form.address" :class="cls.fieldTextarea" rows="2"></textarea>
            <div v-else :class="[readBox, 'h-auto min-h-[38px] py-2']">{{ current.address || '—' }}</div>
          </div>
        </div>

        </FormSection>

        <!-- Contact & Responsable -->
        <FormSection title="Contact & Responsable" :recaps="[current.responsibleName, current.email]">
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Responsable</label>
            <input v-if="isEditMode" v-model="form.responsibleName" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.responsibleName || '—' }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Effectif rattaché</label>
            <div :class="readBox">{{ current.headcount }} employé(s)</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Téléphone</label>
            <input v-if="isEditMode" type="tel" v-model="form.phone" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.phone || '—' }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Email</label>
            <input v-if="isEditMode" type="email" v-model="form.email" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.email || '—' }}</div>
          </div>
        </div>
        </FormSection>

        <!-- Pools de validation -->
        <FormSection title="Pools de validation">
        <div v-if="sortedPools.length" class="flex flex-col gap-2.5">
          <div v-for="pool in sortedPools" :key="pool.level" class="flex items-center gap-2.5 px-2.5 py-2 bg-background rounded-md">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" :style="{ background: pool.validatorColor }">{{ pool.validatorInitials }}</div>
            <div class="flex-1"><div class="text-[13px] font-medium">{{ pool.validatorName }}</div><div class="text-[11px] text-muted-foreground">Validateur N+{{ pool.level }}</div></div>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">N+{{ pool.level }}</span>
          </div>
        </div>
        <div v-else class="text-xs text-muted-foreground italic">Aucun validateur configuré</div>
        </FormSection>

        <!-- Sous-entités -->
        <FormSection v-if="children.length" :title="`Sous-entités (${children.length})`">
          <div class="flex flex-col gap-1.5">
            <div v-for="child in children" :key="child.id" class="flex items-center gap-2 px-2.5 py-2 bg-background rounded-md text-[13px]">
              <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="TYPE_BADGE[child.type]">{{ TYPE_LABELS[child.type] }}</span>
              <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary">{{ child.code }}</span>
              <span>{{ child.name }}</span>
            </div>
          </div>
        </FormSection>
      </div>
    </template>
  </CardModalShell>
</template>
