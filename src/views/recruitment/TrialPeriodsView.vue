<template>
  <ListPageLayout
    title="Périodes d'essai"
    :subtitle="`${trialStore.items.length} période(s) d'essai`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} période(s) d'essai`"
    search-placeholder="Rechercher un employé, un poste, une entité…"
    :page-size-options="[15, 25, 50]"
    scope-label="Périodes :"
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
          <div><div :class="kpiVal">{{ trialStore.items.length }}</div><div :class="kpiLbl">Total</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-warning-bg"><Clock class="w-[18px] h-[18px] text-warning" /></div>
          <div><div :class="kpiVal">{{ onTrialCount }}</div><div :class="kpiLbl">En cours</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-info-bg"><CalendarClock class="w-[18px] h-[18px] text-info" /></div>
          <div><div :class="kpiVal">{{ extendedCount }}</div><div :class="kpiLbl">Prolongées</div></div>
        </div>
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-success-bg"><UserCheck class="w-[18px] h-[18px] text-success" /></div>
          <div><div :class="kpiVal">{{ convertedCount }}</div><div :class="kpiLbl">Converties</div></div>
        </div>
      </div>
    </template>

    <!-- Actions contextuelles (ligne sélectionnée) -->
    <template #row-actions="{ item }">
      <template v-if="ACTIONABLE.includes(item.status)">
        <button :class="infoCls" @click="openEvaluate(item)"><ClipboardCheck class="w-3.5 h-3.5" /> Évaluer</button>
        <button :class="approveCls" @click="convertTrial(item)"><UserCheck class="w-3.5 h-3.5" /> Convertir en CDI</button>
        <button :class="warningCls" @click="openExtend(item)"><CalendarClock class="w-3.5 h-3.5" /> Prolonger</button>
        <button :class="cancelCls" @click="cancelTrial(item)"><Ban class="w-3.5 h-3.5" /> Annuler</button>
      </template>
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
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">Réinitialiser les filtres</button>
    </template>

    <!-- Cellules -->
    <template #cell-employeeName="{ item }"><span class="font-medium text-foreground text-xs truncate">{{ item.employeeName }}</span></template>
    <template #cell-jobTitle="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.jobTitle }}</span></template>
    <template #cell-entityName="{ item }"><span class="text-muted-foreground text-xs truncate">{{ item.entityName }}</span></template>
    <template #cell-startDate="{ item }"><span class="text-muted-foreground text-xs">{{ formatDate(item.startDate) }}</span></template>
    <template #cell-trialEndDate="{ item }"><span class="text-muted-foreground text-xs">{{ formatDate(item.trialEndDate) }}</span></template>
    <template #cell-status="{ item }"><StatusPill :status="item.status" /></template>

    <!-- Aperçu rapide -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div>
          <div class="text-sm font-semibold text-foreground truncate">{{ item.employeeName }}</div>
          <div class="text-[11px] text-muted-foreground truncate">{{ item.jobTitle }} · {{ item.entityName }}</div>
        </div>
        <div><StatusPill :status="item.status" /></div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Début</div>{{ formatDate(item.startDate) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Fin d'essai</div>{{ formatDate(item.trialEndDate) }}</div>
        </div>

        <div v-if="item.evaluation" class="pt-2 border-t border-border">
          <div class="text-[11px] text-muted-foreground mb-1">Évaluation</div>
          <div class="text-[13px] font-semibold text-foreground mb-1">Note : {{ item.evaluation.score }}/5</div>
          <p class="text-[12px] text-foreground whitespace-pre-line">{{ item.evaluation.comment }}</p>
          <div class="text-[11px] text-muted-foreground mt-1.5">Par {{ item.evaluation.evaluatedByName }} le {{ formatDate(item.evaluation.date) }}</div>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border">
          <template v-if="ACTIONABLE.includes(item.status)">
            <button :class="infoCls" @click="openEvaluate(item)"><ClipboardCheck class="w-3.5 h-3.5" /> Évaluer</button>
            <button :class="approveCls" @click="convertTrial(item)"><UserCheck class="w-3.5 h-3.5" /> Convertir en CDI</button>
            <button :class="warningCls" @click="openExtend(item)"><CalendarClock class="w-3.5 h-3.5" /> Prolonger</button>
            <button :class="cancelCls" @click="cancelTrial(item)"><Ban class="w-3.5 h-3.5" /> Annuler</button>
          </template>
          <span v-else class="text-xs text-muted-foreground italic">Aucune action disponible</span>
        </div>
      </div>
    </template>

    <template #empty>
      <Users class="w-8 h-8" />
      <p class="text-[13px]">Aucune période d'essai</p>
    </template>

    <!-- Modale Évaluer -->
    <ModalShell :open="evaluateModal.open" title="Évaluer la période d'essai" max-width="max-w-[420px]" @close="evaluateModal.open = false">
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
        <input v-model="evaluateModal.evaluatedByName" :class="cls.fieldInput" placeholder="Nom de l'évaluateur" />
      </div>
      <div v-if="evaluateModal.error" :class="cls.fieldError">{{ evaluateModal.error }}</div>
      <template #footer>
        <button :class="cls.btnPrimary" @click="confirmEvaluate"><ClipboardCheck class="w-4 h-4" /> Enregistrer l'évaluation</button>
        <button :class="cls.btnOutline" @click="evaluateModal.open = false">Annuler</button>
      </template>
    </ModalShell>

    <!-- Modale Prolonger -->
    <ModalShell :open="extendModal.open" title="Prolonger la période d'essai" max-width="max-w-[420px]" @close="extendModal.open = false">
      <div :class="cls.field">
        <label :class="cls.fieldLabel">Nouvelle date de fin *</label>
        <input type="date" v-model="extendModal.newEndDate" :class="cls.fieldInput" />
      </div>
      <div v-if="extendModal.error" :class="cls.fieldError">{{ extendModal.error }}</div>
      <template #footer>
        <button :class="cls.btnPrimary" @click="confirmExtend"><CalendarClock class="w-4 h-4" /> Prolonger</button>
        <button :class="cls.btnOutline" @click="extendModal.open = false">Annuler</button>
      </template>
    </ModalShell>
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Périodes d'essai (TrialEmployee), module Recrutement, design uniquement
 * (données fictives, voir src/stores/recruitment). Calquée sur
 * EmployeeListView.vue / InterviewsView.vue : ListPageLayout + boutons de
 * workflow repris à l'identique de MissionWorkflowActions.vue.
 */
import { ref, reactive, computed, watch } from 'vue'
import { Users, Clock, CalendarClock, UserCheck, ClipboardCheck, Ban } from 'lucide-vue-next'
import { ListPageLayout, StatusPill } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { formatDate } from '../../lib/date'
import { confirmDialog } from '../../lib/confirm'
import { useTrialStore } from '../../stores/recruitment'
import type { TrialEmployee } from '../../stores/recruitment'
import { useEntityStore } from '../../stores/entities'
import { useAuthStore } from '../../stores/auth'

const trialStore = useTrialStore()
const entityStore = useEntityStore()
const auth = useAuthStore()
if (entityStore.entities.length === 0) entityStore.fetchAll()

/* ── Styles (KPI + boutons de workflow, repris à l'identique de
   MissionWorkflowActions.vue) ─────────────────────────────────── */
const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold leading-none'
const kpiLbl = 'text-xs text-muted-foreground mt-0.5'

const btn = 'px-2.5 py-[5px] rounded text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1 transition-colors'
const approveCls = btn + ' bg-success-bg text-success hover:brightness-95'
const infoCls    = btn + ' bg-info-bg text-info hover:brightness-95'
const warningCls = btn + ' bg-warning-bg text-warning hover:brightness-95'
const cancelCls  = btn + ' bg-neutral-bg text-neutral hover:brightness-95'

const ACTIONABLE: TrialEmployee['status'][] = ['OnTrial', 'Extended']

/* ── Colonnes ───────────────────────────────────────────────── */
const columns: ListColumn[] = [
  { key: 'employeeName', label: 'Employé', sortable: true, hideable: false, width: 180 },
  { key: 'jobTitle', label: 'Poste', sortable: true, width: 170 },
  { key: 'entityName', label: 'Entité', sortable: true, width: 170 },
  { key: 'startDate', label: 'Début', sortable: true, width: 120 },
  { key: 'trialEndDate', label: "Fin d'essai", sortable: true, width: 120 },
  { key: 'status', label: 'Statut', width: 140 },
]

/* ── KPIs ───────────────────────────────────────────────────── */
const onTrialCount = computed(() => trialStore.items.filter(t => t.status === 'OnTrial').length)
const extendedCount = computed(() => trialStore.items.filter(t => t.status === 'Extended').length)
const convertedCount = computed(() => trialStore.items.filter(t => t.status === 'Converted').length)

/* ── Scope / recherche / tri / pagination ──────────────────────
   Même pattern que EmployeeListView.vue : la vue calcule elle-même
   "filtered" puis passe la page déjà filtrée/triée à ListPageLayout. */
const scopeOptions = [
  { value: '', label: 'Toutes' },
  { value: 'OnTrial', label: 'En cours' },
  { value: 'Extended', label: 'Prolongée' },
  { value: 'Converted', label: 'Convertie' },
  { value: 'Cancelled', label: 'Annulée' },
]
const activeScope = ref('')
const fEntity = ref('')
const searchQuery = ref('')
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = ref(15)

watch([activeScope, fEntity, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  fEntity.value = ''; searchQuery.value = ''; activeScope.value = ''; page.value = 1
}

const sortFieldMap: Record<string, keyof TrialEmployee> = {
  employeeName: 'employeeName', jobTitle: 'jobTitle', entityName: 'entityName', startDate: 'startDate', trialEndDate: 'trialEndDate',
}

const filtered = computed(() => {
  let rows = trialStore.items.filter(t => {
    if (activeScope.value && t.status !== activeScope.value) return false
    if (fEntity.value && t.entityName !== fEntity.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!t.employeeName.toLowerCase().includes(q) && !t.jobTitle.toLowerCase().includes(q) && !t.entityName.toLowerCase().includes(q)) return false
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

/* ── Actions de workflow ────────────────────────────────────── */
async function convertTrial(item: TrialEmployee) {
  if (await confirmDialog("Convertir cette période d'essai en CDI ?")) trialStore.convert(item.id)
}
async function cancelTrial(item: TrialEmployee) {
  if (await confirmDialog("Annuler cette période d'essai ?")) trialStore.cancel(item.id)
}

const evaluateModal = reactive({ open: false, itemId: '', score: 5, comment: '', evaluatedByName: '', error: '' })
function openEvaluate(item: TrialEmployee) {
  Object.assign(evaluateModal, { open: true, itemId: item.id, score: 5, comment: '', evaluatedByName: auth.user?.name ?? '', error: '' })
}
function confirmEvaluate() {
  if (evaluateModal.comment.trim().length === 0) { evaluateModal.error = 'Le commentaire est requis'; return }
  if (!evaluateModal.evaluatedByName.trim()) { evaluateModal.error = "Le nom de l'évaluateur est requis"; return }
  trialStore.evaluate(evaluateModal.itemId, {
    score: evaluateModal.score,
    comment: evaluateModal.comment.trim(),
    evaluatedByName: evaluateModal.evaluatedByName.trim(),
  })
  evaluateModal.open = false
}

const extendModal = reactive({ open: false, itemId: '', newEndDate: '', error: '' })
function openExtend(item: TrialEmployee) {
  Object.assign(extendModal, { open: true, itemId: item.id, newEndDate: item.trialEndDate, error: '' })
}
function confirmExtend() {
  if (!extendModal.newEndDate) { extendModal.error = 'La nouvelle date de fin est requise'; return }
  trialStore.extend(extendModal.itemId, extendModal.newEndDate)
  extendModal.open = false
}
</script>
