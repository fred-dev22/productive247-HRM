<script setup lang="ts">
/**
 * Fiche d'un entretien (lecture seule), sur CardModalShell, pattern
 * frontdesk. Pas de mode édition dans ce module (design uniquement, voir
 * src/stores/recruitment). Navigateur de N° à gauche numéroté par position
 * dans la liste courante : Interview n'a pas de code de référence propre.
 */
import { ref, computed, watch } from 'vue'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import InterviewWorkflowActions from './InterviewWorkflowActions.vue'
import * as cls from '../../lib/formClasses'
import type { Interview } from '../../stores/recruitment'

const props = defineProps<{
  /** Entretiens de la liste courante (déjà filtrée par la vue), pour la navigation N° */
  items: Interview[]
  /** Entretien affiché */
  itemId: string
}>()

const emit = defineEmits<{ close: [] }>()

const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'

const currentId = ref(props.itemId)
watch(() => props.itemId, (v) => { currentId.value = v })

const current = computed<Interview | null>(() => props.items.find(i => i.id === currentId.value) ?? null)
const currentIndex = computed(() => props.items.findIndex(i => i.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.items.length - 1)

// Numérotation par position (1, 2, 3…) : la seule numérotation stable
// disponible ici, faute de référence métier sur l'entretien lui-même.
const sidebarItems = computed(() => props.items.map((i, idx) => ({ no: String(idx + 1), label: i.candidateName })))
const currentNo = computed(() => (currentIndex.value >= 0 ? String(currentIndex.value + 1) : null))

function goPrev() { if (hasPrev.value) currentId.value = props.items[currentIndex.value - 1]!.id }
function goNext() { if (hasNext.value) currentId.value = props.items[currentIndex.value + 1]!.id }
function selectSidebar(no: string) {
  const i = props.items[Number(no) - 1]
  if (i) currentId.value = i.id
}

/* ── Formatage date et heure (ex : "25/08/2026 10:00") ─────────── */
function formatDateTime(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso)
  if (!m) return iso
  const [, y, mo, d, h, mi] = m
  return `${d}/${mo}/${y} ${h}:${mi}`
}
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="current.candidateName"
    banner-label="Entretien"
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
      <InterviewWorkflowActions :item="current" />
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Section Entretien -->
        <FormSection title="Entretien" :recaps="[current.jobOfferTitle, formatDateTime(current.scheduledAt)]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Candidat</label>
              <div :class="readBox">{{ current.candidateName }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Offre</label>
              <div :class="readBox">{{ current.jobOfferTitle }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date et heure</label>
              <div :class="readBox">{{ formatDateTime(current.scheduledAt) }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Lieu</label>
              <div :class="readBox">{{ current.location }}</div>
            </div>
            <div :class="cls.field" class="col-span-2">
              <label :class="cls.fieldLabel">Participants</label>
              <div :class="[readBox, 'h-auto min-h-[38px] py-2']">{{ current.participants.join(', ') }}</div>
            </div>
          </div>
        </FormSection>

        <!-- Section Évaluation -->
        <FormSection v-if="current.evaluation" title="Évaluation" :recaps="[`${current.evaluation.score}/5`, current.evaluation.interviewerName]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Note</label>
              <div :class="readBox">{{ current.evaluation.score }} / 5</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Évaluateur</label>
              <div :class="readBox">{{ current.evaluation.interviewerName }}</div>
            </div>
            <div :class="cls.field" class="col-span-2">
              <label :class="cls.fieldLabel">Commentaire</label>
              <div :class="[readBox, 'h-auto min-h-[38px] py-2 whitespace-pre-line']">{{ current.evaluation.comment }}</div>
            </div>
          </div>
        </FormSection>
      </div>
    </template>
  </CardModalShell>
</template>
