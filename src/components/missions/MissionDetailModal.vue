<template>
  <Teleport to="body">
    <div v-if="modelValue && mission" class="modal-overlay" @click.self="close">
      <div class="modal-card" id="mission-print-area">

        <!-- ── En-tête (screen uniquement) ── -->
        <div class="modal-header no-print">
          <span class="modal-title-text">Ordre de mission — {{ mission.code }}</span>
          <div class="header-actions">
            <button class="btn btn-outline" @click="print">
              <i class="ti ti-printer" aria-hidden="true"></i> Imprimer
            </button>
            <button class="modal-close-btn" @click="close">
              <i class="ti ti-x" aria-hidden="true"></i>
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
          <div class="status-bar no-print">
            <StatusPill :status="mission.status" />
            <span class="created-at">Créé le {{ fmt(mission.createdAt) }}</span>
          </div>

          <!-- Informations employé -->
          <div class="info-section">
            <div class="section-title">Employé</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nom</span>
                <span class="info-value">{{ mission.employeeName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Catégorie</span>
                <span class="info-value">{{ CAT_LABELS[mission.employeeCategory] }}</span>
              </div>
            </div>
          </div>

          <!-- Informations mission -->
          <div class="info-section">
            <div class="section-title">Mission</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Destination</span>
                <span class="info-value">{{ mission.destination }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Objet</span>
                <span class="info-value">{{ mission.purpose }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Départ</span>
                <span class="info-value">{{ fmtDate(mission.departureDate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Retour</span>
                <span class="info-value">{{ fmtDate(mission.returnDate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Durée</span>
                <span class="info-value">{{ mission.numberOfDays }} jour(s)</span>
              </div>
              <div class="info-item">
                <span class="info-label">Transport aller</span>
                <span class="info-value">{{ TRANSPORT_LABELS[mission.transportMode] }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Transport retour</span>
                <span class="info-value">{{ TRANSPORT_LABELS[mission.transportModeReturn] }}</span>
              </div>
            </div>
            <div v-if="mission.description" class="info-description">
              {{ mission.description }}
            </div>
          </div>

          <!-- Tableau des indemnités -->
          <div class="info-section">
            <div class="section-title">Indemnités</div>
            <table class="allow-table">
              <thead>
                <tr>
                  <th>Nature</th>
                  <th class="col-right">Base</th>
                  <th class="col-right">Jours</th>
                  <th class="col-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Indemnité hôtel</td>
                  <td class="col-right">{{ fmtNum(mission.hotelAllowance / mission.numberOfDays) }} MGA/j</td>
                  <td class="col-right">{{ mission.numberOfDays }}</td>
                  <td class="col-right">{{ fmtNum(mission.hotelAllowance) }} MGA</td>
                </tr>
                <tr>
                  <td>Indemnité transport</td>
                  <td class="col-right">Forfait</td>
                  <td class="col-right">—</td>
                  <td class="col-right">{{ fmtNum(mission.transportAllowance) }} MGA</td>
                </tr>
                <tr>
                  <td>Indemnité repas</td>
                  <td class="col-right">{{ fmtNum(mission.mealAllowance / mission.numberOfDays) }} MGA/j</td>
                  <td class="col-right">{{ mission.numberOfDays }}</td>
                  <td class="col-right">{{ fmtNum(mission.mealAllowance) }} MGA</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL MISSION</strong></td>
                  <td class="col-right"><strong>{{ fmtNum(mission.totalMission) }} MGA</strong></td>
                </tr>
                <tr v-if="mission.advanceRequested > 0" class="advance-row">
                  <td colspan="3">Acompte demandé</td>
                  <td class="col-right">{{ fmtNum(mission.advanceRequested) }} MGA</td>
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
          <div v-if="mission.validationHistory?.length" class="info-section no-print">
            <div class="section-title">Historique de validation</div>
            <ValidationTimeline :history="mission.validationHistory" />
          </div>

        </div>

        <!-- ── Actions (screen uniquement) ── -->
        <div v-if="showActions" class="modal-footer no-print">
          <template v-if="mission.status === 'pending'">
            <button class="btn btn-outline btn-return" @click="$emit('return', mission.id)">
              <i class="ti ti-arrow-back-up" aria-hidden="true"></i> Retourner
            </button>
            <button class="btn btn-danger" @click="$emit('reject', mission.id)">
              <i class="ti ti-x" aria-hidden="true"></i> Refuser
            </button>
            <button class="btn btn-success" @click="$emit('approve', mission.id)">
              <i class="ti ti-check" aria-hidden="true"></i> Approuver
            </button>
          </template>
          <template v-else-if="mission.status === 'draft'">
            <button class="btn btn-primary" @click="$emit('submit', mission.id)">
              <i class="ti ti-send" aria-hidden="true"></i> Soumettre
            </button>
          </template>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatusPill        from '../ui/StatusPill.vue'
import ValidationTimeline from '../ui/ValidationTimeline.vue'
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
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--color-surface); border-radius: 12px; padding: 28px;
  max-width: 680px; width: 95%; box-shadow: 0 8px 32px rgba(0,0,0,.16);
  max-height: 92vh; overflow-y: auto; display: flex; flex-direction: column;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px; gap: 12px;
}
.modal-title-text { font-size: 15px; font-weight: 600; color: var(--color-text); }
.header-actions   { display: flex; align-items: center; gap: 8px; }
.modal-close-btn {
  width: 28px; height: 28px; border: none; background: var(--color-bg);
  border-radius: 6px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: var(--color-text-muted); font-size: 14px;
}
.modal-close-btn:hover { background: var(--color-border); }

.status-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.created-at { font-size: 11px; color: var(--color-text-muted); }

.info-section { margin-bottom: 18px; }
.section-title {
  font-size: 11px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .06em;
  padding-bottom: 6px; border-bottom: 0.5px solid var(--color-border);
  margin-bottom: 10px;
}
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 11px; color: var(--color-text-muted); }
.info-value { font-size: 13px; font-weight: 500; color: var(--color-text); }
.info-description {
  margin-top: 10px; font-size: 12px; color: var(--color-text-muted);
  background: var(--color-bg); border-radius: 6px; padding: 8px 10px;
}

.allow-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.allow-table th {
  text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700;
  color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em;
  background: var(--color-bg); border-bottom: 0.5px solid var(--color-border);
}
.allow-table td { padding: 8px 10px; border-bottom: 0.5px solid var(--color-border); }
.allow-table tfoot tr:last-child td { border-bottom: none; }
.col-right { text-align: right; }
.total-row td { background: var(--color-bg); font-weight: 600; }
.advance-row td { font-size: 12px; color: var(--color-text-muted); }

.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  margin-top: 20px; padding-top: 16px; border-top: 0.5px solid var(--color-border);
  flex-wrap: wrap;
}
.btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
.btn-danger  { background: var(--color-danger-bg); color: var(--color-danger); }
.btn-danger:hover  { background: var(--color-danger); color: #fff; }
.btn-return  { background: var(--color-info-bg); color: var(--color-info); }
.btn-return:hover  { background: var(--color-info); color: #fff; }
.btn-success { background: var(--color-success-bg); color: var(--color-success); }
.btn-success:hover { background: var(--color-success); color: #fff; }

/* ── Signature zones (print only) ── */
.signature-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 32px;
}
.sig-box { display: flex; flex-direction: column; gap: 12px; }
.sig-title { font-size: 12px; font-weight: 600; text-align: center; }
.sig-line { height: 1px; background: #000; margin-top: 40px; }
.sig-name { font-size: 11px; text-align: center; }

/* ── Print styles ── */
.print-only { display: none; }

@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }

  .modal-overlay { position: static !important; background: none !important; }
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
  .signature-grid { display: grid !important; }

  .info-section { break-inside: avoid; }
}
</style>
