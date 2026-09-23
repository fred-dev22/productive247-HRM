<script setup lang="ts">
/**
 * Fiche de création d'une demande d'absence — sur CreateModalShell (pattern
 * frontdesk). Calcul bidirectionnel jours ↔ date de fin (jours ouvrés du
 * calendrier réel), alertes préavis/solde/jour non ouvrable, intérimaire
 * (vrai employé), workflow "Enregistrement direct" pour les types medicaux
 * (LeaveType.workflowType === 'Medical').
 */
import { reactive, ref, computed, watch } from 'vue'
import {
  Calendar, Paperclip, TriangleAlert, CircleAlert, CalendarCheck,
} from 'lucide-vue-next'
import UserAvatar from '../ui/UserAvatar.vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import * as cls from '../../lib/formClasses'
import { useLeaveRequestStore } from '../../stores/leaveRequests'
import { useLeaveTransactionStore } from '../../stores/leaveTransactions'
import { useCalendarStore } from '../../stores/calendar'
import { useEmployeeStore } from '../../stores/employees'
import { useEmployeeCategoryStore } from '../../stores/employeeCategories'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useAuthStore } from '../../stores/auth'
import { calculateEndDate, isWorkingDay } from '../../utils/calendar'
import { isEligible } from '../../lib/eligibility'
import type { LeaveBalance } from '../../types'

const props = defineProps<{ initialLeaveTypeId?: string }>()
const emit = defineEmits<{ close: []; created: [] }>()

const leaveRequestStore     = useLeaveRequestStore()
const leaveTransactionStore = useLeaveTransactionStore()
const calendarStore         = useCalendarStore()
const employeeStore         = useEmployeeStore()
const categoryStore         = useEmployeeCategoryStore()
const leaveTypesStore       = useLeaveTypesStore()
const auth                  = useAuthStore()

if (calendarStore.holidays.length === 0) calendarStore.fetchHolidays(new Date().getFullYear())
if (leaveTypesStore.leaveTypes.length === 0) leaveTypesStore.fetchAll()
// Toujours rafraîchi (pas de garde "si vide") : voir DashboardEmployee.vue.
leaveTransactionStore.fetchMyBalances()
if (categoryStore.categories.length === 0) categoryStore.fetchAll()
// N'importe qui peut soumettre pour n'importe qui (decision du 01/08) — un
// simple employé n'a pas EMPLOYE_VOIR_TOUT/EQUIPE, fetchAll() échouerait en
// 403. L'annuaire allégé (voir stores/employees.ts fetchDirectory) est
// accessible à tout compte authentifié et suffit pour ce sélecteur.
if (employeeStore.directory.length === 0) employeeStore.fetchDirectory()

// Un compte système (Employee.IsSystem, ex. "Admin Congélo") n'a pas
// d'existence RH réelle — jamais de solde, jamais éligible à un congé pour
// lui-même — donc toujours "pour un employé" dès le départ, jamais "pour
// moi-même" (voir ForWhomSelector.vue hideSelfOption, retour du 09/09).
const forWhom = ref<BeneficiaryValue>({ mode: auth.user?.isSystem ? 'for-employee' : 'self', employeeId: '' })
// On exclut soi-même : "Pour moi-même" est déjà l'option dédiée à ce cas,
// pas besoin de se retrouver aussi dans la liste "Pour un employé".
const employeeItems = computed(() =>
  employeeStore.directory
    .filter(e => e.id !== auth.user?.id)
    .map(e => ({ id: e.id, label: e.name, sublabel: e.entityName, code: e.code, initials: e.avatarText, avatarColor: e.avatarBg, status: e.status })),
)

// Carte "bénéficiaire" en lecture seule quand ForWhomSelector n'affiche pas
// le sélecteur (simple employé sans EMPLOYE_VOIR_TOUT/EMPLOYE_VOIR_EQUIPE) —
// même pattern que MissionCreate.vue, pour que la rubrique ne reste pas
// vide : c'est toujours lui le bénéficiaire dans ce cas.
const selectedEmployee = computed(() => {
  if (forWhom.value.mode === 'self') {
    const u = auth.user
    return u ? { id: u.id, name: u.name, initials: u.initials, categoryName: auth.categoryName ?? '' } : null
  }
  const emp = employeeStore.getById(forWhom.value.employeeId)
  if (!emp) return null
  const categoryName = categoryStore.categories.find(c => c.id === emp.employeeCategoryId)?.name ?? ''
  return { id: emp.id, name: emp.name, initials: emp.initials, categoryName }
})

// L'intérimaire remplace le bénéficiaire de la demande à son poste — aucune
// restriction d'entité (decision du 01/08, revient sur celle du 30/07) : un
// responsable en congé peut désigner un intérimaire dans une autre direction.
const beneficiaryId = computed(() => forWhom.value.mode === 'for-employee' ? forWhom.value.employeeId : auth.user?.id)
// Le calendrier qui pilote la validation "jour ouvrable" doit être celui DU
// BÉNÉFICIAIRE (sa catégorie peut avoir un calendrier dédié différent de
// celui du créateur) — fetchCalendar() sans argument résout pour
// l'utilisateur courant, pas pour lui. Rejoué à chaque changement de
// bénéficiaire (bug corrigé : avant, un calendrier déjà en mémoire depuis un
// écran précédent n'était jamais rafraîchi, la validation utilisait alors le
// mauvais calendrier).
watch(beneficiaryId, (id) => { if (id) calendarStore.fetchCalendar(id) }, { immediate: true })

// Solde du BÉNÉFICIAIRE quand on soumet "pour un employé" — myBalances
// (fetchMyBalances plus haut) ne représente que le solde du demandeur
// connecté, jamais celui du bénéficiaire choisi ici s'il diffère (voir déjà
// isBalanceInsufficient plus bas, qui se neutralise à raison dans ce cas) ;
// le badge "Solde" utilisait quand même à tort myBalance, affichant le
// solde du demandeur comme si c'était celui du bénéficiaire (souvent 0 pour
// un compte RH/admin qui ne cotise jamais lui-même, retour du 09/09).
// GET /leave-transactions/balance/:employeeId est protégé par
// CONGE_VOIR_TOUT (contrairement à "n'importe qui peut soumettre pour
// n'importe qui", décision du 01/08, qui elle ne l'est pas) — un simple
// employé sans ce droit n'a donc pas accès au solde exact d'un collègue ;
// dans ce cas on retombe sur l'allocation générale (j/an) plutôt que
// d'afficher un chiffre faux ou de risquer un 403.
const beneficiaryBalances = ref<LeaveBalance[] | null>(null)
watch(beneficiaryId, async (id) => {
  if (forWhom.value.mode !== 'for-employee' || !id || !auth.hasPermission('CONGE_VOIR_TOUT')) {
    beneficiaryBalances.value = null
    return
  }
  try {
    beneficiaryBalances.value = await leaveTransactionStore.fetchBalancesFor(id)
  } catch {
    beneficiaryBalances.value = null
  }
}, { immediate: true })
// Seul le bénéficiaire est exclu : il ne peut pas être son propre
// intérimaire. Quand on crée pour quelqu'un d'autre, le demandeur (soi-même)
// reste un intérimaire valide ; quand on crée pour soi-même, ce filtre
// l'exclut déjà puisque beneficiaryId vaut alors son propre id.
const interimItems = computed(() =>
  employeeStore.directory
    .filter(e => e.id !== beneficiaryId.value)
    .map(e => ({
      id: e.id, label: e.name, sublabel: e.entityName, initials: e.avatarText, avatarColor: e.avatarBg,
      itemDisabled: e.status !== 'active',
      disabledReason: e.status !== 'active' ? 'compte désactivé' : undefined,
    })),
)

// Ciblage d'eligibilite (demande client, 01/09) — un type de conge restreint
// a un genre/statut expatrie/entite n'est meme pas propose si le beneficiaire
// n'y est pas eligible. Tant que l'employe correspondant n'est pas identifie
// (repertoire pas encore charge), on ne filtre rien plutot que de risquer de
// masquer a tort un type valide (voir stores/employees.ts:getById).
const beneficiaryEligibility = computed(() => {
  const id = beneficiaryId.value
  if (!id) return null
  const emp = employeeStore.getById(id)
  if (!emp) return null
  return { gender: emp.gender, isExpatriate: emp.isExpatriate, entityId: emp.entityId }
})
const leaveTypeItems = computed(() =>
  leaveTypesStore.activeTypes
    .filter(lt => !beneficiaryEligibility.value || isEligible(lt, beneficiaryEligibility.value))
    .map(lt => ({ id: lt.id, label: lt.name })),
)

const form = reactive({
  leaveTypeId:      props.initialLeaveTypeId ?? '',
  startDate:        '',
  // Retour client du 23/09 : "Journée entière" retiré des choix de début,
  // "Matin" (jour plein) devient le choix par défaut plutôt que "full".
  startPeriod:      'am' as 'full' | 'am' | 'pm',
  workingDaysCount: null as number | null,
  endDate:          '',
  endPeriod:        'full' as 'full' | 'am' | 'pm',
  interimEmployeeId: '',
  comment:          '',
})
// Le type deja selectionne peut devenir non eligible quand on change de
// beneficiaire (ex: type "Femme uniquement" choisi puis beneficiaire changé
// pour un homme) — mieux vaut le vider explicitement que de soumettre une
// demande sur un type que le beneficiaire ne devrait pas voir.
watch(leaveTypeItems, (items) => {
  if (form.leaveTypeId && !items.some(i => i.id === form.leaveTypeId)) {
    form.leaveTypeId = ''
  }
})
const error = ref('')
const errors = reactive({ employee: '', leaveType: '', startDate: '', workingDays: '', interim: '' })

const resumeDate   = ref('')
const resumePeriod = ref<'am' | 'pm'>('am')
let calculating  = false

// Regime de conges du beneficiaire (voir reunion Dominique du 12/06) — un
// employe "local" dont l'absence se termine un vendredi voit le week-end
// suivant aussi decompte de son solde. Ce n'est qu'un apercu avant
// soumission : computeWorkingDays (backend) reste l'autorite sur ce qui est
// reellement debite.
const beneficiaryIsExpatriate = computed(() => {
  const id = beneficiaryId.value
  if (!id) return false
  return employeeStore.getById(id)?.isExpatriate ?? false
})
const chargedDaysCount = ref<number | null>(null)

// Ciblage d'eligibilite (demande client, 01/09) — calendarStore.holidays est
// un cache global partage par plusieurs ecrans (voir stores/calendar.ts:
// calendar), donc filtré ici localement plutôt que muté dans le store : un
// jour ferie non applicable au beneficiaire ne doit pas etre traite comme
// ferie pour le decompte de SA demande, sans affecter les autres ecrans qui
// lisent la meme liste (ex: Configuration > Calendrier, qui doit rester
// exhaustive).
const effectiveCalendar = computed(() => {
  const rule = beneficiaryEligibility.value
  if (!rule) return calendarStore.calendar
  return { ...calendarStore.calendar, holidays: calendarStore.calendar.holidays.filter(h => isEligible(h, rule)) }
})

const currentType = computed(() => leaveTypesStore.leaveTypes.find(lt => lt.id === form.leaveTypeId) ?? null)
const isMedicalType = computed(() => currentType.value?.workflowType === 'Medical')

const isPastDate = computed(() => {
  if (!form.startDate) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const p = form.startDate.split('-').map(Number)
  return new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1) < today
})

const isNotWorkingDay = computed(() => {
  if (!form.startDate) return false
  const p = form.startDate.split('-').map(Number)
  return !isWorkingDay(new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1), effectiveCalendar.value)
})

const myBalance = computed(() => {
  if (!form.leaveTypeId) return null
  return leaveTransactionStore.myBalances.find(b => b.leaveTypeId === form.leaveTypeId) ?? null
})

// Solde à AFFICHER dans le badge (voir beneficiaryBalances plus haut) —
// celui du bénéficiaire réel si "pour un employé" et visible, sinon celui du
// demandeur (myBalance, self mode). Distinct de myBalance : isBalanceInsufficient
// ci-dessous reste volontairement basé sur myBalance/self uniquement (aucun
// changement de la logique d'avertissement, seulement de l'affichage).
const displayedBalance = computed(() => {
  if (!form.leaveTypeId) return null
  const source = forWhom.value.mode === 'for-employee' ? beneficiaryBalances.value : leaveTransactionStore.myBalances
  return source?.find(b => b.leaveTypeId === form.leaveTypeId) ?? null
})

const isBalanceInsufficient = computed(() => {
  if (!form.workingDaysCount || !currentType.value) return false
  if (currentType.value.daysPerYear <= 0) return false // illimité
  if (forWhom.value.mode !== 'self' || !myBalance.value) return false
  // Compare au nombre reellement decompte (inclut le week-end "avale" pour
  // un beneficiaire local, voir chargedDaysCount), pas juste les jours
  // ouvres demandes.
  return (chargedDaysCount.value ?? form.workingDaysCount) > myBalance.value.balance
})

// Auto-calcule la date de fin (+ periode de fin, reprise) quand debut /
// nombre de jours / periode de debut changent, aussi quand le calendrier
// termine son chargement (fetchCalendar() est async ; sans ca, remplir le
// formulaire avant que la reponse arrive calculait la reprise contre un
// calendrier vide, jamais recalculee ensuite). Retour client du 23/09 :
// "Date de fin"/"Periode de fin" ne sont plus des champs saisissables (le
// nombre de jours suffit a tout calculer), donc plus qu'un seul mode de
// calcul ici (auparavant "from-days" vs "from-date").
watch(
  () => [form.startDate, form.workingDaysCount, form.startPeriod, calendarStore.calendar.workingDays, beneficiaryIsExpatriate.value, effectiveCalendar.value.holidays, currentType.value?.countCalendarDays] as const,
  ([start, days, period, , isExpat, , countCalendarDays]) => {
    if (calculating) return
    if (!start || !days || days <= 0) { resumeDate.value = ''; chargedDaysCount.value = null; return }
    calculating = true
    try {
      const result       = calculateEndDate(start, days, effectiveCalendar.value, period, isExpat, countCalendarDays ?? false)
      form.endDate        = result.endDate
      form.endPeriod       = result.endPeriod
      resumeDate.value    = result.resumeDate
      resumePeriod.value  = result.resumePeriod
      chargedDaysCount.value = result.chargedDays
    } finally {
      calculating = false
    }
  },
)

function formatDateFR(dateStr: string): string {
  const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const p = dateStr.split('-').map(Number)
  return `${p[2] ?? ''} ${MONTHS_FR[(p[1] ?? 1) - 1] ?? ''} ${p[0] ?? ''}`
}

// requireInterim : seulement à la soumission (create), pas à l'enregistrement
// d'un brouillon (saveDraft), un brouillon est par nature incomplet. Retour
// client du 23/09 : l'intérimaire devient obligatoire pour tout type
// d'absence (avant, toujours optionnel, aucune condition ne le rendait
// obligatoire).
function validate(requireInterim = true): boolean {
  errors.employee = ''; errors.leaveType = ''; errors.startDate = ''; errors.workingDays = ''; errors.interim = ''
  let ok = true
  if (forWhom.value.mode === 'for-employee' && !forWhom.value.employeeId) { errors.employee = 'Veuillez sélectionner un employé'; ok = false }
  if (!form.leaveTypeId) { errors.leaveType = 'Le type est obligatoire'; ok = false }
  if (!form.startDate) { errors.startDate = 'La date de début est obligatoire'; ok = false }
  if (isNotWorkingDay.value) { errors.startDate = "Ce jour n'est pas un jour ouvrable"; ok = false }
  if (!form.workingDaysCount || form.workingDaysCount <= 0) { errors.workingDays = 'Nombre de jours requis (min. 0.5)'; ok = false }
  if (requireInterim && !isMedicalType.value && !form.interimEmployeeId) { errors.interim = "L'intérimaire est obligatoire"; ok = false }
  // Solde insuffisant n'est plus bloquant (décision du 04/08, même
  // traitement que le préavis) — un avertissement reste affiché en rouge,
  // le validateur décide en connaissance de cause.
  error.value = ok ? '' : 'Veuillez corriger les champs en erreur'
  return ok
}

function buildPayload() {
  return {
    leaveTypeId: form.leaveTypeId,
    startDate:   form.startDate,
    startPeriod: form.startPeriod,
    endDate:     form.endDate || form.startDate,
    endPeriod:   form.endPeriod,
    reason:      form.comment || undefined,
    interimEmployeeId: form.interimEmployeeId || undefined,
    employeeId:  forWhom.value.mode === 'for-employee' ? forWhom.value.employeeId : undefined,
  }
}

async function create() {
  if (!validate()) return
  try {
    await leaveRequestStore.createAndSubmit(buildPayload())
    emit('created'); emit('close')
  } catch {
    error.value = leaveRequestStore.error ?? "La soumission a échoué. Veuillez réessayer."
  }
}
async function saveDraft() {
  if (!validate(false)) return
  try {
    await leaveRequestStore.saveDraft(buildPayload())
    emit('created'); emit('close')
  } catch {
    error.value = leaveRequestStore.error ?? "L'enregistrement a échoué. Veuillez réessayer."
  }
}
</script>

<template>
  <CreateModalShell
    title="Nouvelle demande d'absence"
    banner-label="Nouvelle demande d'absence"
    :create-label="isMedicalType ? 'Enregistrer la déclaration' : 'Soumettre la demande'"
    draft-label="Enregistrer le brouillon"
    :save-error="error"
    @close="emit('close')"
    @create="create"
    @save-draft="saveDraft"
  >
    <template #form>
      <div class="flex-1 overflow-auto px-6 py-5">
        <div class="max-w-3xl mx-auto">
          <FormSection title="Bénéficiaire">
          <ForWhomSelector v-model="forWhom" :available-employees="employeeItems" :error-employee="errors.employee" :hide-self-option="!!auth.user?.isSystem" />
          <div v-if="selectedEmployee" class="flex items-center gap-2.5 mt-3 px-3.5 py-2.5 bg-background border border-border rounded-lg">
            <UserAvatar :name="selectedEmployee.name" size="sm" />
            <div>
              <div class="text-[13px] font-medium text-foreground">{{ selectedEmployee.name }}</div>
              <div class="text-[11px] text-muted-foreground">{{ selectedEmployee.categoryName || 'Sans catégorie' }}</div>
            </div>
          </div>
          </FormSection>

          <FormSection title="Détails de la demande">
          <div class="flex flex-col gap-4">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Type d'absence <span class="text-danger">*</span></label>
              <SearchableDropdown
                :items="leaveTypeItems"
                :model-value="form.leaveTypeId"
                placeholder="Sélectionner un type…"
                :show-avatar="false"
                @update:model-value="form.leaveTypeId = String($event)"
              />
              <div v-if="errors.leaveType" :class="cls.fieldError">{{ errors.leaveType }}</div>

              <div v-if="currentType" class="flex flex-wrap gap-1.5 mt-1.5">
                <span :class="cls.hintChipNeutral"><Calendar class="w-3 h-3" /> Solde : {{ displayedBalance ? `${displayedBalance.balance} j` : `${currentType.daysPerYear} j/an` }}</span>
                <span :class="currentType.documentRequired ? cls.hintChipWarning : cls.hintChipNeutral">
                  <Paperclip class="w-3 h-3" /> Justificatif : {{ currentType.documentRequired ? 'Requis' : 'Non requis' }}
                </span>
                <span v-if="isMedicalType" :class="cls.hintChipInfo">Enregistrement direct, sans validation préalable</span>
              </div>
            </div>

            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date de début <span class="text-danger">*</span></label>
              <input type="date" v-model="form.startDate" :class="[cls.fieldInput, errors.startDate && cls.inputError]" />
              <div v-if="errors.startDate" :class="cls.fieldError">{{ errors.startDate }}</div>
              <div v-if="isPastDate && !isMedicalType" :class="cls.fieldWarning"><TriangleAlert class="w-3.5 h-3.5 shrink-0" /> La date est dans le passé, confirmez-vous ?</div>
            </div>

            <!-- Retour client du 23/09 : "Journée entière" retiré, seuls
                 Matin (jour plein) / Après-midi (demi-journée) restent. -->
            <div :class="cls.field">
              <span :class="cls.fieldLabel">Période de début</span>
              <div :class="cls.radioGroup">
                <label :class="cls.radioItem"><input type="radio" v-model="form.startPeriod" value="am" /><span>Matin</span></label>
                <label :class="cls.radioItem"><input type="radio" v-model="form.startPeriod" value="pm" /><span>Après-midi</span></label>
              </div>
            </div>

            <!-- Retour client du 23/09 : "Date de fin"/"Période de fin" ne
                 sont plus saisissables, le nombre de jours (+ la période de
                 début) suffit à tout calculer, voir "Reprise prévue" ci-dessous. -->
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Nombre de jours <span class="text-danger">*</span></label>
              <input
                type="number" min="0.5" step="0.5"
                v-model.number="form.workingDaysCount"
                :class="[cls.fieldInput, errors.workingDays && cls.inputError]"
                placeholder="ex: 3.5"
              />
              <div v-if="errors.workingDays" :class="cls.fieldError">{{ errors.workingDays }}</div>
              <span
                v-if="form.endDate && form.workingDaysCount"
                class="inline-flex items-center text-[11px] font-semibold rounded-md px-2 py-[3px] mt-1 w-fit"
                :class="isBalanceInsufficient ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success'"
              >{{ form.workingDaysCount }} {{ currentType?.countCalendarDays ? 'j calendaires' : 'j ouvrables' }}<template v-if="chargedDaysCount && chargedDaysCount > form.workingDaysCount"> (+ week-end = {{ chargedDaysCount }} j décomptés)</template></span>
            </div>

            <!-- Retour client du 23/09 : mention Matin/Après-midi ajoutée
                 (avant, toujours "le [date]" sans préciser le moment, et le
                 jour affiché était parfois faux quand la demande se
                 terminait le matin, voir calculateEndDate/getResumeDate). -->
            <div v-if="resumeDate" class="flex items-center gap-2 text-[13px] text-muted-foreground bg-primary/10 rounded-md px-3 py-2">
              <CalendarCheck class="w-4 h-4 text-primary shrink-0" />
              <span>Reprise prévue le <strong class="text-primary">{{ formatDateFR(resumeDate) }}</strong> {{ resumePeriod === 'am' ? 'le matin' : "l'après-midi" }}</span>
            </div>

            <div v-if="isNotWorkingDay" :class="cls.fieldErrorBlock"><CircleAlert class="w-3.5 h-3.5 shrink-0" /> Ce jour n'est pas un jour ouvrable</div>
            <div v-if="isBalanceInsufficient" :class="cls.fieldErrorBlock"><CircleAlert class="w-3.5 h-3.5 shrink-0" /> Solde insuffisant ({{ myBalance?.balance ?? 0 }} jours disponibles)</div>

            <!-- Retour client du 23/09 : obligatoire pour tout type d'absence
                 (sauf déclaration médicale en enregistrement direct). -->
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Intérimaire <span v-if="!isMedicalType" class="text-danger">*</span><span v-else :class="cls.fieldOptional">(optionnel)</span></label>
              <SearchableDropdown
                :items="interimItems"
                :model-value="form.interimEmployeeId"
                placeholder="Qui assure votre intérim ?"
                @update:model-value="form.interimEmployeeId = String($event)"
              />
              <div v-if="errors.interim" :class="cls.fieldError">{{ errors.interim }}</div>
            </div>

            <div :class="cls.field">
              <label :class="cls.fieldLabel">Motif <span :class="cls.fieldOptional">(optionnel)</span></label>
              <textarea v-model="form.comment" :class="cls.fieldTextarea" rows="3" placeholder="Précisez si nécessaire…"></textarea>
            </div>
          </div>
          </FormSection>
        </div>
      </div>
    </template>
  </CreateModalShell>
</template>
