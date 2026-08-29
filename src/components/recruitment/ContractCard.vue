<script setup lang="ts">
/**
 * Fiche d'un contrat (lecture seule), sur CardModalShell, pattern frontdesk.
 * Navigateur de N° à gauche, barre d'actions métier (ContractWorkflowActions),
 * contenu organisé en FormSection. Calqué sur MissionCard.vue.
 */
import { ref, computed, watch } from 'vue'
import { Download } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import ContractWorkflowActions from './ContractWorkflowActions.vue'
import * as cls from '../../lib/formClasses'
import { formatDate } from '../../lib/date'
import { resolveContractContent, buildContractHtml, downloadContractPdf } from '../../lib/contractDocument'
import { useContractStore } from '../../stores/recruitment'
import type { Contract } from '../../stores/recruitment'

const props = defineProps<{
  /** Contrats de la liste courante (pour la navigation N°) */
  items: Contract[]
  /** Contrat affiché */
  itemId: string
}>()

const emit = defineEmits<{ close: [] }>()

const contractStore = useContractStore()

function formatSalary(n: number): string { return `${n.toLocaleString('fr-FR')} MGA` }

const currentId = ref(props.itemId)
watch(() => props.itemId, (v) => { currentId.value = v })

const current = computed<Contract | null>(() => props.items.find(c => c.id === currentId.value) ?? null)
const currentIndex = computed(() => props.items.findIndex(c => c.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.items.length - 1)

const sidebarItems = computed(() => props.items.map((c, i) => ({ no: String(i + 1), label: c.candidateName })))
const currentNo = computed(() => (currentIndex.value >= 0 ? String(currentIndex.value + 1) : null))

function goPrev() { if (hasPrev.value) currentId.value = props.items[currentIndex.value - 1]!.id }
function goNext() { if (hasNext.value) currentId.value = props.items[currentIndex.value + 1]!.id }
function selectSidebar(no: string) {
  const c = props.items[Number(no) - 1]
  if (c) currentId.value = c.id
}

/* ── Document du contrat (aperçu écran + PDF) ──────────────────────
   Voir lib/contractDocument.ts : document HTML autonome, réutilisé tel quel
   pour l'aperçu (iframe) et pour l'impression/PDF (nouvel onglet). */
function documentInput(item: Contract) {
  const tpl = contractStore.templates.find(t => t.id === item.templateId)
  const resolvedContent = tpl
    ? resolveContractContent(tpl.content, {
        candidateName: item.candidateName, jobTitle: item.jobTitle, entityName: item.entityName,
        startDate: formatDate(item.startDate), salary: formatSalary(item.salary),
      })
    : ''
  return {
    candidateName: item.candidateName, jobTitle: item.jobTitle, entityName: item.entityName,
    templateName: item.templateName, resolvedContent,
  }
}

const documentHtml = computed(() => (current.value ? buildContractHtml(documentInput(current.value)) : ''))
function downloadPdf() { if (current.value) downloadContractPdf(documentInput(current.value)) }

const pageTitle = computed(() => current.value?.candidateName ?? '')
const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="pageTitle"
    banner-label="Contrat"
    :is-edit-mode="false"
    :show-edit="false"
    :show-title-new-button="false"
    :sidebar-items="sidebarItems"
    :current-no="currentNo"
    :has-prev="hasPrev"
    :has-next="hasNext"
    @close="emit('close')"
    @go-prev="goPrev"
    @go-next="goNext"
    @select-sidebar="selectSidebar"
  >
    <template #title-badges>
      <StatusPill :status="current.status" />
    </template>

    <template #action-buttons>
      <ContractWorkflowActions :item="current" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Section Contrat -->
        <FormSection title="Contrat" :recaps="[current.jobTitle, current.entityName]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Candidat</label>
              <div :class="readBox">{{ current.candidateName }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Poste</label>
              <div :class="readBox">{{ current.jobTitle }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Entité</label>
              <div :class="readBox">{{ current.entityName }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Modèle</label>
              <div :class="readBox">{{ current.templateName }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date de début</label>
              <div :class="readBox">{{ formatDate(current.startDate) }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Salaire mensuel brut</label>
              <div :class="readBox">{{ formatSalary(current.salary) }}</div>
            </div>
          </div>
          <div v-if="current.rejectionReason" :class="cls.fieldErrorBlock" class="mt-3">{{ current.rejectionReason }}</div>
        </FormSection>

        <!-- Section Document du contrat -->
        <FormSection title="Document du contrat">
          <div class="border border-border rounded-lg overflow-hidden h-[560px] bg-muted">
            <iframe :srcdoc="documentHtml" class="w-full h-full border-0" title="Aperçu du contrat" />
          </div>
          <button type="button" :class="[cls.btnPrimary, 'mt-3']" @click="downloadPdf">
            <Download class="w-4 h-4" /> Télécharger le PDF
          </button>
          <p class="text-[11px] text-muted-foreground mt-1.5">
            Ouvre le document dans un nouvel onglet et lance l'impression — choisissez "Enregistrer au format PDF" comme destination pour le télécharger.
          </p>
        </FormSection>
      </div>
    </template>
  </CardModalShell>
</template>
