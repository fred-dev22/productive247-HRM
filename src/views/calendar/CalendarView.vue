<template>
  <div class="px-7 py-6">

        <!-- ── En-tête ── -->
        <div class="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 class="text-xl font-bold text-foreground">Calendrier de l'entreprise</h1>
            <p class="text-[13px] text-muted-foreground mt-0.5">Configuration des jours ouvrables, fériés et règles de congés</p>
            <span class="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-card border border-border rounded-full px-2.5 py-[3px] mt-2">
              <ClockArrowDown class="w-3 h-3" />
              Dernière mise à jour : {{ calendar.updatedAt }} par {{ calendar.updatedBy }}
            </span>
          </div>
          <button :class="L.btnPrimary" class="disabled:opacity-45 disabled:cursor-not-allowed" :disabled="saveDisabled" @click="saveChanges">
            <Save class="w-4 h-4" />
            Enregistrer les modifications
          </button>
        </div>

        <!-- ── Toast ── -->
        <div v-if="showToast" class="fixed bottom-6 right-6 bg-success text-white px-5 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 z-[2000] shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
          <Check class="w-4 h-4" />
          Calendrier mis à jour
        </div>

        <!-- ── Tabs ── -->
        <div class="flex gap-1 border-b-[1.5px] border-border mb-5 overflow-x-auto">
          <button
            v-for="tab in TABS" :key="tab.id"
            :class="[tabBtn, activeTab === tab.id && tabActive]"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- ══════════ Onglet 1 : Jours de travail ══════════ -->
        <div v-if="activeTab === 'working-days'">
          <div :class="sectionCard">
            <h2 class="text-[15px] font-semibold text-foreground mb-4">Jours ouvrables</h2>
            <!-- Source unique : composant réutilisé dans l'onboarding -->
            <WorkingDaysConfig />
          </div>
        </div>

        <!-- ══════════ Onglet 2 : Jours fériés ══════════ -->
        <div v-if="activeTab === 'holidays'">

          <div :class="sectionCard">
            <div :class="sectionHeader">
              <h2 class="text-[15px] font-semibold text-foreground">Fériés annuels</h2>
              <div class="flex gap-2 items-center">
                <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="importCSV">
                  <Upload class="w-3.5 h-3.5" /> Importer CSV
                </button>
                <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="openAddModal('annual')">
                  <Plus class="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table :class="dataTable">
                <thead><tr><th :class="th">Nom</th><th :class="th">Date</th><th :class="th">Actions</th></tr></thead>
                <tbody>
                  <tr v-for="h in annualHolidays" :key="h.id" class="hover:bg-background">
                    <td :class="td">{{ h.name }}</td>
                    <td :class="td"><span :class="dateBadge">{{ formatAnnualDate(h.date) }}</span></td>
                    <td :class="[td, 'flex gap-1']">
                      <button :class="iconBtn" @click="openEditModal(h)"><Pencil class="w-3.5 h-3.5" /></button>
                      <button :class="[iconBtn, 'hover:!bg-danger-bg hover:!text-danger']" @click="deleteHoliday(h.id)"><Trash2 class="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                  <tr v-if="annualHolidays.length === 0"><td colspan="3" class="text-center text-muted-foreground p-5">Aucun férié annuel</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div :class="sectionCard">
            <div :class="sectionHeader">
              <h2 class="text-[15px] font-semibold text-foreground">Fériés ponctuels</h2>
              <div class="flex gap-2 items-center">
                <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="importCSV">
                  <Upload class="w-3.5 h-3.5" /> Importer CSV
                </button>
                <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="openAddModal('ponctual')">
                  <Plus class="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table :class="dataTable">
                <thead><tr><th :class="th">Nom</th><th :class="th">Date</th><th :class="th">Actions</th></tr></thead>
                <tbody>
                  <tr v-for="h in ponctualHolidays" :key="h.id" class="hover:bg-background">
                    <td :class="td">{{ h.name }}</td>
                    <td :class="td">
                      <span :class="dateBadge">{{ h.date }}</span>
                      <span class="text-[10px] font-bold text-white bg-danger rounded px-1.5 py-px ml-1">{{ h.date.slice(0, 4) }}</span>
                    </td>
                    <td :class="[td, 'flex gap-1']">
                      <button :class="iconBtn" @click="openEditModal(h)"><Pencil class="w-3.5 h-3.5" /></button>
                      <button :class="[iconBtn, 'hover:!bg-danger-bg hover:!text-danger']" @click="deleteHoliday(h.id)"><Trash2 class="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                  <tr v-if="ponctualHolidays.length === 0"><td colspan="3" class="text-center text-muted-foreground p-5">Aucun férié ponctuel</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- ══════════ Onglet 3 : Types & Règles de congés ══════════ -->
        <div v-if="activeTab === 'leave-rules'">
          <div :class="sectionCard">
            <div :class="sectionHeader">
              <h2 class="text-[15px] font-semibold text-foreground">Types & Règles de congés</h2>
              <div class="flex gap-2 items-center">
                <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="importCSV">
                  <Upload class="w-3.5 h-3.5" /> Importer CSV
                </button>
                <button :class="[L.btnOutline, '!px-3 !py-1.5 !text-xs']" @click="openAddLT">
                  <Plus class="w-3.5 h-3.5" /> Ajouter un type
                </button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table :class="dataTable">
                <thead>
                  <tr>
                    <th :class="th" style="width:36px"></th>
                    <th :class="th">Nom</th>
                    <th :class="[th, 'text-center']" style="width:80px">Jours/an</th>
                    <th :class="[th, 'text-center']" style="width:90px">Accum./mois</th>
                    <th :class="[th, 'text-center']" style="width:70px">Préavis</th>
                    <th :class="[th, 'text-center']" style="width:70px">Justif.</th>
                    <th :class="[th, 'text-center']" style="width:60px">Actif</th>
                    <th :class="[th, 'text-center']" style="width:60px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="{ lt, rule } in unifiedTypes" :key="lt.id" class="hover:bg-background">
                    <td :class="td">
                      <div class="w-7 h-7 rounded-md flex items-center justify-center text-white text-[13px]" :style="{ background: lt.color }">
                        <i :class="`ti ${lt.icon}`" aria-hidden="true"></i>
                      </div>
                    </td>
                    <td :class="td">
                      <span class="text-[13px] font-medium text-foreground mr-1">{{ lt.name }}</span>
                      <Lock v-if="lt.isSystem" class="w-3 h-3 text-muted-foreground inline-block align-middle" title="Type système" />
                    </td>
                    <td :class="[td, 'text-center']">
                      <input v-if="rule" type="number" min="0" :class="ruleInput" :value="rule.daysPerYear"
                        @input="updateRule(lt.name, 'daysPerYear', +($event.target as HTMLInputElement).value)" />
                      <span v-else>—</span>
                    </td>
                    <td :class="[td, 'text-center']">
                      <input v-if="rule" type="number" min="0" step="0.5" :class="ruleInput" :value="rule.daysPerMonth"
                        @input="updateRule(lt.name, 'daysPerMonth', +($event.target as HTMLInputElement).value)" />
                      <span v-else>—</span>
                    </td>
                    <td :class="[td, 'text-center']">
                      <input v-if="rule" type="number" min="0" :class="ruleInput" :value="rule.noticeDays"
                        @input="updateRule(lt.name, 'noticeDays', +($event.target as HTMLInputElement).value)" />
                      <span v-else>—</span>
                    </td>
                    <td :class="[td, 'text-center']">
                      <label v-if="rule" class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" :checked="rule.requiresDocument"
                          @change="updateRule(lt.name, 'requiresDocument', ($event.target as HTMLInputElement).checked)" />
                        <span :class="toggleTrack"></span>
                      </label>
                      <span v-else>—</span>
                    </td>
                    <td :class="[td, 'text-center']">
                      <label class="relative inline-flex items-center cursor-pointer" :title="lt.isSystem ? 'Toujours actif' : ''">
                        <input type="checkbox" class="sr-only peer" :checked="lt.isActive" :disabled="lt.isSystem"
                          @change="leaveTypesStore.toggleLeaveType(lt.id)" />
                        <span :class="[toggleTrack, 'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed']"></span>
                      </label>
                    </td>
                    <td :class="[td, 'text-center']">
                      <div class="flex gap-1 items-center justify-center">
                        <button :class="iconBtn" title="Modifier" @click="openEditLT(lt.id)">
                          <Pencil class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

  </div>

  <!-- ── Modal types d'absence ── -->
  <LeaveTypeFormModal v-model="showLTModal" :edit-id="editLTId" />

  <!-- ── Import CSV toast ── -->
  <Teleport to="body">
    <div v-if="showImportToast" class="fixed bottom-6 right-6 bg-primary text-white px-5 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 z-[2000] shadow-[0_4px_16px_rgba(0,0,0,0.16)] max-w-md">
      <Info class="w-[15px] h-[15px] shrink-0" />
      {{ importToastMsg }}
    </div>
  </Teleport>

  <!-- ── Modal férié annuel ── -->
  <ModalShell :open="showModal === 'annual'" :title="editingHoliday ? 'Modifier' : 'Ajouter un férié annuel'" max-width="max-w-[420px]" @close="closeModal">
    <label :class="cls.field">
      <span :class="cls.fieldLabel">Nom *</span>
      <input type="text" :class="cls.fieldInput" v-model="hForm.name" placeholder="Ex : Fête du Travail" />
    </label>
    <div :class="cls.field">
      <span :class="cls.fieldLabel">Date (mois — jour)</span>
      <div class="flex gap-2">
        <select :class="cls.fieldSelect" v-model="hForm.month">
          <option v-for="m in MONTHS" :key="m.v" :value="m.v">{{ m.l }}</option>
        </select>
        <select :class="cls.fieldSelect" v-model="hForm.day">
          <option v-for="d in DAYS" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
    </div>
    <template #footer>
      <button :class="cls.btnOutline" @click="closeModal">Annuler</button>
      <button :class="cls.btnPrimary" @click="saveAnnualHoliday">Enregistrer</button>
    </template>
  </ModalShell>

  <!-- ── Modal férié ponctuel ── -->
  <ModalShell :open="showModal === 'ponctual'" :title="editingHoliday ? 'Modifier' : 'Ajouter un férié ponctuel'" max-width="max-w-[420px]" @close="closeModal">
    <label :class="cls.field">
      <span :class="cls.fieldLabel">Nom *</span>
      <input type="text" :class="cls.fieldInput" v-model="hForm.name" placeholder="Ex : Aïd el-Fitr 2026" />
    </label>
    <label :class="cls.field">
      <span :class="cls.fieldLabel">Date complète</span>
      <input type="date" :class="cls.fieldInput" v-model="hForm.fullDate" />
    </label>
    <template #footer>
      <button :class="cls.btnOutline" @click="closeModal">Annuler</button>
      <button :class="cls.btnPrimary" @click="savePonctualHoliday">Enregistrer</button>
    </template>
  </ModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, type Component } from 'vue'
import { storeToRefs } from 'pinia'
import {
  ClockArrowDown, Save, Check, Clock, CalendarDays, ListChecks, Upload, Plus,
  Pencil, Trash2, Lock, Info,
} from 'lucide-vue-next'
import LeaveTypeFormModal from '../../components/configuration/LeaveTypeFormModal.vue'
import WorkingDaysConfig  from '../../components/calendar/WorkingDaysConfig.vue'
import ModalShell from '../../components/ui/ModalShell.vue'
import * as cls from '../../lib/formClasses'
import * as L from '../../lib/listClasses'
import { useAuthStore }       from '../../stores/auth'
import { useCalendarStore }   from '../../stores/calendar'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import type { Holiday, LeaveRule, LeaveType } from '../../types'

const auth            = useAuthStore()
const calendarStore   = useCalendarStore()
const leaveTypesStore = useLeaveTypesStore()
const { calendar, annualHolidays, ponctualHolidays } = storeToRefs(calendarStore)

// ── Classes du design system ─────────────────────────────────
const tabBtn = 'flex items-center gap-1.5 px-[18px] py-2.5 text-[13px] font-medium text-muted-foreground bg-transparent border-0 border-b-2 border-transparent cursor-pointer whitespace-nowrap transition-colors hover:text-foreground'
const tabActive = '!text-primary !border-primary'
const sectionCard = 'bg-card border border-border rounded-[10px] p-5 mb-4'
const sectionHeader = 'flex items-center justify-between mb-4 gap-3 flex-wrap'
const dataTable = 'w-full border-collapse text-[13px]'
const th = 'text-left px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.06em] bg-background border-b border-border'
const td = 'px-3 py-2.5 border-b border-border text-foreground'
const dateBadge = 'text-xs font-medium bg-background border border-border rounded px-2 py-0.5 mr-1.5'
const iconBtn = 'w-7 h-7 flex items-center justify-center border-0 rounded-md bg-background text-muted-foreground cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary'
const ruleInput = 'w-[60px] h-7 px-1.5 text-center border border-border rounded bg-background text-xs text-foreground outline-none focus:border-primary'
const toggleTrack = "w-8 h-[18px] rounded-full bg-border transition-colors peer-checked:bg-primary relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:left-[16px]"

// ── Modal types d'absence ─────────────────────────────────────
const showLTModal = ref(false)
const editLTId    = ref<string | undefined>(undefined)
function openAddLT() { editLTId.value = undefined; showLTModal.value = true }
function openEditLT(id: string) { editLTId.value = id; showLTModal.value = true }

// ── Tabs ──────────────────────────────────────────────────────
const activeTab = ref<'working-days' | 'holidays' | 'leave-rules'>('working-days')
const TABS: { id: 'working-days' | 'holidays' | 'leave-rules'; label: string; icon: Component }[] = [
  { id: 'working-days', label: 'Jours de travail',          icon: Clock        },
  { id: 'holidays',     label: 'Jours fériés',              icon: CalendarDays },
  { id: 'leave-rules',  label: 'Types & Règles de congés',  icon: ListChecks   },
]

const showToast = ref(false)
function triggerToast() { showToast.value = true; setTimeout(() => { showToast.value = false }, 2500) }

// ── Règles locales ─────────────────────────────────────────────
const localRules   = ref<LeaveRule[]>(JSON.parse(JSON.stringify(calendar.value.leaveRules)))
const rulesTouched = ref(false)

const unifiedTypes = computed(() =>
  leaveTypesStore.leaveTypes.map(lt => ({
    lt,
    rule: localRules.value.find(r => r.type === lt.name) ?? null,
  }))
)

function updateRule(typeName: string, field: string, value: number | boolean) {
  const rule = localRules.value.find(r => r.type === typeName)
  if (rule) {
    ;(rule as Record<string, unknown>)[field] = value
    rulesTouched.value = true
  }
}

// ── Save ──────────────────────────────────────────────────────
const saveDisabled = computed(() => !rulesTouched.value)

function saveChanges() {
  if (!rulesTouched.value) return
  localRules.value.forEach(r => calendarStore.updateLeaveRule(r.type as LeaveType, r))
  rulesTouched.value = false
  triggerToast()
}

// ── Display helpers ───────────────────────────────────────────
function formatAnnualDate(date: string): string {
  const M = ['','jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
  const p = date.split('-')
  return `${p[1] ?? ''} ${M[parseInt(p[0] ?? '0')] ?? ''}`
}

// ── Modals fériés ─────────────────────────────────────────────
const showModal      = ref<'annual' | 'ponctual' | null>(null)
const editingHoliday = ref<Holiday | null>(null)
const MONTHS = [
  {v:'01',l:'Janvier'},{v:'02',l:'Février'},{v:'03',l:'Mars'},{v:'04',l:'Avril'},
  {v:'05',l:'Mai'},{v:'06',l:'Juin'},{v:'07',l:'Juillet'},{v:'08',l:'Août'},
  {v:'09',l:'Septembre'},{v:'10',l:'Octobre'},{v:'11',l:'Novembre'},{v:'12',l:'Décembre'},
]
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2,'0'))
const hForm = reactive({ name: '', month: '01', day: '01', fullDate: '' })

function openAddModal(type: 'annual' | 'ponctual') {
  editingHoliday.value = null
  hForm.name = ''; hForm.month = '01'; hForm.day = '01'; hForm.fullDate = ''
  showModal.value = type
}
function openEditModal(h: Holiday) {
  editingHoliday.value = h
  hForm.name = h.name
  if (h.isRecurring) {
    const p = h.date.split('-')
    hForm.month = p[0] ?? '01'
    hForm.day   = p[1] ?? '01'
    showModal.value = 'annual'
  } else {
    hForm.fullDate  = h.date
    showModal.value = 'ponctual'
  }
}
function closeModal() { showModal.value = null; editingHoliday.value = null }
function saveAnnualHoliday() {
  if (!hForm.name.trim()) return
  const date = `${hForm.month}-${hForm.day}`
  editingHoliday.value
    ? calendarStore.updateHoliday(editingHoliday.value.id, { name: hForm.name, date })
    : calendarStore.addHoliday({ name: hForm.name, date, type: 'annual', isRecurring: true })
  closeModal()
}
function savePonctualHoliday() {
  if (!hForm.name.trim() || !hForm.fullDate) return
  editingHoliday.value
    ? calendarStore.updateHoliday(editingHoliday.value.id, { name: hForm.name, date: hForm.fullDate })
    : calendarStore.addHoliday({ name: hForm.name, date: hForm.fullDate, type: 'ponctual', isRecurring: false })
  closeModal()
}
function deleteHoliday(id: string) { if (confirm('Supprimer ce jour férié ?')) calendarStore.removeHoliday(id) }

// ── Import CSV toast ──────────────────────────────────────────
const showImportToast  = ref(false)
const importToastMsg   = ref('')
function triggerImportToast(msg: string) {
  importToastMsg.value  = msg
  showImportToast.value = true
  setTimeout(() => { showImportToast.value = false }, 3500)
}
function importCSV() {
  triggerImportToast('Import CSV disponible prochainement. Format attendu : Nom, Date (YYYY-MM-DD ou MM-DD pour annuels), Type (annual/ponctual)')
}
</script>
