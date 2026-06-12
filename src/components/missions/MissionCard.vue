<script setup lang="ts">
/**
 * Fiche d'un ordre de mission (lecture / édition) — sur CardModalShell, pattern
 * frontdesk. Navigateur de N° à gauche, barre d'actions métier + impression,
 * mode lecture par défaut ; édition possible pour les brouillons.
 */
import { ref, computed, watch } from 'vue'
import { Printer } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import StatusPill from '../ui/StatusPill.vue'
import UserAvatar from '../ui/UserAvatar.vue'
import ValidationTimeline from '../ui/ValidationTimeline.vue'
import MissionWorkflowActions from './MissionWorkflowActions.vue'
import * as cls from '../../lib/formClasses'
import { useMissionStore } from '../../stores/missions'
import type { MissionOrder, TransportMode, EmployeeCategory } from '../../types'

const props = defineProps<{
  /** Missions de la liste courante (pour la navigation N°) */
  missions: MissionOrder[]
  /** Mission affichée */
  missionId: string
}>()

const emit = defineEmits<{ close: [] }>()

const missionStore = useMissionStore()

const TRANSPORT_LABELS: Record<TransportMode, string> = {
  personal_car: 'Voiture personnelle', company_car: 'Voiture société',
  public_transport: 'Transport en commun', plane: 'Avion', other: 'Autre',
}
const TRANSPORT_OPTIONS = Object.entries(TRANSPORT_LABELS) as [TransportMode, string][]
const CAT_LABELS: Record<EmployeeCategory, string> = {
  cat_a: 'Catégorie A', cat_b: 'Catégorie B', cat_c: 'Catégorie C', cat_d: 'Catégorie D',
}

function fmtNum(n: number) { return n.toLocaleString('fr-FR') }
function fmtDateTime(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const currentId = ref(props.missionId)
watch(() => props.missionId, (v) => { currentId.value = v; isEditMode.value = false })

const current = computed<MissionOrder | null>(() => props.missions.find(m => m.id === currentId.value) ?? null)
const currentIndex = computed(() => props.missions.findIndex(m => m.id === currentId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.missions.length - 1)

const sidebarItems = computed(() => props.missions.map(m => ({ no: m.code, label: `${m.employeeName} · ${m.destination}` })))
const currentNo = computed(() => current.value?.code ?? null)

function goPrev() { if (hasPrev.value) { currentId.value = props.missions[currentIndex.value - 1]!.id; isEditMode.value = false } }
function goNext() { if (hasNext.value) { currentId.value = props.missions[currentIndex.value + 1]!.id; isEditMode.value = false } }
function selectSidebar(no: string) {
  const m = props.missions.find(x => x.code === no)
  if (m) { currentId.value = m.id; isEditMode.value = false }
}

/* ── Mode édition (brouillons / retournés) ──────────────────── */
const isEditMode = ref(false)
const canEdit = computed(() => current.value?.status === 'draft' || current.value?.status === 'returned')
const form = ref({ destination: '', purpose: '', departureDate: '', returnDate: '', transportMode: 'plane' as TransportMode, transportModeReturn: 'plane' as TransportMode, description: '' })

function enterEdit() {
  if (!current.value) return
  const m = current.value
  form.value = {
    destination: m.destination, purpose: m.purpose,
    departureDate: m.departureDate, returnDate: m.returnDate,
    transportMode: m.transportMode, transportModeReturn: m.transportModeReturn,
    description: m.description ?? '',
  }
  isEditMode.value = true
}
function cancelEdit() { isEditMode.value = false }
function save() {
  if (!current.value) return
  missionStore.updateMission(current.value.id, { ...form.value })
  isEditMode.value = false
}

function printPage() { window.print() }

const pageTitle = computed(() => (current.value ? `${current.value.code} · ${current.value.employeeName}` : ''))
const readBox = 'text-[13px] text-foreground bg-background border border-border rounded-md px-2.5 h-[38px] flex items-center'
const th = 'text-left px-2.5 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border'
const td = 'px-2.5 py-2 border-b border-border'
</script>

<template>
  <CardModalShell
    v-if="current"
    :page-title="pageTitle"
    :page-number="current.code"
    banner-label="Ordre de mission"
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

    <!-- Barre d'actions métier (mode lecture) -->
    <template v-if="!isEditMode" #action-buttons>
      <MissionWorkflowActions :mission="current" />
      <button :class="cls.btnOutline" @click="printPage"><Printer class="w-4 h-4" /> Imprimer</button>
    </template>

    <template #form>
      <div class="px-6 py-5 max-w-4xl">
        <!-- Section Employé -->
        <div class="flex items-center border-b-2 border-primary pb-2 mb-5">
          <h2 class="text-base font-bold text-foreground">Employé</h2>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1 mb-7">
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Nom</label>
            <div class="flex items-center gap-2 h-[38px]">
              <UserAvatar :name="current.employeeName" size="sm" />
              <span class="text-[13px] font-medium text-foreground">{{ current.employeeName }}</span>
            </div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Catégorie</label>
            <div :class="readBox">{{ CAT_LABELS[current.employeeCategory] }}</div>
          </div>
        </div>

        <!-- Section Mission -->
        <div class="flex items-center border-b-2 border-primary pb-2 mb-5">
          <h2 class="text-base font-bold text-foreground">Mission</h2>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1 mb-7">
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Destination</label>
            <input v-if="isEditMode" v-model="form.destination" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ current.destination }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Durée</label>
            <div :class="readBox">{{ current.numberOfDays }} jour(s)</div>
          </div>
          <div :class="cls.field" class="col-span-2 max-sm:col-span-1">
            <label :class="cls.fieldLabel">Objet / Motif</label>
            <textarea v-if="isEditMode" v-model="form.purpose" :class="cls.fieldTextarea" rows="2"></textarea>
            <div v-else :class="[readBox, 'h-auto min-h-[38px] py-2']">{{ current.purpose }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Départ</label>
            <input v-if="isEditMode" type="datetime-local" v-model="form.departureDate" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ fmtDateTime(current.departureDate) }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Retour</label>
            <input v-if="isEditMode" type="datetime-local" v-model="form.returnDate" :min="form.departureDate" :class="cls.fieldInput" />
            <div v-else :class="readBox">{{ fmtDateTime(current.returnDate) }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Transport aller</label>
            <select v-if="isEditMode" v-model="form.transportMode" :class="cls.fieldSelect">
              <option v-for="[v, l] in TRANSPORT_OPTIONS" :key="v" :value="v">{{ l }}</option>
            </select>
            <div v-else :class="readBox">{{ TRANSPORT_LABELS[current.transportMode] }}</div>
          </div>
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Transport retour</label>
            <select v-if="isEditMode" v-model="form.transportModeReturn" :class="cls.fieldSelect">
              <option v-for="[v, l] in TRANSPORT_OPTIONS" :key="v" :value="v">{{ l }}</option>
            </select>
            <div v-else :class="readBox">{{ TRANSPORT_LABELS[current.transportModeReturn] }}</div>
          </div>
          <div v-if="current.description || isEditMode" :class="cls.field" class="col-span-2 max-sm:col-span-1">
            <label :class="cls.fieldLabel">Description</label>
            <textarea v-if="isEditMode" v-model="form.description" :class="cls.fieldTextarea" rows="2"></textarea>
            <div v-else :class="[readBox, 'h-auto min-h-[38px] py-2']">{{ current.description }}</div>
          </div>
        </div>

        <!-- Section Indemnités -->
        <div class="flex items-center border-b-2 border-primary pb-2 mb-4">
          <h2 class="text-base font-bold text-foreground">Indemnités</h2>
        </div>
        <table class="w-full border-collapse text-[13px] mb-7">
          <thead>
            <tr>
              <th :class="th">Nature</th>
              <th :class="[th, 'text-right']">Base</th>
              <th :class="[th, 'text-right']">Jours</th>
              <th :class="[th, 'text-right']">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td :class="td">Indemnité hôtel</td>
              <td :class="[td, 'text-right']">{{ fmtNum(current.hotelAllowance / current.numberOfDays) }} MGA/j</td>
              <td :class="[td, 'text-right']">{{ current.numberOfDays }}</td>
              <td :class="[td, 'text-right']">{{ fmtNum(current.hotelAllowance) }} MGA</td>
            </tr>
            <tr>
              <td :class="td">Indemnité transport</td>
              <td :class="[td, 'text-right']">Forfait</td>
              <td :class="[td, 'text-right']">—</td>
              <td :class="[td, 'text-right']">{{ fmtNum(current.transportAllowance) }} MGA</td>
            </tr>
            <tr>
              <td :class="td">Indemnité repas</td>
              <td :class="[td, 'text-right']">{{ fmtNum(current.mealAllowance / current.numberOfDays) }} MGA/j</td>
              <td :class="[td, 'text-right']">{{ current.numberOfDays }}</td>
              <td :class="[td, 'text-right']">{{ fmtNum(current.mealAllowance) }} MGA</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="px-2.5 py-2 bg-background font-bold">TOTAL MISSION</td>
              <td class="px-2.5 py-2 bg-background font-bold text-right text-primary">{{ fmtNum(current.totalMission) }} MGA</td>
            </tr>
            <tr v-if="current.advanceRequested > 0">
              <td colspan="3" class="px-2.5 py-2 text-xs text-muted-foreground">Acompte demandé</td>
              <td class="px-2.5 py-2 text-xs text-muted-foreground text-right">{{ fmtNum(current.advanceRequested) }} MGA</td>
            </tr>
          </tfoot>
        </table>

        <!-- Historique de validation -->
        <div v-if="current.validationHistory?.length">
          <div class="flex items-center border-b-2 border-primary pb-2 mb-4">
            <h2 class="text-base font-bold text-foreground">Historique de validation</h2>
          </div>
          <ValidationTimeline :history="current.validationHistory" />
        </div>
      </div>
    </template>
  </CardModalShell>
</template>
