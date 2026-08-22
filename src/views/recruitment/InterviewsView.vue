<template>
  <ListPageLayout
    title="Entretiens"
    :subtitle="`${interviewStore.items.length} entretien(s)`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} entretien(s)`"
    search-placeholder="Rechercher un candidat, une offre, un lieu…"
    :page-size-options="[15, 25, 50]"
    scope-label="Entretiens :"
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
        <Plus class="w-4 h-4" /> Planifier un entretien
      </button>
    </template>

    <!-- KPIs -->
    <template #above-table>
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-primary/10"><CalendarClock class="w-[18px] h-[18px] text-primary" /></div>
          <div><div :class="kpiVal">{{ interviewStore.items.length }}</div><div :class="kpiLbl">Total</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-warning-bg"><Clock class="w-[18px] h-[18px] text-warning" /></div>
          <div><div :class="kpiVal">{{ scheduledCount }}</div><div :class="kpiLbl">Planifiés</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-success-bg"><CheckCircle2 class="w-[18px] h-[18px] text-success" /></div>
          <div><div :class="kpiVal">{{ doneCount }}</div><div :class="kpiLbl">Effectués</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-info-bg"><CalendarDays class="w-[18px] h-[18px] text-info" /></div>
          <div><div :class="kpiVal">{{ todayCount }}</div><div :class="kpiLbl">Aujourd'hui</div></div>
        </div>
      </div>
    </template>

    <!-- Actions contextuelles (ligne sélectionnée) -->
    <template #row-actions="{ item }">
      <template v-if="item.status === 'Scheduled'">
        <button :class="doneCls" @click="markDoneItem(item)"><CheckCircle2 class="w-3.5 h-3.5" /> Marquer comme effectué</button>
        <button :class="evaluateCls" @click="openEvaluate(item)"><Star class="w-3.5 h-3.5" /> Évaluer</button>
        <button :class="cancelCls" @click="cancelItem(item)"><Ban class="w-3.5 h-3.5" /> Annuler</button>
      </template>
    </template>

    <!-- Cellules -->
    <template #cell-candidateName="{ item }"><span class="font-medium text-foreground text-xs truncate">{{ item.candidateName }}</span></template>
    <template #cell-jobOfferTitle="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.jobOfferTitle }}</span></template>
    <template #cell-scheduledAt="{ item }"><span class="text-muted-foreground text-xs whitespace-nowrap">{{ formatDateTime(item.scheduledAt) }}</span></template>
    <template #cell-location="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.location }}</span></template>
    <template #cell-participants="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.participants.join(', ') }}</span></template>
    <template #cell-status="{ item }"><StatusPill :status="item.status" /></template>

    <!-- Aperçu rapide -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div>
          <div class="text-sm font-semibold text-foreground truncate">{{ item.candidateName }}</div>
          <div class="text-[11px] text-muted-foreground truncate">{{ item.jobOfferTitle }}</div>
        </div>
        <div><StatusPill :status="item.status" /></div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Date et heure</div>{{ formatDateTime(item.scheduledAt) }}</div>
          <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Lieu</div>{{ item.location }}</div>
          <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Participants</div>{{ item.participants.join(', ') }}</div>
        </div>

        <div v-if="item.status === 'Done' && item.evaluation" class="pt-2 border-t border-border">
          <div class="text-[11px] text-muted-foreground mb-1">Évaluation</div>
          <div class="text-[13px] font-semibold text-foreground mb-1">Note : {{ item.evaluation.score }}/5</div>
          <p class="text-[12px] text-foreground whitespace-pre-line">{{ item.evaluation.comment }}</p>
          <div class="text-[11px] text-muted-foreground mt-1.5">Par {{ item.evaluation.interviewerName }}</div>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border">
          <template v-if="item.status === 'Scheduled'">
            <button :class="doneCls" @click="markDoneItem(item)"><CheckCircle2 class="w-3.5 h-3.5" /> Marquer comme effectué</button>
            <button :class="evaluateCls" @click="openEvaluate(item)"><Star class="w-3.5 h-3.5" /> Évaluer</button>
            <button :class="cancelCls" @click="cancelItem(item)"><Ban class="w-3.5 h-3.5" /> Annuler</button>
          </template>
          <span v-else class="text-xs text-muted-foreground italic">Aucune action disponible</span>
        </div>
      </div>
    </template>

    <template #empty>
      <CalendarClock class="w-8 h-8" />
      <p class="text-[13px]">Aucun entretien</p>
    </template>

    <!-- Création -->
    <CreateModalShell
      v-if="showCreate"
      title="Planifier un entretien"
      banner-label="Nouvel entretien"
      create-label="Planifier"
      :save-error="error"
      @close="showCreate = false"
      @create="create"
    >
      <template #form>
        <div class="flex-1 overflow-auto px-6 py-5">
          <div class="max-w-3xl mx-auto">

            <FormSection title="Candidature">
              <div :class="cls.field">
                <label :class="cls.fieldLabel">Candidature <span class="text-danger">*</span></label>
                <select v-model="form.applicationId" :class="cls.fieldSelect">
                  <option value="">Sélectionnez une candidature</option>
                  <option v-for="a in eligibleApplications" :key="a.id" :value="a.id">{{ a.candidateName }} · {{ a.jobOfferTitle ?? 'Candidature spontanée' }}</option>
                </select>
              </div>
            </FormSection>

            <FormSection title="Entretien">
              <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Date et heure <span class="text-danger">*</span></label>
                  <input type="datetime-local" v-model="form.scheduledAt" :class="cls.fieldInput" />
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Lieu <span class="text-danger">*</span></label>
                  <input v-model="form.location" :class="cls.fieldInput" placeholder="ex : Salle de réunion 2, Direction Générale…" />
                </div>
                <div :class="cls.field" class="col-span-2">
                  <label :class="cls.fieldLabel">Participants <span class="text-danger">*</span></label>
                  <input v-model="form.participantsText" :class="cls.fieldInput" placeholder="ex : Christiane Tchako, Hery Rasoanaivo…" />
                  <p class="text-[11px] text-muted-foreground mt-1">Séparez les noms par des virgules.</p>
                </div>
              </div>
            </FormSection>

          </div>
        </div>
      </template>
    </CreateModalShell>

    <!-- Modale Évaluer -->
    <ModalShell :open="evaluateModal.open" title="Évaluer l'entretien" max-width="max-w-[420px]" @close="evaluateModal.open = false">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Note *</label>
        <select v-model.number="evaluateModal.score" :class="cls.fieldSelect">
          <option v-for="n in 5" :key="n" :value="n">{{ n }} / 5</option>
        </select>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Commentaire *</label>
        <textarea v-model="evaluateModal.comment" :class="cls.fieldTextarea" placeholder="Impressions, points forts, réserves…" rows="4"></textarea>
      </div>
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Évaluateur *</label>
        <input v-model="evaluateModal.interviewerName" :class="cls.fieldInput" placeholder="Nom de l'évaluateur" />
      </div>
      <div v-if="evaluateModal.error" :class="cls.fieldError">{{ evaluateModal.error }}</div>
      <template #footer>
        <button :class="cls.btnPrimary" @click="confirmEvaluate"><Star class="w-4 h-4" /> Enregistrer l'évaluation</button>
        <button :class="cls.btnOutline" @click="evaluateModal.open = false">Annuler</button>
      </template>
    </ModalShell>
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Liste des entretiens (Interview), module Recrutement, design uniquement
 * (données fictives, voir src/stores/recruitment). Calquée sur
 * EmployeeListView.vue / JobOffersView.vue / HiringRequestsView.vue :
 * ListPageLayout + boutons de workflow repris à l'identique de
 * MissionWorkflowActions.vue.
 */
import { ref, reactive, computed, watch } from 'vue'
import { Plus, CalendarClock, Clock, CheckCircle2, CalendarDays, Star, Ban } from 'lucide-vue-next'
import { ListPageLayout, StatusPill, CreateModalShell } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import FormSection from '../../components/ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { todayIso } from '../../lib/date'
import { confirmDialog } from '../../lib/confirm'
import { useInterviewStore, useApplicationStore } from '../../stores/recruitment'
import type { Interview } from '../../stores/recruitment'
import { useAuthStore } from '../../stores/auth'

const interviewStore = useInterviewStore()
const applicationStore = useApplicationStore()
const auth = useAuthStore()

/* ── Styles (KPI + boutons de workflow, repris à l'identique de
   MissionWorkflowActions.vue) ─────────────────────────────────── */
const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold leading-none'
const kpiLbl = 'text-xs text-muted-foreground mt-0.5'

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const doneCls     = btn + ' bg-success-bg text-success hover:brightness-95'
const evaluateCls = btn + ' bg-info-bg text-info hover:brightness-95'
const cancelCls   = btn + ' bg-neutral-bg text-neutral hover:brightness-95'

/* ── Formatage date et heure (ex : "25/08/2026 10:00") ─────────── */
function formatDateTime(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso)
  if (!m) return iso
  const [, y, mo, d, h, mi] = m
  return `${d}/${mo}/${y} ${h}:${mi}`
}

/* ── Colonnes ───────────────────────────────────────────────── */
const columns: ListColumn[] = [
  { key: 'candidateName', label: 'Candidat', sortable: true, hideable: false, width: 180 },
  { key: 'jobOfferTitle', label: 'Offre', sortable: true, width: 180 },
  { key: 'scheduledAt', label: 'Date et heure', sortable: true, width: 150 },
  { key: 'location', label: 'Lieu', sortable: true, width: 180 },
  { key: 'participants', label: 'Participants', width: 220 },
  { key: 'status', label: 'Statut', width: 130 },
]

/* ── KPIs ───────────────────────────────────────────────────── */
const scheduledCount = computed(() => interviewStore.items.filter(i => i.status === 'Scheduled').length)
const doneCount = computed(() => interviewStore.items.filter(i => i.status === 'Done').length)
const todayCount = computed(() => {
  const today = todayIso()
  return interviewStore.items.filter(i => i.scheduledAt.slice(0, 10) === today).length
})

/* ── Scope / recherche / tri / pagination ──────────────────────
   Même pattern que EmployeeListView.vue : la vue calcule elle-même
   "filtered" puis passe la page déjà filtrée/triée à ListPageLayout. */
const scopeOptions = [
  { value: '', label: 'Tous' },
  { value: 'Scheduled', label: 'Planifié' },
  { value: 'Done', label: 'Effectué' },
  { value: 'Cancelled', label: 'Annulé' },
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

const sortFieldMap: Record<string, keyof Interview> = {
  candidateName: 'candidateName', jobOfferTitle: 'jobOfferTitle', scheduledAt: 'scheduledAt', location: 'location',
}

const filtered = computed(() => {
  let rows = interviewStore.items.filter(i => {
    if (activeScope.value && i.status !== activeScope.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!i.candidateName.toLowerCase().includes(q) && !i.jobOfferTitle.toLowerCase().includes(q) && !i.location.toLowerCase().includes(q)) return false
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

/* ── Création ───────────────────────────────────────────────── */
const eligibleApplications = computed(() => applicationStore.items.filter(a => a.status === 'New' || a.status === 'InReview'))

const showCreate = ref(false)
const error = ref<string | null>(null)
const form = reactive({
  applicationId: '', scheduledAt: '', location: '', participantsText: '',
})

function resetForm() {
  Object.assign(form, { applicationId: '', scheduledAt: '', location: '', participantsText: '' })
  error.value = null
}

function validate(): boolean {
  if (!form.applicationId) { error.value = 'Sélectionnez une candidature'; return false }
  if (!form.scheduledAt) { error.value = 'La date et l\'heure sont requises'; return false }
  if (!form.location.trim()) { error.value = 'Le lieu est requis'; return false }
  if (!form.participantsText.trim()) { error.value = 'Au moins un participant est requis'; return false }
  error.value = null
  return true
}

function buildPayload() {
  const app = applicationStore.items.find(a => a.id === form.applicationId)
  return {
    applicationId: form.applicationId,
    candidateName: app?.candidateName ?? '',
    jobOfferTitle: app?.jobOfferTitle ?? 'Candidature spontanée',
    scheduledAt: form.scheduledAt,
    location: form.location.trim(),
    participants: form.participantsText.split(',').map(p => p.trim()).filter(Boolean),
  }
}

function create() {
  if (!validate()) return
  interviewStore.schedule(buildPayload())
  showCreate.value = false
  resetForm()
}

/* ── Actions de workflow ────────────────────────────────────── */
function markDoneItem(item: Interview) { interviewStore.markDone(item.id) }

async function cancelItem(item: Interview) {
  if (await confirmDialog('Annuler cet entretien ?')) interviewStore.cancel(item.id)
}

const evaluateModal = reactive({ open: false, itemId: '', score: 5, comment: '', interviewerName: '', error: '' })
function openEvaluate(item: Interview) {
  Object.assign(evaluateModal, { open: true, itemId: item.id, score: 5, comment: '', interviewerName: auth.user?.name ?? '', error: '' })
}
function confirmEvaluate() {
  if (evaluateModal.comment.trim().length === 0) { evaluateModal.error = 'Le commentaire est requis'; return }
  if (!evaluateModal.interviewerName.trim()) { evaluateModal.error = "Le nom de l'évaluateur est requis"; return }
  interviewStore.evaluate(evaluateModal.itemId, {
    score: evaluateModal.score,
    comment: evaluateModal.comment.trim(),
    interviewerName: evaluateModal.interviewerName.trim(),
  })
  evaluateModal.open = false
}
</script>
