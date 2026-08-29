<script setup lang="ts">
/**
 * Fiche d'une offre d'emploi (lecture seule), sur CardModalShell, pattern
 * frontdesk. Pas de mode édition dans ce module (design uniquement, voir
 * src/stores/recruitment). Navigateur de N° à gauche numéroté par position
 * dans la liste courante : JobOffer n'a pas de code de référence propre,
 * contrairement à MissionOrder (referenceCode) ou Employee (code).
 */
import { ref, computed, watch } from 'vue'
import { Eye, Users, Link2, Check, Coins } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import JobOfferWorkflowActions from './JobOfferWorkflowActions.vue'
import * as cls from '../../lib/formClasses'
import { formatDate } from '../../lib/date'
import { useJobOfferStore } from '../../stores/recruitment'
import type { JobOffer } from '../../stores/recruitment'

const props = defineProps<{
  /** Offres de la liste courante (déjà filtrée par la vue), pour la navigation N° */
  items: JobOffer[]
  /** Offre affichée */
  itemId: string
}>()

const emit = defineEmits<{ close: [] }>()

const jobOfferStore = useJobOfferStore()

const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'

const currentId = ref(props.itemId)
watch(() => props.itemId, (v) => { currentId.value = v })

const current = computed<JobOffer | null>(() => props.items.find(o => o.id === currentId.value) ?? null)
const currentIndex = computed(() => props.items.findIndex(o => o.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.items.length - 1)

// Numérotation par position (1, 2, 3…) : la seule numérotation stable
// disponible ici, faute de référence métier sur l'offre elle-même.
const sidebarItems = computed(() => props.items.map((o, i) => ({ no: String(i + 1), label: o.title })))
const currentNo = computed(() => (currentIndex.value >= 0 ? String(currentIndex.value + 1) : null))

function goPrev() { if (hasPrev.value) currentId.value = props.items[currentIndex.value - 1]!.id }
function goNext() { if (hasNext.value) currentId.value = props.items[currentIndex.value + 1]!.id }
function selectSidebar(no: string) {
  const o = props.items[Number(no) - 1]
  if (o) currentId.value = o.id
}

const showStats = computed(() => current.value?.status === 'Published' || current.value?.status === 'Closed')

// Lien du portail carriere public (voir router/index.ts, route
// public-careers-offer) — n'a de sens que pour une offre reellement
// publiee, une offre en brouillon/attente n'est pas visible sur cette page.
function formatCost(n: number): string { return `${n.toLocaleString('fr-FR')} MGA` }

const publicUrl = computed(() => current.value ? `${window.location.origin}/careers/${current.value.id}` : '')
const copied = ref(false)
async function copyPublicUrl() {
  await navigator.clipboard.writeText(publicUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="current.title"
    banner-label="Offre d'emploi"
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
      <JobOfferWorkflowActions :item="current" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Section Offre -->
        <FormSection title="Offre" :recaps="[current.entityName, current.contractType, current.location]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field" class="col-span-2">
              <label :class="cls.fieldLabel">Titre</label>
              <div :class="readBox">{{ current.title }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Entité</label>
              <div :class="readBox">{{ current.entityName }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Type de contrat</label>
              <div :class="readBox">{{ current.contractType }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Lieu</label>
              <div :class="readBox">{{ current.location }}</div>
            </div>
            <div v-if="current.publishedAt" :class="cls.field">
              <label :class="cls.fieldLabel">Publiée le</label>
              <div :class="readBox">{{ formatDate(current.publishedAt) }}</div>
            </div>
          </div>
          <div v-if="current.rejectionReason" :class="[cls.fieldErrorBlock, 'mt-3']">{{ current.rejectionReason }}</div>
          <div v-if="current.status === 'Published'" :class="cls.field" class="mt-3">
            <label :class="cls.fieldLabel">Lien public (portail carrière)</label>
            <div class="flex items-center gap-2">
              <div :class="readBox" class="flex-1 truncate font-mono text-xs">{{ publicUrl }}</div>
              <button type="button" :class="cls.btnOutline" class="shrink-0" @click="copyPublicUrl">
                <Check v-if="copied" class="w-3.5 h-3.5 text-success" />
                <Link2 v-else class="w-3.5 h-3.5" />
                {{ copied ? 'Copié' : 'Copier' }}
              </button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1">N'importe qui avec ce lien peut voir l'offre et postuler, sans se connecter.</p>
          </div>
        </FormSection>

        <!-- Section Description -->
        <FormSection title="Description">
          <p class="text-[13px] text-foreground whitespace-pre-line">{{ current.description }}</p>
        </FormSection>

        <!-- Section Statistiques -->
        <FormSection v-if="showStats" title="Statistiques" :recaps="[`${current.views} vue(s)`, `${jobOfferStore.applicationsCount(current.id)} candidature(s)`]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Vues</label>
              <div class="flex items-center gap-2 h-[38px]">
                <Eye class="w-4 h-4 text-muted-foreground" />
                <span class="text-[13px] font-medium text-foreground">{{ current.views }}</span>
              </div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Candidatures</label>
              <div class="flex items-center gap-2 h-[38px]">
                <Users class="w-4 h-4 text-muted-foreground" />
                <span class="text-[13px] font-medium text-foreground">{{ jobOfferStore.applicationsCount(current.id) }}</span>
              </div>
            </div>
            <div v-if="current.recruitmentCost !== undefined" :class="cls.field">
              <label :class="cls.fieldLabel">Coût du recrutement</label>
              <div class="flex items-center gap-2 h-[38px]">
                <Coins class="w-4 h-4 text-muted-foreground" />
                <span class="text-[13px] font-medium text-foreground">{{ formatCost(current.recruitmentCost) }}</span>
              </div>
            </div>
          </div>
        </FormSection>
      </div>
    </template>
  </CardModalShell>
</template>
