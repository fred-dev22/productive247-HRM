<template>
  <Teleport to="body">
    <div v-if="modelValue && mission" class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000]" @click.self="close">
      <div class="modal-card relative bg-card text-card-foreground rounded-xl p-7 max-w-[680px] w-[95%] shadow-[0_8px_32px_rgba(0,0,0,0.16)] max-h-[92vh] overflow-y-auto flex flex-col" id="mission-print-area">

        <!-- ── En-tête (screen uniquement) ── -->
        <div class="no-print flex items-center justify-between mb-[18px] gap-3">
          <span class="text-[15px] font-semibold text-foreground">Ordre de mission — {{ mission.code }}</span>
          <div class="flex items-center gap-2">
            <button :class="cls.btnOutline" @click="print">
              <Printer class="w-4 h-4" /> Imprimer
            </button>
            <button
              class="w-7 h-7 bg-background rounded-md cursor-pointer flex items-center justify-center text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
              @click="close"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- ── Contenu imprimable ── -->
        <div class="print-content">

          <!-- En-tête impression -->
          <div class="print-header print-only">
            <div class="print-company">
              <strong>Productive 247 HRM</strong>
            </div>
            <h1 class="print-doc-title">ORDRE DE MISSION</h1>
            <div class="print-code">Réf : {{ mission.code }}</div>
          </div>

          <!-- Statut (screen) -->
          <div class="no-print flex items-center gap-2.5 mb-3.5">
            <StatusPill :status="mission.status" />
            <span class="text-[11px] text-muted-foreground">Créé le {{ fmt(mission.createdAt) }}</span>
          </div>

          <!-- Informations employé -->
          <div class="info-section mb-[18px]">
            <div :class="sectionTitle">Employé</div>
            <div :class="infoGrid">
              <div :class="infoItem">
                <span :class="infoLabel">Nom</span>
                <span :class="infoValue">{{ mission.employeeName }}</span>
              </div>
              <div :class="infoItem">
                <span :class="infoLabel">Catégorie</span>
                <span :class="infoValue">{{ CAT_LABELS[mission.employeeCategory] }}</span>
              </div>
            </div>
          </div>

          <!-- Informations mission -->
          <div class="info-section mb-[18px]">
            <div :class="sectionTitle">Mission</div>
            <div :class="infoGrid">
              <div :class="infoItem">
                <span :class="infoLabel">Destination</span>
                <span :class="infoValue">{{ mission.destination }}</span>
              </div>
              <div :class="infoItem">
                <span :class="infoLabel">Objet</span>
                <span :class="infoValue">{{ mission.purpose }}</span>
              </div>
              <div :class="infoItem">
                <span :class="infoLabel">Départ</span>
                <span :class="infoValue">{{ fmtDate(mission.departureDate) }}</span>
              </div>
              <div :class="infoItem">
                <span :class="infoLabel">Retour</span>
                <span :class="infoValue">{{ fmtDate(mission.returnDate) }}</span>
              </div>
              <div :class="infoItem">
                <span :class="infoLabel">Durée</span>
                <span :class="infoValue">{{ mission.numberOfDays }} jour(s)</span>
              </div>
              <div :class="infoItem">
                <span :class="infoLabel">Transport aller</span>
                <span :class="infoValue">{{ TRANSPORT_LABELS[mission.transportMode] }}</span>
              </div>
              <div :class="infoItem">
                <span :class="infoLabel">Transport retour</span>
                <span :class="infoValue">{{ TRANSPORT_LABELS[mission.transportModeReturn] }}</span>
              </div>
            </div>
            <div v-if="mission.description" class="mt-2.5 text-xs text-muted-foreground bg-background rounded-md px-2.5 py-2">
              {{ mission.description }}
            </div>
          </div>

          <!-- Tableau des indemnités -->
          <div class="info-section mb-[18px]">
            <div :class="sectionTitle">Indemnités</div>
            <table class="allow-table w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th :class="thClass">Nature</th>
                  <th :class="[thClass, 'text-right']">Base</th>
                  <th :class="[thClass, 'text-right']">Jours</th>
                  <th :class="[thClass, 'text-right']">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td :class="tdClass">Indemnité hôtel</td>
                  <td :class="[tdClass, 'text-right']">{{ fmtNum(mission.hotelAllowance / mission.numberOfDays) }} MGA/j</td>
                  <td :class="[tdClass, 'text-right']">{{ mission.numberOfDays }}</td>
                  <td :class="[tdClass, 'text-right']">{{ fmtNum(mission.hotelAllowance) }} MGA</td>
                </tr>
                <tr>
                  <td :class="tdClass">Indemnité transport</td>
                  <td :class="[tdClass, 'text-right']">Forfait</td>
                  <td :class="[tdClass, 'text-right']">—</td>
                  <td :class="[tdClass, 'text-right']">{{ fmtNum(mission.transportAllowance) }} MGA</td>
                </tr>
                <tr>
                  <td :class="tdClass">Indemnité repas</td>
                  <td :class="[tdClass, 'text-right']">{{ fmtNum(mission.mealAllowance / mission.numberOfDays) }} MGA/j</td>
                  <td :class="[tdClass, 'text-right']">{{ mission.numberOfDays }}</td>
                  <td :class="[tdClass, 'text-right']">{{ fmtNum(mission.mealAllowance) }} MGA</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="px-2.5 py-2 bg-background font-semibold"><strong>TOTAL MISSION</strong></td>
                  <td class="px-2.5 py-2 bg-background font-semibold text-right"><strong>{{ fmtNum(mission.totalMission) }} MGA</strong></td>
                </tr>
                <tr v-if="mission.advanceRequested > 0">
                  <td colspan="3" class="px-2.5 py-2 text-xs text-muted-foreground">Acompte demandé</td>
                  <td class="px-2.5 py-2 text-xs text-muted-foreground text-right">{{ fmtNum(mission.advanceRequested) }} MGA</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Zones de signature (impression) -->
          <div class="signature-grid print-only">
            <div class="sig-box">
              <div class="sig-title">Le demandeur</div>
              <div class="sig-line"></div>
              <div class="sig-name">{{ mission.employeeName }}</div>
            </div>
            <div class="sig-box">
              <div class="sig-title">Le validateur N+1</div>
              <div class="sig-line"></div>
              <div class="sig-name">Nom &amp; visa</div>
            </div>
            <div class="sig-box">
              <div class="sig-title">Direction RH</div>
              <div class="sig-line"></div>
              <div class="sig-name">Nom &amp; visa</div>
            </div>
          </div>

          <!-- Historique de validation (screen) -->
          <div v-if="mission.validationHistory?.length" class="no-print info-section mb-[18px]">
            <div :class="sectionTitle">Historique de validation</div>
            <ValidationTimeline :history="mission.validationHistory" />
          </div>

        </div>

        <!-- ── Actions (screen uniquement) ── -->
        <div v-if="showActions" class="no-print flex gap-2 justify-end mt-5 pt-4 border-t border-border flex-wrap">
          <template v-if="mission.status === 'pending'">
            <button :class="cls.btnInfo" @click="$emit('return', mission.id)">
              <Undo2 class="w-4 h-4" /> Retourner
            </button>
            <button :class="cls.btnDestructive" @click="$emit('reject', mission.id)">
              <X class="w-4 h-4" /> Refuser
            </button>
            <button :class="btnSuccess" @click="$emit('approve', mission.id)">
              <Check class="w-4 h-4" /> Approuver
            </button>
          </template>
          <template v-else-if="mission.status === 'draft'">
            <button :class="cls.btnPrimary" @click="$emit('submit', mission.id)">
              <Send class="w-4 h-4" /> Soumettre
            </button>
          </template>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Printer, X, Undo2, Check, Send } from 'lucide-vue-next'
import StatusPill        from '../ui/StatusPill.vue'
import ValidationTimeline from '../ui/ValidationTimeline.vue'
import * as cls from '../../lib/formClasses'
import { useMissionStore } from '../../stores/missions'
import type { EmployeeCategory, TransportMode } from '../../types'

const props = withDefaults(defineProps<{
  modelValue: boolean
  missionId:  string
  showActions?: boolean
}>(), { showActions: false })

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'approve': [id: string]
  'reject':  [id: string]
  'return':  [id: string]
  'submit':  [id: string]
}>()

// ── Classes du design system ─────────────────────────────────
const sectionTitle = 'text-[11px] font-bold text-muted-foreground uppercase tracking-[0.06em] pb-1.5 border-b border-border mb-2.5'
const infoGrid = 'grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5'
const infoItem = 'flex flex-col gap-0.5'
const infoLabel = 'text-[11px] text-muted-foreground'
const infoValue = 'text-[13px] font-medium text-foreground'
const thClass = 'text-left px-2.5 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em] bg-background border-b border-border'
const tdClass = 'px-2.5 py-2 border-b border-border'
const btnSuccess = cls.btn + ' bg-success-bg text-success hover:bg-success hover:text-white'

const missionStore = useMissionStore()

const mission = computed(() =>
  missionStore.missions.find(m => m.id === props.missionId) ?? null
)

const CAT_LABELS: Record<EmployeeCategory, string> = {
  cat_a: 'Catégorie A', cat_b: 'Catégorie B',
  cat_c: 'Catégorie C', cat_d: 'Catégorie D',
}

const TRANSPORT_LABELS: Record<TransportMode, string> = {
  personal_car:     'Voiture personnelle',
  company_car:      'Voiture société',
  public_transport: 'Transport en commun',
  plane:            'Avion',
  other:            'Autre',
}

function fmt(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fmtDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtNum(n: number): string {
  return n.toLocaleString('fr-FR')
}

function close() { emit('update:modelValue', false) }
function print() { window.print() }
</script>

<style scoped>
/* Styles d'impression — non exprimables en utilitaires Tailwind (@media print) */
.print-only { display: none; }

@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }

  .modal-card {
    max-height: none !important; overflow: visible !important;
    box-shadow: none !important; border-radius: 0 !important;
    padding: 0 !important; max-width: 100% !important; width: 100% !important;
  }

  .print-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 16px; }
  .print-company { font-size: 12px; color: #666; margin-bottom: 8px; }
  .print-doc-title { font-size: 22px; font-weight: 700; margin: 4px 0; }
  .print-code { font-size: 12px; color: #666; }

  .allow-table th, .allow-table td { border: 1px solid #ccc !important; }

  .signature-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 32px; }
  .sig-box { display: flex; flex-direction: column; gap: 12px; }
  .sig-title { font-size: 12px; font-weight: 600; text-align: center; }
  .sig-line { height: 1px; background: #000; margin-top: 40px; }
  .sig-name { font-size: 11px; text-align: center; }

  .info-section { break-inside: avoid; }
}
</style>
