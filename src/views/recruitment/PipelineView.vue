<template>
  <div class="px-7 py-6">

    <!-- En-tête -->
    <div :class="L.pageHeader">
      <div>
        <div :class="L.pageTitle">Pipeline de recrutement</div>
        <div :class="L.pageSub">Candidatures groupées par étape, {{ totalApplications }} au total</div>
      </div>
    </div>

    <!-- Colonnes -->
    <div class="flex gap-3 overflow-x-auto pb-1">
      <div v-for="col in COLUMNS" :key="col.status" class="w-[260px] min-w-[260px] shrink-0 bg-card border border-border rounded-lg flex flex-col">
        <div class="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <StatusPill :status="col.status" />
          <span class="text-xs font-semibold text-muted-foreground">{{ applicationsByStatus(col.status).length }}</span>
        </div>
        <div class="p-2.5 flex flex-col gap-2">
          <div v-if="applicationsByStatus(col.status).length === 0" class="text-xs text-muted-foreground text-center py-4">
            Aucune candidature
          </div>
          <div v-for="app in applicationsByStatus(col.status)" :key="app.id" class="bg-background border border-border rounded-md p-2.5">
            <div class="text-sm font-medium truncate">{{ app.candidateName }}</div>
            <div class="text-xs text-muted-foreground truncate mt-0.5">{{ app.jobOfferTitle ?? sourceLabel(app.source) }}</div>
            <div class="text-[11px] text-muted-foreground mt-1.5">Candidature du {{ formatDate(app.appliedAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Récapitulatif -->
    <div :class="[L.card, 'mt-3']">
      <div :class="L.cardHeader">
        <div :class="L.cardTitle"><TrendingUp class="w-4 h-4 text-primary" /> Indicateurs du pipeline</div>
      </div>
      <div class="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <div>
          <div class="text-[22px] font-bold leading-none">{{ conversionRate }}%</div>
          <div class="text-xs text-muted-foreground mt-1">Taux de conversion (candidatures retenues / total)</div>
        </div>
        <div>
          <div class="text-[22px] font-bold leading-none">{{ avgResponseTimeLabel }}</div>
          <div class="text-xs text-muted-foreground mt-1">Temps moyen avant première réponse (valeur indicative)</div>
        </div>
        <div>
          <div class="text-[22px] font-bold leading-none">{{ avgRecruitmentCostLabel }}</div>
          <div class="text-xs text-muted-foreground mt-1">Coût moyen par recrutement ({{ closedOffersWithCost.length }} offre(s) clôturée(s) avec coût renseigné)</div>
        </div>
      </div>
      <div class="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border">
        Indicateurs calculés à titre indicatif à partir des données de démonstration.
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
import { StatusPill } from '../../components'
import * as L from '../../lib/listClasses'
import { formatDate } from '../../lib/date'
import { useApplicationStore, useJobOfferStore } from '../../stores/recruitment'
import type { ApplicationStatus, ApplicationSource } from '../../stores/recruitment'

const applicationStore = useApplicationStore()
const jobOfferStore = useJobOfferStore()

const COLUMNS: { status: ApplicationStatus }[] = [
  { status: 'New' },
  { status: 'InReview' },
  { status: 'InterviewScheduled' },
  { status: 'Retained' },
  { status: 'Rejected' },
]

function applicationsByStatus(status: ApplicationStatus) {
  return applicationStore.items.filter(a => a.status === status)
}

const SOURCE_LABELS: Record<ApplicationSource, string> = {
  Offer: 'Candidature sur offre',
  Spontaneous: 'Candidature spontanée',
}
function sourceLabel(source: ApplicationSource): string {
  return SOURCE_LABELS[source] ?? source
}

// ── Récapitulatif ────────────────────────────────────────────────
const totalApplications = computed(() => applicationStore.items.length)

const conversionRate = computed(() => {
  const total = applicationStore.items.length
  if (total === 0) return 0
  const retained = applicationStore.items.filter(a => a.status === 'Retained').length
  return Math.round((retained / total) * 100)
})

// Estimation illustrative : écart en jours entre la candidature et sa
// première note (premier échange tracé), moyenné sur les candidatures qui
// en ont au moins une. Faute de note, il n'y a rien à mesurer.
const avgResponseDays = computed(() => {
  const samples = applicationStore.items
    .filter(a => a.notes.length > 0)
    .map(a => {
      const firstNoteTime = Math.min(...a.notes.map(n => new Date(n.date).getTime()))
      const appliedTime = new Date(a.appliedAt).getTime()
      return Math.max(0, Math.round((firstNoteTime - appliedTime) / 86400000))
    })
  if (samples.length === 0) return null
  return Math.round(samples.reduce((sum, v) => sum + v, 0) / samples.length)
})

const avgResponseTimeLabel = computed(() => {
  const v = avgResponseDays.value
  if (v === null) return 'Non disponible'
  return `${v} jour${v > 1 ? 's' : ''}`
})

// Coût par recrutement = coût de campagne (JobOffer.recruitmentCost, saisi à
// la clôture — voir JobOfferWorkflowActions.vue), moyenné sur les offres
// clôturées qui l'ont renseigné. Une offre clôturée sans coût saisi n'est
// pas comptée comme "coût 0" : elle est simplement exclue de la moyenne.
const closedOffersWithCost = computed(() =>
  jobOfferStore.items.filter((o): o is typeof o & { recruitmentCost: number } => o.status === 'Closed' && o.recruitmentCost !== undefined),
)
const avgRecruitmentCost = computed(() => {
  const offers = closedOffersWithCost.value
  if (offers.length === 0) return null
  return Math.round(offers.reduce((sum, o) => sum + o.recruitmentCost, 0) / offers.length)
})
const avgRecruitmentCostLabel = computed(() => {
  const v = avgRecruitmentCost.value
  return v === null ? 'Non disponible' : `${v.toLocaleString('fr-FR')} MGA`
})
</script>
