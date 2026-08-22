<template>
  <div>
    <!-- Bascule Contrats / Modèles de contrat -->
    <div class="px-7 pt-6 flex items-center gap-1.5">
      <div class="inline-flex items-center gap-0.5 border border-border rounded-md p-0.5 bg-card">
        <button :class="[tabBtn, activeTab === 'contracts' ? tabBtnActive : tabBtnInactive]" @click="activeTab = 'contracts'">
          <FileSignature class="w-3.5 h-3.5" /> Contrats
        </button>
        <button :class="[tabBtn, activeTab === 'templates' ? tabBtnActive : tabBtnInactive]" @click="activeTab = 'templates'">
          <FileText class="w-3.5 h-3.5" /> Modèles de contrat
        </button>
      </div>
    </div>

    <!-- ── Sous-vue Contrats ─────────────────────────────────────── -->
    <ListPageLayout
      v-if="activeTab === 'contracts'"
      title="Contrats à générer"
      :subtitle="`${contractStore.items.length} contrat(s)`"
      :columns="columns"
      :items="pageItems"
      :total="totalCount"
      :total-text="`${totalCount} contrat(s)`"
      search-placeholder="Rechercher un candidat, un poste, une entité…"
      :page-size-options="[15, 25, 50]"
      scope-label="Contrats :"
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
          <Plus class="w-4 h-4" /> Générer un contrat
        </button>
      </template>

      <!-- KPIs -->
      <template #above-table>
        <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-primary/10"><FileSignature class="w-[18px] h-[18px] text-primary" /></div>
            <div><div :class="kpiVal">{{ contractStore.items.length }}</div><div :class="kpiLbl">Total</div></div>
          </div>
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-warning-bg"><Clock class="w-[18px] h-[18px] text-warning" /></div>
            <div><div :class="kpiVal">{{ pendingCount }}</div><div :class="kpiLbl">En attente de validation</div></div>
          </div>
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-info-bg"><Mail class="w-[18px] h-[18px] text-info" /></div>
            <div><div :class="kpiVal">{{ sentCount }}</div><div :class="kpiLbl">Envoyés au candidat</div></div>
          </div>
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-success-bg"><CheckCircle2 class="w-[18px] h-[18px] text-success" /></div>
            <div><div :class="kpiVal">{{ acceptedCount }}</div><div :class="kpiLbl">Acceptés</div></div>
          </div>
        </div>
      </template>

      <!-- Actions contextuelles (ligne sélectionnée) -->
      <template #row-actions="{ item }">
        <button v-if="item.status === 'Draft'" :class="approveCls" @click="submitContract(item)"><Send class="w-3.5 h-3.5" /> Soumettre</button>
        <template v-if="item.status === 'PendingApproval'">
          <button :class="approveCls" @click="approveContract(item)"><Check class="w-3.5 h-3.5" /> Approuver</button>
          <button :class="returnCls" @click="openReturn(item)"><Undo2 class="w-3.5 h-3.5" /> Retourner</button>
          <button :class="rejectCls" @click="openReject(item)"><X class="w-3.5 h-3.5" /> Refuser</button>
        </template>
        <button v-if="item.status === 'Approved'" :class="infoCls" @click="sendContract(item)"><Mail class="w-3.5 h-3.5" /> Envoyer au candidat</button>
        <template v-if="item.status === 'SentToCandidate'">
          <button :class="approveCls" @click="acceptContract(item)"><CheckCircle2 class="w-3.5 h-3.5" /> Le candidat accepte</button>
          <button :class="rejectCls" @click="refuseContract(item)"><XCircle class="w-3.5 h-3.5" /> Le candidat refuse</button>
        </template>
        <button v-if="CANCELLABLE.includes(item.status)" :class="cancelCls" @click="cancelContract(item)"><Ban class="w-3.5 h-3.5" /> Annuler</button>
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
          <label :class="L.fpFieldLabel">Modèle</label>
          <select v-model="fTemplate" :class="L.fpSelect">
            <option value="">Modèle</option>
            <option v-for="t in contractStore.templates" :key="t.id" :value="t.name">{{ t.name }}</option>
          </select>
        </div>
        <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">Réinitialiser les filtres</button>
      </template>

      <!-- Cellules -->
      <template #cell-candidateName="{ item }"><span class="font-medium text-foreground text-xs truncate">{{ item.candidateName }}</span></template>
      <template #cell-jobTitle="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.jobTitle }}</span></template>
      <template #cell-entityName="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.entityName }}</span></template>
      <template #cell-templateName="{ item }"><span class="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-primary/10 text-primary">{{ item.templateName }}</span></template>
      <template #cell-startDate="{ item }"><span class="text-muted-foreground text-xs">{{ formatDate(item.startDate) }}</span></template>
      <template #cell-salary="{ item }"><span class="text-xs font-semibold tabular-nums">{{ formatSalary(item.salary) }}</span></template>
      <template #cell-status="{ item }"><StatusPill :status="item.status" /></template>

      <!-- Aperçu rapide -->
      <template #details-panel="{ item }">
        <div class="flex flex-col gap-3.5">
          <div>
            <div class="text-sm font-semibold text-foreground truncate">{{ item.candidateName }}</div>
            <div class="text-[11px] text-muted-foreground truncate">{{ item.jobTitle }} · {{ item.entityName }}</div>
          </div>
          <div><StatusPill :status="item.status" /></div>
          <div v-if="item.rejectionReason" :class="cls.fieldErrorBlock">{{ item.rejectionReason }}</div>
          <div class="grid grid-cols-2 gap-2 text-[12px]">
            <div><div class="text-muted-foreground text-[11px]">Modèle</div>{{ item.templateName }}</div>
            <div><div class="text-muted-foreground text-[11px]">Date de début</div>{{ formatDate(item.startDate) }}</div>
            <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Salaire</div>{{ formatSalary(item.salary) }}</div>
          </div>

          <div class="pt-2 border-t border-border">
            <div class="text-[11px] text-muted-foreground mb-1">Aperçu du contrat</div>
            <p class="text-[12px] text-foreground whitespace-pre-line bg-background border border-dashed border-border rounded-lg p-3">{{ contractPreview(item) }}</p>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border">
            <button v-if="item.status === 'Draft'" :class="approveCls" @click="submitContract(item)"><Send class="w-3.5 h-3.5" /> Soumettre</button>
            <template v-if="item.status === 'PendingApproval'">
              <button :class="approveCls" @click="approveContract(item)"><Check class="w-3.5 h-3.5" /> Approuver</button>
              <button :class="returnCls" @click="openReturn(item)"><Undo2 class="w-3.5 h-3.5" /> Retourner</button>
              <button :class="rejectCls" @click="openReject(item)"><X class="w-3.5 h-3.5" /> Refuser</button>
            </template>
            <button v-if="item.status === 'Approved'" :class="infoCls" @click="sendContract(item)"><Mail class="w-3.5 h-3.5" /> Envoyer au candidat</button>
            <template v-if="item.status === 'SentToCandidate'">
              <button :class="approveCls" @click="acceptContract(item)"><CheckCircle2 class="w-3.5 h-3.5" /> Le candidat accepte</button>
              <button :class="rejectCls" @click="refuseContract(item)"><XCircle class="w-3.5 h-3.5" /> Le candidat refuse</button>
            </template>
            <button v-if="CANCELLABLE.includes(item.status)" :class="cancelCls" @click="cancelContract(item)"><Ban class="w-3.5 h-3.5" /> Annuler</button>
            <span v-if="!CANCELLABLE.includes(item.status) && item.status !== 'SentToCandidate'" class="text-xs text-muted-foreground italic">Aucune action disponible</span>
          </div>
        </div>
      </template>

      <template #empty>
        <FileSignature class="w-8 h-8" />
        <p class="text-[13px]">Aucun contrat</p>
      </template>

      <!-- Génération d'un contrat -->
      <CreateModalShell
        v-if="showCreate"
        title="Générer un contrat"
        banner-label="Nouveau contrat"
        create-label="Générer"
        :save-error="error"
        @close="showCreate = false"
        @create="create"
      >
        <template #form>
          <div class="flex-1 overflow-auto px-6 py-5">
            <div class="max-w-3xl mx-auto">

              <FormSection title="Candidature">
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Candidature retenue <span class="text-danger">*</span></label>
                  <select v-model="form.applicationId" :class="cls.fieldSelect" @change="onApplicationChange">
                    <option value="">Sélectionnez une candidature</option>
                    <option v-for="a in eligibleApplications" :key="a.id" :value="a.id">{{ a.candidateName }} · {{ a.jobOfferTitle ?? 'Candidature spontanée' }}</option>
                  </select>
                  <p v-if="eligibleApplications.length === 0" class="text-[11px] text-muted-foreground mt-1">Aucune candidature retenue sans contrat n'est disponible actuellement.</p>
                </div>
              </FormSection>

              <FormSection title="Contrat">
                <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
                  <div :class="cls.field" class="col-span-2">
                    <label :class="cls.fieldLabel">Modèle de contrat <span class="text-danger">*</span></label>
                    <select v-model="form.templateId" :class="cls.fieldSelect">
                      <option value="">Sélectionnez un modèle</option>
                      <option v-for="t in contractStore.templates" :key="t.id" :value="t.id">{{ t.name }} ({{ t.contractType }})</option>
                    </select>
                  </div>
                  <div :class="cls.field" class="col-span-2">
                    <label :class="cls.fieldLabel">Poste <span class="text-danger">*</span></label>
                    <input v-model="form.jobTitle" :class="cls.fieldInput" placeholder="ex : Comptable, Chauffeur poids lourd…" />
                  </div>
                  <div :class="cls.field">
                    <label :class="cls.fieldLabel">Entité <span class="text-danger">*</span></label>
                    <select v-model="form.entityId" :class="cls.fieldSelect">
                      <option value="">Sélectionnez une entité</option>
                      <option v-for="e in entityStore.approvedEntities" :key="e.id" :value="e.id">{{ e.code }} · {{ e.name }}</option>
                    </select>
                  </div>
                  <div :class="cls.field">
                    <label :class="cls.fieldLabel">Date de début <span class="text-danger">*</span></label>
                    <input type="date" v-model="form.startDate" :class="cls.fieldInput" />
                  </div>
                  <div :class="cls.field">
                    <label :class="cls.fieldLabel">Salaire mensuel brut (MGA) <span class="text-danger">*</span></label>
                    <input type="number" min="0" v-model.number="form.salary" :class="cls.fieldInput" placeholder="0" />
                  </div>
                </div>
              </FormSection>

            </div>
          </div>
        </template>
      </CreateModalShell>

      <!-- Modale Retourner -->
      <ModalShell :open="returnModal.open" title="Retourner le contrat" max-width="max-w-[420px]" @close="returnModal.open = false">
        <label :class="cls.fieldLabel">Commentaire *</label>
        <textarea v-model="returnModal.comment" :class="cls.fieldTextarea" placeholder="Expliquez les corrections requises…" rows="4"></textarea>
        <div v-if="returnModal.error" :class="cls.fieldError">{{ returnModal.error }}</div>
        <template #footer>
          <button :class="cls.btnPrimary" @click="confirmReturn"><Undo2 class="w-4 h-4" /> Retourner</button>
          <button :class="cls.btnOutline" @click="returnModal.open = false">Annuler</button>
        </template>
      </ModalShell>

      <!-- Modale Refuser -->
      <ModalShell :open="rejectModal.open" title="Refuser le contrat" max-width="max-w-[420px]" @close="rejectModal.open = false">
        <label :class="cls.fieldLabel">Motif du refus *</label>
        <textarea v-model="rejectModal.reason" :class="cls.fieldTextarea" placeholder="Indiquez le motif du refus…" rows="4"></textarea>
        <div v-if="rejectModal.error" :class="cls.fieldError">{{ rejectModal.error }}</div>
        <template #footer>
          <button :class="cls.btnPrimary" @click="confirmReject">Confirmer le refus</button>
          <button :class="cls.btnOutline" @click="rejectModal.open = false">Annuler</button>
        </template>
      </ModalShell>
    </ListPageLayout>

    <!-- ── Sous-vue Modèles de contrat ───────────────────────────── -->
    <div v-else class="px-7 py-6">
      <div :class="L.pageHeader">
        <div>
          <div :class="L.pageTitle">Modèles de contrat</div>
          <div :class="L.pageSub">{{ contractStore.templates.length }} modèle(s)</div>
        </div>
        <button :class="L.btnPrimary" @click="openNewTemplate">
          <Plus class="w-4 h-4" /> Nouveau modèle
        </button>
      </div>

      <div v-if="contractStore.templates.length > 0" class="grid grid-cols-3 gap-3.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div v-for="t in contractStore.templates" :key="t.id" :class="[L.card, 'flex flex-col gap-2.5']">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-foreground truncate">{{ t.name }}</span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-primary/10 text-primary shrink-0">{{ t.contractType }}</span>
          </div>
          <p class="text-[12px] text-muted-foreground line-clamp-3">{{ excerpt(t.content) }}</p>
          <button :class="L.btnOutline" class="self-start" @click="openEditTemplate(t)"><Pencil class="w-3.5 h-3.5" /> Modifier</button>
        </div>
      </div>
      <div v-else :class="L.emptyState">
        <FileText class="w-8 h-8" />
        <p class="text-[13px]">Aucun modèle de contrat</p>
      </div>

      <!-- Modale Nouveau modèle / Modifier -->
      <ModalShell :open="templateModal.open" :title="templateModal.editingId ? 'Modifier le modèle' : 'Nouveau modèle de contrat'" max-width="max-w-[560px]" @close="templateModal.open = false">
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Nom du modèle *</label>
          <input v-model="templateModal.name" :class="cls.fieldInput" placeholder="ex : CDI standard" />
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Type de contrat *</label>
          <select v-model="templateModal.contractType" :class="cls.fieldSelect">
            <option v-for="c in CONTRACT_TYPES" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Contenu *</label>
          <textarea v-model="templateModal.content" :class="cls.fieldTextarea" rows="6" placeholder="Texte du contrat…"></textarea>
          <p class="text-[11px] text-muted-foreground mt-1">{{ placeholderHint }}</p>
        </div>
        <div v-if="templateModal.error" :class="cls.fieldError">{{ templateModal.error }}</div>
        <template #footer>
          <button :class="cls.btnPrimary" @click="confirmTemplate"><Check class="w-4 h-4" /> Enregistrer</button>
          <button :class="cls.btnOutline" @click="templateModal.open = false">Annuler</button>
        </template>
      </ModalShell>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Contrats à générer (Contract) + Modèles de contrat (ContractTemplate),
 * module Recrutement, design uniquement (données fictives, voir
 * src/stores/recruitment). Deux sous-vues basculables par un onglet local
 * (une seule route). Sous-vue Contrats calquée sur EmployeeListView.vue /
 * HiringRequestsView.vue : ListPageLayout + boutons de workflow repris à
 * l'identique de MissionWorkflowActions.vue.
 */
import { ref, reactive, computed, watch } from 'vue'
import {
  Plus, Send, Check, Undo2, X, Ban, Mail, CheckCircle2, XCircle,
  FileSignature, FileText, Clock, Pencil,
} from 'lucide-vue-next'
import { ListPageLayout, StatusPill, CreateModalShell } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import FormSection from '../../components/ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { formatDate } from '../../lib/date'
import { confirmDialog } from '../../lib/confirm'
import { useContractStore, useApplicationStore } from '../../stores/recruitment'
import type { Contract, ContractTemplate } from '../../stores/recruitment'
import { useEntityStore } from '../../stores/entities'

const contractStore = useContractStore()
const applicationStore = useApplicationStore()
const entityStore = useEntityStore()
if (entityStore.entities.length === 0) entityStore.fetchAll()

// Construit en JS (pas en template) : deux "}}" litteraux dans un meme
// mustache Vue font echouer le compilateur (il cherche la premiere sequence
// "}}" pour fermer l'interpolation, meme a l'interieur d'une chaine).
const placeholderHint = 'Placeholders disponibles : ' +
  ['nom_candidat', 'poste', 'entite', 'date_debut', 'salaire'].map(p => `{{${p}}}`).join(', ') + '.'

const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Freelance', label: 'Freelance' },
]

/* ── Onglets ────────────────────────────────────────────────── */
const activeTab = ref<'contracts' | 'templates'>('contracts')
const tabBtn = 'px-3 py-1.5 rounded text-[13px] font-medium cursor-pointer inline-flex items-center gap-1.5 transition-colors'
const tabBtnActive = tabBtn + ' bg-primary text-primary-foreground'
const tabBtnInactive = tabBtn + ' bg-transparent text-muted-foreground hover:text-foreground'

/* ── Styles (KPI + boutons de workflow, repris à l'identique de
   MissionWorkflowActions.vue) ─────────────────────────────────── */
const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold leading-none'
const kpiLbl = 'text-xs text-muted-foreground mt-0.5'

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const approveCls = btn + ' bg-success-bg text-success hover:brightness-95'
const returnCls  = btn + ' bg-info-bg text-info hover:brightness-95'
const rejectCls  = btn + ' bg-danger-bg text-danger hover:brightness-95'
const cancelCls  = btn + ' bg-neutral-bg text-neutral hover:brightness-95'
const infoCls    = btn + ' bg-info-bg text-info hover:brightness-95'

const CANCELLABLE: Contract['status'][] = ['Draft', 'PendingApproval', 'Approved', 'SentToCandidate']

function formatSalary(n: number): string { return `${n.toLocaleString('fr-FR')} MGA` }

/* ── Colonnes ───────────────────────────────────────────────── */
const columns: ListColumn[] = [
  { key: 'candidateName', label: 'Candidat', sortable: true, hideable: false, width: 180 },
  { key: 'jobTitle', label: 'Poste', sortable: true, width: 170 },
  { key: 'entityName', label: 'Entité', sortable: true, width: 170 },
  { key: 'templateName', label: 'Modèle', width: 140 },
  { key: 'startDate', label: 'Date de début', sortable: true, width: 130 },
  { key: 'salary', label: 'Salaire', align: 'right', sortable: true, width: 140 },
  { key: 'status', label: 'Statut', width: 160 },
]

/* ── KPIs ───────────────────────────────────────────────────── */
const pendingCount = computed(() => contractStore.items.filter(c => c.status === 'PendingApproval').length)
const sentCount = computed(() => contractStore.items.filter(c => c.status === 'SentToCandidate').length)
const acceptedCount = computed(() => contractStore.items.filter(c => c.status === 'AcceptedByCandidate').length)

/* ── Scope / recherche / tri / pagination ──────────────────────
   Même pattern que EmployeeListView.vue : la vue calcule elle-même
   "filtered" puis passe la page déjà filtrée/triée à ListPageLayout. */
const scopeOptions = [
  { value: '', label: 'Tous' },
  { value: 'Draft', label: 'Brouillon' },
  { value: 'PendingApproval', label: 'En attente' },
  { value: 'Approved', label: 'Approuvé' },
  { value: 'SentToCandidate', label: 'Envoyé au candidat' },
  { value: 'AcceptedByCandidate', label: 'Accepté' },
  { value: 'RefusedByCandidate', label: 'Refusé par candidat' },
  { value: 'Rejected', label: 'Refusé' },
  { value: 'Returned', label: 'Retourné' },
  { value: 'Cancelled', label: 'Annulé' },
]
const activeScope = ref('')
const fEntity = ref('')
const fTemplate = ref('')
const searchQuery = ref('')
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = ref(15)

watch([activeScope, fEntity, fTemplate, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  fEntity.value = ''; fTemplate.value = ''; searchQuery.value = ''; activeScope.value = ''; page.value = 1
}

const sortFieldMap: Record<string, keyof Contract> = {
  candidateName: 'candidateName', jobTitle: 'jobTitle', entityName: 'entityName', startDate: 'startDate', salary: 'salary',
}

const filtered = computed(() => {
  let rows = contractStore.items.filter(c => {
    if (activeScope.value && c.status !== activeScope.value) return false
    if (fEntity.value && c.entityName !== fEntity.value) return false
    if (fTemplate.value && c.templateName !== fTemplate.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!c.candidateName.toLowerCase().includes(q) && !c.jobTitle.toLowerCase().includes(q) && !c.entityName.toLowerCase().includes(q)) return false
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

/* ── Aperçu du contenu du contrat (placeholders remplacés) ─────── */
function contractPreview(item: Contract): string {
  const tpl = contractStore.templates.find(t => t.id === item.templateId)
  if (!tpl) return ''
  return tpl.content
    .replaceAll('{{nom_candidat}}', item.candidateName)
    .replaceAll('{{poste}}', item.jobTitle)
    .replaceAll('{{entite}}', item.entityName)
    .replaceAll('{{date_debut}}', formatDate(item.startDate))
    .replaceAll('{{salaire}}', item.salary.toLocaleString('fr-FR'))
}

/* ── Génération d'un contrat ────────────────────────────────── */
// Candidatures retenues n'ayant pas déjà de contrat généré.
const eligibleApplications = computed(() =>
  applicationStore.items.filter(a => a.status === 'Retained' && !contractStore.items.some(c => c.applicationId === a.id)),
)

const showCreate = ref(false)
const error = ref<string | null>(null)
const form = reactive({
  applicationId: '', templateId: '', jobTitle: '', entityId: '', startDate: '', salary: 0,
})

function resetForm() {
  Object.assign(form, { applicationId: '', templateId: '', jobTitle: '', entityId: '', startDate: '', salary: 0 })
  error.value = null
}

// Pré-remplit le poste depuis l'offre liée à la candidature, si disponible.
function onApplicationChange() {
  const app = applicationStore.items.find(a => a.id === form.applicationId)
  if (app?.jobOfferTitle) form.jobTitle = app.jobOfferTitle
}

function validate(): boolean {
  if (!form.applicationId) { error.value = 'Sélectionnez une candidature'; return false }
  if (!form.templateId) { error.value = 'Sélectionnez un modèle de contrat'; return false }
  if (!form.jobTitle.trim()) { error.value = 'Le poste est requis'; return false }
  if (!form.entityId) { error.value = "L'entité est requise"; return false }
  if (!form.startDate) { error.value = 'La date de début est requise'; return false }
  if (!form.salary || form.salary <= 0) { error.value = 'Le salaire doit être supérieur à 0'; return false }
  error.value = null
  return true
}

function buildPayload() {
  const app = applicationStore.items.find(a => a.id === form.applicationId)
  const tpl = contractStore.templates.find(t => t.id === form.templateId)
  const entity = entityStore.approvedEntities.find(e => e.id === form.entityId)
  return {
    applicationId: form.applicationId,
    candidateName: app?.candidateName ?? '',
    templateId: form.templateId,
    templateName: tpl?.name ?? '',
    jobTitle: form.jobTitle.trim(),
    entityName: entity?.name ?? '',
    startDate: form.startDate,
    salary: form.salary,
  }
}

function create() {
  if (!validate()) return
  contractStore.generate(buildPayload())
  showCreate.value = false
  resetForm()
}

/* ── Actions de workflow ────────────────────────────────────── */
function submitContract(item: Contract) { contractStore.submit(item.id) }
function approveContract(item: Contract) { contractStore.approve(item.id) }
function sendContract(item: Contract) { contractStore.sendToCandidate(item.id) }

async function acceptContract(item: Contract) {
  if (await confirmDialog('Confirmer que le candidat accepte ce contrat ?')) contractStore.candidateAccept(item.id)
}
async function refuseContract(item: Contract) {
  if (await confirmDialog('Confirmer que le candidat refuse ce contrat ?')) contractStore.candidateRefuse(item.id)
}
async function cancelContract(item: Contract) {
  if (await confirmDialog('Annuler ce contrat ?')) contractStore.cancel(item.id)
}

const returnModal = reactive({ open: false, itemId: '', comment: '', error: '' })
function openReturn(item: Contract) { Object.assign(returnModal, { open: true, itemId: item.id, comment: '', error: '' }) }
function confirmReturn() {
  if (returnModal.comment.trim().length === 0) { returnModal.error = 'Le commentaire est requis'; return }
  contractStore.returnItem(returnModal.itemId, returnModal.comment.trim())
  returnModal.open = false
}

const rejectModal = reactive({ open: false, itemId: '', reason: '', error: '' })
function openReject(item: Contract) { Object.assign(rejectModal, { open: true, itemId: item.id, reason: '', error: '' }) }
function confirmReject() {
  if (rejectModal.reason.trim().length === 0) { rejectModal.error = 'Le motif est requis'; return }
  contractStore.reject(rejectModal.itemId, rejectModal.reason.trim())
  rejectModal.open = false
}

/* ── Modèles de contrat ─────────────────────────────────────── */
function excerpt(content: string): string {
  return content.length > 140 ? content.slice(0, 140).trim() + '…' : content
}

const templateModal = reactive({ open: false, editingId: '', name: '', contractType: 'CDI', content: '', error: '' })
function openNewTemplate() {
  Object.assign(templateModal, { open: true, editingId: '', name: '', contractType: 'CDI', content: '', error: '' })
}
function openEditTemplate(t: ContractTemplate) {
  Object.assign(templateModal, { open: true, editingId: t.id, name: t.name, contractType: t.contractType, content: t.content, error: '' })
}
function confirmTemplate() {
  if (!templateModal.name.trim()) { templateModal.error = 'Le nom est requis'; return }
  if (!templateModal.content.trim()) { templateModal.error = 'Le contenu est requis'; return }
  if (templateModal.editingId) {
    contractStore.updateTemplate(templateModal.editingId, {
      name: templateModal.name.trim(), contractType: templateModal.contractType, content: templateModal.content.trim(),
    })
  } else {
    contractStore.createTemplate(templateModal.name.trim(), templateModal.contractType, templateModal.content.trim())
  }
  templateModal.open = false
}
</script>
