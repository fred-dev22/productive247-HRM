<template>
  <ListPageLayout
    title="Candidatures"
    :subtitle="`${filtered.length} candidature(s) liée(s) à une offre`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} candidature(s)`"
    search-placeholder="Rechercher un candidat, un email…"
    :page-size-options="[15, 25, 50]"
    scope-label="Candidatures :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
  >
    <!-- KPIs -->
    <template #above-table>
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-primary/10"><Users class="w-[18px] h-[18px] text-primary" /></div>
          <div><div :class="kpiVal">{{ applicationStore.fromOffers.length }}</div><div :class="kpiLbl">Total</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-info-bg"><UserPlus class="w-[18px] h-[18px] text-info" /></div>
          <div><div :class="kpiVal">{{ newCount }}</div><div :class="kpiLbl">Nouvelles</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-warning-bg"><Clock class="w-[18px] h-[18px] text-warning" /></div>
          <div><div :class="kpiVal">{{ inReviewCount }}</div><div :class="kpiLbl">En cours</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-success-bg"><UserCheck class="w-[18px] h-[18px] text-success" /></div>
          <div><div :class="kpiVal">{{ retainedCount }}</div><div :class="kpiLbl">Retenues</div></div>
        </div>
      </div>
    </template>

    <!-- Cellules -->
    <template #cell-candidate="{ item }"><span class="font-medium text-foreground text-[13px] truncate">{{ item.candidateName }}</span></template>
    <template #cell-candidateEmail="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.candidateEmail }}</span></template>
    <template #cell-candidatePhone="{ item }"><span class="text-muted-foreground text-xs whitespace-nowrap">{{ item.candidatePhone }}</span></template>
    <template #cell-jobOfferTitle="{ item }"><span class="text-foreground text-xs truncate">{{ item.jobOfferTitle || 'Candidature spontanée' }}</span></template>
    <template #cell-cvFileName="{ item }">
      <span class="inline-flex items-center gap-1 text-xs text-muted-foreground min-w-0">
        <FileText class="w-3.5 h-3.5 shrink-0" /> <span class="truncate">{{ item.cvFileName }}</span>
      </span>
    </template>
    <template #cell-status="{ item }"><StatusPill :status="item.status" /></template>
    <template #cell-appliedAt="{ item }"><span class="text-muted-foreground text-xs">{{ formatDate(item.appliedAt) }}</span></template>

    <!-- Aperçu rapide -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div>
          <div class="text-sm font-semibold text-foreground truncate">{{ item.candidateName }}</div>
          <div class="text-[11px] text-muted-foreground truncate">{{ item.jobOfferTitle || 'Candidature spontanée' }}</div>
        </div>
        <div><StatusPill :status="item.status" /></div>

        <div class="grid grid-cols-1 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Email</div>{{ item.candidateEmail }}</div>
          <div><div class="text-muted-foreground text-[11px]">Téléphone</div>{{ item.candidatePhone }}</div>
          <div>
            <div class="text-muted-foreground text-[11px]">CV</div>
            <span class="inline-flex items-center gap-1"><FileText class="w-3.5 h-3.5" />{{ item.cvFileName }}</span>
          </div>
          <div><div class="text-muted-foreground text-[11px]">Candidature reçue le</div>{{ formatDate(item.appliedAt) }}</div>
        </div>

        <div :class="cls.field">
          <label :class="cls.fieldLabel">Statut de la candidature</label>
          <select :class="cls.fieldSelect" :value="item.status" @change="onStatusChange(item, $event)">
            <option value="New">Nouvelle</option>
            <option value="InReview">En cours</option>
            <option value="InterviewScheduled">Entretien planifié</option>
            <option value="Retained">Retenue</option>
            <option value="Rejected">Refusé</option>
          </select>
        </div>

        <button v-if="item.status !== 'Retained'" :class="cls.btnOutline" class="w-full justify-center" @click="addToPool(item)">
          <Star class="w-4 h-4" /> Ajouter au vivier de talents
        </button>

        <div class="pt-2 border-t border-border flex flex-col gap-2">
          <div class="text-[11px] font-semibold text-muted-foreground tracking-wide">NOTES</div>
          <div v-if="item.notes.length === 0" class="text-xs text-muted-foreground italic">Aucune note pour le moment.</div>
          <div v-for="(note, i) in item.notes" :key="i" class="text-[12px] bg-background rounded-md px-2.5 py-2 flex flex-col gap-0.5">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-foreground text-[11px] truncate">{{ note.authorName }}</span>
              <span class="text-[10px] text-muted-foreground shrink-0">{{ formatDate(note.date) }}</span>
            </div>
            <p class="text-foreground whitespace-pre-line">{{ note.text }}</p>
          </div>
          <textarea v-model="noteDrafts[item.id]" :class="cls.fieldTextarea" rows="2" placeholder="Ajouter une note…"></textarea>
          <button :class="cls.btnOutline" class="self-end" :disabled="!(noteDrafts[item.id] ?? '').trim()" @click="addNote(item)">
            <Plus class="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
      </div>
    </template>

    <template #empty>
      <Users class="w-8 h-8" />
      <p class="text-[13px]">Aucune candidature pour le moment.</p>
    </template>
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Liste des candidatures liées à une offre (Application, source "Offer"),
 * module Recrutement, design uniquement (données fictives, voir
 * src/stores/recruitment). Calquée sur EmployeeListView.vue et
 * HiringRequestsView.vue.
 */
import { reactive, ref, watch, computed } from 'vue'
import { Users, UserPlus, UserCheck, Clock, FileText, Star, Plus } from 'lucide-vue-next'
import { ListPageLayout, StatusPill } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import * as cls from '../../lib/formClasses'
import { confirmDialog } from '../../lib/confirm'
import { formatDate } from '../../lib/date'
import { useApplicationStore } from '../../stores/recruitment'
import type { Application, ApplicationStatus } from '../../stores/recruitment'
import { useAuthStore } from '../../stores/auth'

const applicationStore = useApplicationStore()
const auth = useAuthStore()

/* ── Styles (KPI, repris à l'identique d'EmployeeListView.vue) ────── */
const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold leading-none'
const kpiLbl = 'text-xs text-muted-foreground mt-0.5'

/* ── Colonnes ───────────────────────────────────────────────── */
const columns: ListColumn[] = [
  { key: 'candidate', label: 'Candidat', sortable: true, hideable: false, width: 180 },
  { key: 'candidateEmail', label: 'Email', width: 200 },
  { key: 'candidatePhone', label: 'Téléphone', width: 130 },
  { key: 'jobOfferTitle', label: 'Offre liée', sortable: true, width: 180 },
  { key: 'cvFileName', label: 'CV', width: 170 },
  { key: 'status', label: 'Statut', width: 150 },
  { key: 'appliedAt', label: 'Date de candidature', sortable: true, width: 150 },
]

/* ── KPIs ───────────────────────────────────────────────────── */
const newCount = computed(() => applicationStore.fromOffers.filter(a => a.status === 'New').length)
const inReviewCount = computed(() => applicationStore.fromOffers.filter(a => a.status === 'InReview').length)
const retainedCount = computed(() => applicationStore.fromOffers.filter(a => a.status === 'Retained').length)

/* ── Scope / recherche / tri / pagination ──────────────────────
   Même pattern que EmployeeListView.vue : la vue calcule elle-même
   "filtered" puis passe la page déjà filtrée/triée à ListPageLayout. */
const scopeOptions = [
  { value: '', label: 'Toutes' },
  { value: 'New', label: 'Nouvelle' },
  { value: 'InReview', label: 'En cours' },
  { value: 'InterviewScheduled', label: 'Entretien planifié' },
  { value: 'Retained', label: 'Retenue' },
  { value: 'Rejected', label: 'Refusé' },
]
const activeScope = ref('')
const searchQuery = ref('')
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = ref(15)

watch([activeScope, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  searchQuery.value = ''; activeScope.value = ''; page.value = 1
}

const sortFieldMap: Partial<Record<string, keyof Application>> = {
  candidate: 'candidateName', jobOfferTitle: 'jobOfferTitle', appliedAt: 'appliedAt',
}

const filtered = computed(() => {
  let rows = applicationStore.fromOffers.filter(a => {
    if (activeScope.value && a.status !== activeScope.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (
        !a.candidateName.toLowerCase().includes(q) &&
        !a.candidateEmail.toLowerCase().includes(q) &&
        !(a.jobOfferTitle ?? '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })
  if (sortKey.value && sortFieldMap[sortKey.value]) {
    const f = sortFieldMap[sortKey.value]!
    rows = [...rows].sort((a, b) => {
      const cmp = String(a[f] ?? '').localeCompare(String(b[f] ?? ''))
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

/* ── Aperçu rapide : changement de statut, notes, vivier de talents ── */
function onStatusChange(item: Application, e: Event) {
  const value = (e.target as HTMLSelectElement).value as ApplicationStatus
  applicationStore.setStatus(item.id, value)
}

const noteDrafts = reactive<Record<string, string>>({})
function addNote(item: Application) {
  const text = (noteDrafts[item.id] ?? '').trim()
  if (!text) return
  applicationStore.addNote(item.id, auth.user?.name ?? '', text)
  noteDrafts[item.id] = ''
}

async function addToPool(item: Application) {
  if (await confirmDialog(`Ajouter ${item.candidateName} au vivier de talents ?`)) {
    applicationStore.addToTalentPool(item.id)
  }
}
</script>
