<template>
  <ListPageLayout
    title="Offres d'emploi"
    :subtitle="`${jobOfferStore.items.length} offre(s)`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} offre(s)`"
    search-placeholder="Rechercher un titre, une entité, un lieu…"
    :page-size-options="[15, 25, 50]"
    scope-label="Offres :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="showCreate = true">
        <Plus class="w-4 h-4" /> Nouvelle offre
      </button>
    </template>

    <!-- KPIs -->
    <template #above-table>
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-primary/10"><Briefcase class="w-[18px] h-[18px] text-primary" /></div>
          <div><div :class="kpiVal">{{ jobOfferStore.items.length }}</div><div :class="kpiLbl">Total</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-success-bg"><Globe class="w-[18px] h-[18px] text-success" /></div>
          <div><div :class="kpiVal">{{ publishedCount }}</div><div :class="kpiLbl">Publiées</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-warning-bg"><Clock class="w-[18px] h-[18px] text-warning" /></div>
          <div><div :class="kpiVal">{{ pendingCount }}</div><div :class="kpiLbl">En attente de validation</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-info-bg"><Users class="w-[18px] h-[18px] text-info" /></div>
          <div><div :class="kpiVal">{{ totalApplications }}</div><div :class="kpiLbl">Candidatures totales</div></div>
        </div>
      </div>
    </template>

    <!-- Actions contextuelles (ligne sélectionnée) -->
    <template #row-actions="{ item }">
      <button v-if="item.status === 'Draft'" :class="approveCls" @click="submitOffer(item)"><Send class="w-3.5 h-3.5" /> Soumettre</button>
      <template v-if="item.status === 'PendingApproval'">
        <button :class="approveCls" @click="approveOffer(item)"><Check class="w-3.5 h-3.5" /> Approuver</button>
        <button :class="rejectCls" @click="openReject(item)"><X class="w-3.5 h-3.5" /> Refuser</button>
      </template>
      <button v-if="item.status === 'Approved'" :class="approveCls" @click="publishOffer(item)"><Rocket class="w-3.5 h-3.5" /> Publier</button>
      <button v-if="item.status === 'Published'" :class="cancelCls" @click="closeOffer(item)"><Archive class="w-3.5 h-3.5" /> Clôturer</button>
    </template>

    <!-- Filtres -->
    <template #filters>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Entité</label>
        <select v-model="fEntity" :class="L.fpSelect">
          <option value="">Entité</option>
          <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.name">{{ e.code }} · {{ e.name }}</option>
        </select>
      </div>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Type de contrat</label>
        <select v-model="fContract" :class="L.fpSelect">
          <option value="">Type de contrat</option>
          <option v-for="c in CONTRACT_TYPES" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">Réinitialiser les filtres</button>
    </template>

    <!-- Cellules -->
    <template #cell-title="{ item }"><span class="font-medium text-foreground text-xs truncate">{{ item.title }}</span></template>
    <template #cell-entityName="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.entityName }}</span></template>
    <template #cell-contractType="{ item }"><span class="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-primary/10 text-primary">{{ item.contractType }}</span></template>
    <template #cell-location="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.location }}</span></template>
    <template #cell-status="{ item }"><StatusPill :status="item.status" /></template>
    <template #cell-views="{ item }"><span class="text-xs font-medium tabular-nums">{{ item.views }}</span></template>
    <template #cell-applications="{ item }"><span class="bg-info-bg text-info text-[11px] font-semibold px-2 py-0.5 rounded-full">{{ jobOfferStore.applicationsCount(item.id) }}</span></template>

    <!-- Aperçu rapide -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div>
          <div class="text-sm font-semibold text-foreground truncate">{{ item.title }}</div>
          <div class="text-[11px] text-muted-foreground truncate">{{ item.entityName }} · {{ item.location }}</div>
        </div>
        <div><StatusPill :status="item.status" /></div>
        <div v-if="item.rejectionReason" :class="cls.fieldErrorBlock">{{ item.rejectionReason }}</div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Type de contrat</div>{{ item.contractType }}</div>
          <div><div class="text-muted-foreground text-[11px]">Publiée le</div>{{ formatDate(item.publishedAt) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Vues</div>{{ item.views }}</div>
          <div><div class="text-muted-foreground text-[11px]">Candidatures</div>{{ jobOfferStore.applicationsCount(item.id) }}</div>
        </div>
        <div class="text-[12px]">
          <div class="text-muted-foreground text-[11px]">Description</div>
          <p class="text-foreground whitespace-pre-line">{{ item.description }}</p>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border">
          <button v-if="item.status === 'Draft'" :class="approveCls" @click="submitOffer(item)"><Send class="w-3.5 h-3.5" /> Soumettre</button>
          <template v-if="item.status === 'PendingApproval'">
            <button :class="approveCls" @click="approveOffer(item)"><Check class="w-3.5 h-3.5" /> Approuver</button>
            <button :class="rejectCls" @click="openReject(item)"><X class="w-3.5 h-3.5" /> Refuser</button>
          </template>
          <button v-if="item.status === 'Approved'" :class="approveCls" @click="publishOffer(item)"><Rocket class="w-3.5 h-3.5" /> Publier</button>
          <button v-if="item.status === 'Published'" :class="cancelCls" @click="closeOffer(item)"><Archive class="w-3.5 h-3.5" /> Clôturer</button>
          <span v-if="!['Draft', 'PendingApproval', 'Approved', 'Published'].includes(item.status)" class="text-xs text-muted-foreground italic">Aucune action disponible</span>
        </div>
      </div>
    </template>

    <template #empty>
      <Briefcase class="w-8 h-8" />
      <p class="text-[13px]">Aucune offre d'emploi</p>
    </template>

    <!-- Création -->
    <CreateModalShell
      v-if="showCreate"
      title="Nouvelle offre d'emploi"
      banner-label="Nouvelle offre d'emploi"
      create-label="Soumettre"
      draft-label="Enregistrer le brouillon"
      :save-error="error"
      @close="showCreate = false"
      @create="create"
      @save-draft="saveDraft"
    >
      <template #form>
        <div class="flex-1 overflow-auto px-6 py-5">
          <div class="max-w-3xl mx-auto">

            <FormSection title="Offre">
              <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
                <div :class="cls.field" class="col-span-2">
                  <label :class="cls.fieldLabel">Titre <span class="text-danger">*</span></label>
                  <input v-model="form.title" :class="cls.fieldInput" placeholder="ex : Comptable, Chauffeur poids lourd…" />
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Entité <span class="text-danger">*</span></label>
                  <select v-model="form.entityId" :class="cls.fieldSelect">
                    <option value="">Sélectionnez une entité</option>
                    <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.id">{{ e.code }} · {{ e.name }}</option>
                  </select>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Type de contrat <span class="text-danger">*</span></label>
                  <select v-model="form.contractType" :class="cls.fieldSelect">
                    <option v-for="c in CONTRACT_TYPES" :key="c.value" :value="c.value">{{ c.label }}</option>
                  </select>
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Lieu <span class="text-danger">*</span></label>
                  <input v-model="form.location" :class="cls.fieldInput" placeholder="ex : Antananarivo, Toamasina…" />
                </div>
              </div>
            </FormSection>

            <FormSection title="Description">
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Description <span class="text-danger">*</span></label>
                <textarea v-model="form.description" :class="cls.fieldTextarea" rows="4" placeholder="Missions, responsabilités, profil recherché…"></textarea>
              </div>
            </FormSection>

            <FormSection title="Rattachement">
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Rattacher à une demande approuvée <span :class="cls.fieldOptional">(optionnel)</span></label>
                <select v-model="form.hiringRequestId" :class="cls.fieldSelect">
                  <option value="">Aucune</option>
                  <option v-for="r in approvedHiringRequests" :key="r.id" :value="r.id">{{ r.positionTitle }} · {{ r.entityName }}</option>
                </select>
              </div>
            </FormSection>

          </div>
        </div>
      </template>
    </CreateModalShell>

    <!-- Modale Refuser -->
    <ModalShell :open="rejectModal.open" title="Refuser l'offre" max-width="max-w-[420px]" @close="rejectModal.open = false">
      <label :class="cls.fieldLabel">Motif du refus *</label>
      <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" placeholder="Indiquez le motif du refus…" rows="4"></textarea>
      <div v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</div>
      <template #footer>
        <button :class="cls.btnPrimary" @click="confirmReject">Confirmer le refus</button>
        <button :class="cls.btnOutline" @click="rejectModal.open = false">Annuler</button>
      </template>
    </ModalShell>
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Liste des offres d'emploi (JobOffer) — module Recrutement, design
 * uniquement (données fictives, voir src/stores/recruitment). Calquée sur
 * EmployeeListView.vue / MissionListView.vue : ListPageLayout + boutons de
 * workflow repris à l'identique de MissionWorkflowActions.vue. Pas de bouton
 * Retourner (JobOfferStatus n'a pas d'état Returned) ni Annuler (pas
 * d'action cancel exposée par useJobOfferStore).
 */
import { ref, reactive, computed, watch } from 'vue'
import { Plus, Send, Check, X, Rocket, Archive, Briefcase, Clock, Globe, Users } from 'lucide-vue-next'
import { ListPageLayout, StatusPill, CreateModalShell } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import FormSection from '../../components/ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { formatDate } from '../../lib/date'
import { confirmDialog } from '../../lib/confirm'
import { useJobOfferStore, useHiringRequestStore } from '../../stores/recruitment'
import type { JobOffer } from '../../stores/recruitment'
import { useEntityStore } from '../../stores/entities'

const jobOfferStore = useJobOfferStore()
const hiringRequestStore = useHiringRequestStore()
const entityStore = useEntityStore()
if (entityStore.entities.length === 0) entityStore.fetchAll()

const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Freelance', label: 'Freelance' },
]

/* ── Styles (KPI + boutons de workflow, repris à l'identique de
   MissionWorkflowActions.vue) ─────────────────────────────────── */
const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold leading-none'
const kpiLbl = 'text-xs text-muted-foreground mt-0.5'

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const approveCls = btn + ' bg-success-bg text-success hover:brightness-95'
const rejectCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'
const cancelCls  = btn + ' bg-neutral-bg text-neutral hover:brightness-95'

/* ── Colonnes ───────────────────────────────────────────────── */
const columns: ListColumn[] = [
  { key: 'title', label: 'Titre', sortable: true, hideable: false, width: 220 },
  { key: 'entityName', label: 'Entité', sortable: true, width: 180 },
  { key: 'contractType', label: 'Type de contrat', width: 130 },
  { key: 'location', label: 'Lieu', sortable: true, width: 150 },
  { key: 'status', label: 'Statut', width: 140 },
  { key: 'views', label: 'Vues', align: 'center', sortable: true, width: 90 },
  { key: 'applications', label: 'Candidatures', align: 'center', hideable: false, width: 120 },
]

/* ── KPIs ───────────────────────────────────────────────────── */
const publishedCount = computed(() => jobOfferStore.items.filter(o => o.status === 'Published').length)
const pendingCount = computed(() => jobOfferStore.items.filter(o => o.status === 'PendingApproval').length)
const totalApplications = computed(() => jobOfferStore.items.reduce((s, o) => s + jobOfferStore.applicationsCount(o.id), 0))

/* ── Scope / recherche / tri / pagination ──────────────────────
   Même pattern que EmployeeListView.vue : la vue calcule elle-même
   "filtered" puis passe la page déjà filtrée/triée à ListPageLayout. */
const scopeOptions = [
  { value: '', label: 'Toutes' },
  { value: 'Draft', label: 'Brouillon' },
  { value: 'PendingApproval', label: 'En attente' },
  { value: 'Approved', label: 'Approuvée' },
  { value: 'Published', label: 'Publiée' },
  { value: 'Closed', label: 'Clôturée' },
  { value: 'Rejected', label: 'Refusée' },
]
const activeScope = ref('')
const fEntity = ref('')
const fContract = ref('')
const searchQuery = ref('')
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = ref(15)

watch([activeScope, fEntity, fContract, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  fEntity.value = ''; fContract.value = ''; searchQuery.value = ''; activeScope.value = ''; page.value = 1
}

const sortFieldMap: Record<string, keyof JobOffer> = {
  title: 'title', entityName: 'entityName', location: 'location', views: 'views',
}

const filtered = computed(() => {
  let rows = jobOfferStore.items.filter(o => {
    if (activeScope.value && o.status !== activeScope.value) return false
    if (fEntity.value && o.entityName !== fEntity.value) return false
    if (fContract.value && o.contractType !== fContract.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!o.title.toLowerCase().includes(q) && !o.entityName.toLowerCase().includes(q) && !o.location.toLowerCase().includes(q)) return false
    }
    return true
  })
  if (sortKey.value && sortFieldMap[sortKey.value]) {
    const f = sortFieldMap[sortKey.value]!
    rows = [...rows].sort((a, b) => {
      const va = a[f], vb = b[f]
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return rows
})

const totalCount = computed(() => filtered.value.length)
const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

/* ── Création ───────────────────────────────────────────────── */
const approvedHiringRequests = computed(() => hiringRequestStore.items.filter(r => r.status === 'Approved'))

const showCreate = ref(false)
const error = ref<string | null>(null)
const form = reactive({
  title: '', entityId: '', contractType: 'CDI', location: '', description: '', hiringRequestId: '',
})

function resetForm() {
  Object.assign(form, { title: '', entityId: '', contractType: 'CDI', location: '', description: '', hiringRequestId: '' })
  error.value = null
}

function validate(): boolean {
  if (!form.title.trim()) { error.value = 'Le titre est requis'; return false }
  if (!form.entityId) { error.value = "L'entité est requise"; return false }
  if (!form.location.trim()) { error.value = 'Le lieu est requis'; return false }
  if (!form.description.trim()) { error.value = 'La description est requise'; return false }
  error.value = null
  return true
}

function buildPayload() {
  const entity = entityStore.approvedEntities.find(e => e.id === form.entityId)
  return {
    title: form.title.trim(),
    entityName: entity?.name ?? '',
    contractType: form.contractType,
    location: form.location.trim(),
    description: form.description.trim(),
    hiringRequestId: form.hiringRequestId || undefined,
  }
}

function create() {
  if (!validate()) return
  jobOfferStore.create(buildPayload())
  const created = jobOfferStore.items[0]
  if (created) jobOfferStore.submit(created.id)
  showCreate.value = false
  resetForm()
}

function saveDraft() {
  if (!validate()) return
  jobOfferStore.create(buildPayload())
  showCreate.value = false
  resetForm()
}

/* ── Actions de workflow ────────────────────────────────────── */
function submitOffer(item: JobOffer) { jobOfferStore.submit(item.id) }
function approveOffer(item: JobOffer) { jobOfferStore.approve(item.id) }
function publishOffer(item: JobOffer) { jobOfferStore.publish(item.id) }

async function closeOffer(item: JobOffer) {
  if (await confirmDialog("Clôturer cette offre d'emploi ?")) jobOfferStore.close(item.id)
}

const rejectModal = reactive({ open: false, itemId: '', reason: '', error: '' })
function openReject(item: JobOffer) { Object.assign(rejectModal, { open: true, itemId: item.id, reason: '', error: '' }) }
function confirmReject() {
  if (rejectModal.reason.trim().length === 0) { rejectModal.error = 'Le motif est requis'; return }
  jobOfferStore.reject(rejectModal.itemId, rejectModal.reason.trim())
  rejectModal.open = false
}
</script>
