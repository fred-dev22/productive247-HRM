<template>
  <div class="ob-shell" :class="{ 'ob-shell--leaving': leaving }">

    <!-- ── En-tête minimal ── -->
    <header class="ob-header">
      <div class="ob-header-left">
        <img src="/galana.webp" alt="Galana" class="ob-logo" />
        <span class="ob-sep" aria-hidden="true"></span>
        <span class="ob-brand">GALANA</span>
      </div>
      <span class="ob-badge">Configuration initiale</span>
    </header>

    <!-- ── Zone centrale ── -->
    <div class="ob-center">

      <!-- Titre principal -->
      <div class="ob-title-wrap">
        <h1 class="ob-title">Bienvenue sur Productive 247 HRM</h1>
        <p class="ob-subtitle">Configurez votre espace en 3 étapes avant de commencer</p>
      </div>

      <!-- Barre de progression -->
      <div class="ob-steps">
        <template v-for="(label, i) in STEP_LABELS" :key="label">
          <div class="ob-step" :class="stepState(i + 1)" @click="i + 1 < ob.currentStep && ob.goToStep(i + 1)">
            <div class="ob-step-circle">
              <i v-if="i + 1 < ob.currentStep" class="ti ti-check" aria-hidden="true"></i>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="ob-step-label">{{ label }}</span>
          </div>
          <div v-if="i < STEP_LABELS.length - 1" class="ob-connector" :class="{ done: i + 1 < ob.currentStep }"></div>
        </template>
      </div>

      <!-- Card contenu principale -->
      <div class="ob-card">
        <Transition name="step" mode="out-in">
          <div :key="ob.currentStep">

            <!-- En-tête de la card -->
            <div class="card-head">
              <div class="card-head-icon">
                <i :class="`ti ${currentMeta.icon}`" aria-hidden="true"></i>
              </div>
              <div>
                <div class="card-head-title">{{ currentMeta.title }}</div>
                <div class="card-head-sub">{{ currentMeta.sub }}</div>
              </div>
            </div>

            <!-- ══ ÉTAPE 1 : Calendrier ══ -->
            <template v-if="ob.currentStep === 1">
              <div class="card-body">
                <WorkingDaysConfig />
                <div v-if="calendarStore.daysPerWeek > 0" class="success-card">
                  <i class="ti ti-circle-check" aria-hidden="true"></i>
                  {{ calendarStore.daysPerWeek }} jour{{ calendarStore.daysPerWeek > 1 ? 's' : '' }} configuré{{ calendarStore.daysPerWeek > 1 ? 's' : '' }}
                  · {{ calendarStore.formatMinutes(calendarStore.weeklyMinutes) }} par semaine
                </div>
              </div>
              <div class="card-foot card-foot--end">
                <button
                  class="btn btn-primary"
                  :disabled="calendarStore.daysPerWeek === 0"
                  @click="ob.nextStep()"
                >Continuer →</button>
              </div>
            </template>

            <!-- ══ ÉTAPE 2 : Entités ══ -->
            <template v-else-if="ob.currentStep === 2">
              <div class="card-body">

                <div class="info-card">
                  <i class="ti ti-info-circle" aria-hidden="true"></i>
                  La Direction Générale a été créée automatiquement.
                  Ajoutez vos départements et services.
                </div>

                <!-- Liste hiérarchique des entités -->
                <div class="entity-list">
                  <div
                    v-for="{ entity, depth } in flatEntities"
                    :key="entity.id"
                    class="entity-row"
                    :style="{ paddingLeft: `${10 + depth * 24}px` }"
                  >
                    <span class="entity-type-badge" :class="`type-${entity.type}`">
                      {{ TYPE_LABELS[entity.type] ?? entity.type }}
                    </span>
                    <span class="entity-name">{{ entity.name }}</span>
                    <span v-if="entity.responsibleName" class="entity-responsible">
                      <i class="ti ti-user" aria-hidden="true"></i> {{ entity.responsibleName }}
                    </span>
                  </div>
                </div>

                <button class="btn btn-outline" @click="showEntityModal = true">
                  <i class="ti ti-plus" aria-hidden="true"></i> Ajouter une entité
                </button>

              </div>
              <div class="card-foot card-foot--between">
                <button class="btn btn-outline" @click="ob.prevStep()">← Précédent</button>
                <div class="foot-right">
                  <button class="btn-skip" @click="ob.nextStep()">Passer →</button>
                  <span :title="flatEntities.length < 2 ? 'Créez au moins un département pour continuer' : ''">
                    <button
                      class="btn btn-primary"
                      :disabled="flatEntities.length < 2"
                      @click="ob.nextStep()"
                    >Continuer →</button>
                  </span>
                </div>
              </div>
            </template>

            <!-- ══ ÉTAPE 3 : Employés ══ -->
            <template v-else>
              <div class="card-body">

                <div class="info-card">
                  <i class="ti ti-info-circle" aria-hidden="true"></i>
                  Votre compte a été créé automatiquement.
                  Ajoutez les autres membres de votre équipe.
                </div>

                <!-- État vide -->
                <div v-if="obEmployees.length === 0" class="empty-state">
                  <i class="ti ti-users" aria-hidden="true"></i>
                  <div class="empty-title">Aucun employé créé</div>
                  <div class="empty-sub">Commencez par ajouter votre premier collaborateur</div>
                </div>

                <!-- Liste compacte -->
                <div v-else class="employee-list">
                  <div v-for="emp in obEmployees" :key="emp.id" class="employee-row">
                    <UserAvatar :name="emp.name" size="sm" />
                    <span class="employee-name">{{ emp.name }}</span>
                    <span class="employee-entity">{{ emp.entityName }}</span>
                    <span class="role-badge">{{ ROLE_LABELS[emp.role] ?? emp.role }}</span>
                  </div>
                </div>

                <button class="btn btn-outline" @click="showEmployeeModal = true">
                  <i class="ti ti-user-plus" aria-hidden="true"></i> Ajouter un employé
                </button>

              </div>
              <div class="card-foot card-foot--between">
                <button class="btn btn-outline" @click="ob.prevStep()">← Précédent</button>
                <button
                  v-if="!ob.isEmployeeCreated"
                  class="btn btn-outline"
                  @click="finish(false)"
                >Passer et accéder →</button>
                <button
                  v-else
                  class="btn btn-primary"
                  @click="finish(true)"
                >Accéder à l'application →</button>
              </div>
            </template>

          </div>
        </Transition>
      </div>

    </div>

    <!-- ── Pied de page ── -->
    <footer class="ob-footer">
      Vous pourrez modifier ces configurations à tout moment dans le menu Configuration
    </footer>

    <!-- ── Modals (composants existants réutilisés, limités à la vue démo) ── -->
    <EntityFormModal
      v-model="showEntityModal"
      :visible-entity-ids="visibleEntityIds"
      :visible-employee-ids="visibleEmployeeIds"
    />
    <EmployeeFormModal
      v-model="showEmployeeModal"
      :visible-entity-ids="visibleEntityIds"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore }       from '../stores/auth'
import { useCalendarStore }   from '../stores/calendar'
import { useEntityStore }     from '../stores/entities'
import { useEmployeeStore }   from '../stores/employees'
import { useOnboardingStore } from '../stores/onboarding'
import WorkingDaysConfig  from '../components/calendar/WorkingDaysConfig.vue'
import EntityFormModal    from '../components/entities/EntityFormModal.vue'
import EmployeeFormModal  from '../components/employees/EmployeeFormModal.vue'
import UserAvatar         from '../components/ui/UserAvatar.vue'
import type { Entity } from '../types'

const auth          = useAuthStore()
const calendarStore = useCalendarStore()
const entityStore   = useEntityStore()
const empStore      = useEmployeeStore()
const ob            = useOnboardingStore()
const router        = useRouter()

// Vérification auth manuelle (la route n'a pas requiresAuth pour éviter les boucles)
onMounted(() => {
  if (!auth.isLoggedIn)         router.replace({ path: '/' })
  else if (auth.isEmployeeSide) router.replace({ path: '/employee' })
  else                          empStore.ensureDefaultEmployee()
})

const showEntityModal   = ref(false)
const showEmployeeModal = ref(false)
const leaving           = ref(false)

// ── Steps ────────────────────────────────────────────────────────────
const STEP_LABELS = ['Calendrier', 'Entités', 'Employés'] as const

const STEP_META: Record<number, { icon: string; title: string; sub: string }> = {
  1: { icon: 'ti-calendar-event', title: 'Configurez votre calendrier', sub: 'Définissez les jours et horaires de travail de votre entreprise' },
  2: { icon: 'ti-building',       title: 'Créez vos entités',           sub: 'Définissez la structure organisationnelle de votre entreprise' },
  3: { icon: 'ti-users',          title: 'Ajoutez vos employés',        sub: 'Créez les comptes de vos collaborateurs' },
}
const currentMeta = computed(() => STEP_META[ob.currentStep]!)

function stepState(step: number): 'done' | 'current' | 'pending' {
  if (step < ob.currentStep)  return 'done'
  if (step === ob.currentStep) return 'current'
  return 'pending'
}

// ── Vue « démo » du wizard ───────────────────────────────────────────
// Les données mock préexistantes sont masquées pendant l'onboarding :
// on fait comme s'il n'y avait que la Direction Générale et le RH
// connecté. Seul ce qui est créé pendant le wizard s'ajoute à l'écran.
const preexistingEntityIds   = new Set(entityStore.entities.map(e => e.id))
const preexistingEmployeeIds = new Set(empStore.employees.map(e => e.id))

const isVisibleEntity = (e: Entity) =>
  e.id === 'e1' || !preexistingEntityIds.has(e.id)

const obEmployees = computed(() =>
  empStore.employees.filter(e =>
    e.id === empStore.currentUserEmployee?.id || !preexistingEmployeeIds.has(e.id)
  )
)

// IDs visibles transmis aux modals pour restreindre leurs dropdowns
const visibleEntityIds   = computed(() => entityStore.entities.filter(isVisibleEntity).map(e => e.id))
const visibleEmployeeIds = computed(() => obEmployees.value.map(e => e.id))

// ── Étape 2 : entités (hiérarchie aplatie depuis buildTree) ──────────
const TYPE_LABELS: Record<string, string> = {
  direction: 'Direction', department: 'Département', service: 'Service',
}

const flatEntities = computed(() => {
  const out: { entity: Entity; depth: number }[] = []
  const walk = (nodes: Entity[], depth: number) => {
    nodes.forEach(n => {
      if (isVisibleEntity(n)) out.push({ entity: n, depth })
      if (n.children) walk(n.children, depth + 1)
    })
  }
  walk(entityStore.buildTree, 0)
  return out
})

// ── Étape 3 : employés ───────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  hr_admin: 'RH Admin', hr_director: 'Dir. RH',
  validator: 'Manager', employee: 'Employé',
}

// ── Fin du wizard ────────────────────────────────────────────────────
function finish(withFade: boolean) {
  if (withFade) {
    leaving.value = true
    setTimeout(() => {
      ob.complete()
      router.push({ path: '/hr' })
    }, 250)
  } else {
    ob.complete()
    router.push({ path: '/hr' })
  }
}
</script>

<style scoped>
/* ── Layout général ── */
.ob-shell {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    var(--galana-green-light) 0%,
    #ffffff 50%,
    var(--galana-red-light) 100%
  );
  display: flex;
  flex-direction: column;
  transition: opacity 0.25s ease;
}
.ob-shell--leaving { opacity: 0; }

/* ── En-tête minimal ── */
.ob-header {
  height: 60px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ob-header-left { display: flex; align-items: center; }
.ob-logo { height: 34px; display: block; }
.ob-sep {
  width: 1px;
  height: 20px;
  margin: 0 14px;
  background: var(--color-border);
}
.ob-brand { font-size: 16px; font-weight: 800; letter-spacing: 0.05em; color: var(--color-text); }
.ob-badge {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary-mid);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

/* ── Zone centrale ── */
.ob-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px;
}

/* ── Titre principal ── */
.ob-title-wrap { text-align: center; margin-bottom: 40px; }
.ob-title    { font-size: 28px; font-weight: 800; color: var(--color-text); margin: 0; }
.ob-subtitle { font-size: 15px; color: var(--color-text-muted); margin: 8px 0 0; }

/* ── Barre de progression ── */
.ob-steps {
  display: flex;
  align-items: flex-start;
  max-width: 600px;
  width: 100%;
  margin: 0 auto 40px;
}
.ob-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.ob-step.done { cursor: pointer; }
.ob-step-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.ob-step.done .ob-step-circle,
.ob-step.current .ob-step-circle {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 0 0 4px var(--color-primary-light);
}
.ob-step.done .ob-step-circle i { font-size: 18px; }
.ob-step.current .ob-step-circle { animation: pulse 2s infinite; }
.ob-step.pending .ob-step-circle {
  background: var(--color-surface);
  color: var(--color-text-muted);
  border: 2px solid var(--color-border);
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px var(--color-primary-light); }
  50%      { box-shadow: 0 0 0 10px transparent; }
}
.ob-step-label {
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
  text-align: center;
  color: var(--color-text-muted);
}
.ob-step.done .ob-step-label,
.ob-step.current .ob-step-label { color: var(--color-primary); }

.ob-connector {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: var(--color-border);
  transition: background 0.4s ease;
  margin-bottom: 20px;
  align-self: center;
}
.ob-connector.done { background: var(--color-primary); }

/* ── Card contenu principale ── */
.ob-card {
  max-width: 860px;
  width: 100%;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.10);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

/* Transition entre étapes */
.step-enter-active,
.step-leave-active { transition: all 0.25s ease; }
.step-enter-from { opacity: 0; transform: translateX(16px); }
.step-leave-to   { opacity: 0; transform: translateX(-16px); }

/* ── En-tête de la card ── */
.card-head {
  padding: 20px 28px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  display: flex;
  align-items: center;
  gap: 14px;
}
.card-head-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-head-icon i  { font-size: 24px; color: var(--color-primary); }
.card-head-title   { font-size: 18px; font-weight: 700; color: var(--color-text); }
.card-head-sub     { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }

/* ── Corps de la card ── */
.card-body {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Pied de la card (boutons) ── */
.card-foot {
  padding: 16px 28px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
}
.card-foot--end     { justify-content: flex-end; }
.card-foot--between { justify-content: space-between; }
.foot-right { display: flex; align-items: center; }

/* ── Card succès (étape 1) ── */
.success-card {
  background: var(--color-success-bg);
  border: 1px solid var(--color-success);
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-success);
}
.success-card i { font-size: 16px; }

/* ── Card info (étapes 2 & 3) ── */
.info-card {
  background: var(--color-info-bg);
  border-left: 3px solid var(--color-info);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.5;
}
.info-card i { color: var(--color-info); font-size: 16px; flex-shrink: 0; margin-top: 1px; }

/* ── Liste des entités ── */
.entity-list { display: flex; flex-direction: column; gap: 4px; }
.entity-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--color-bg);
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
}
.entity-type-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.03em;
}
.type-direction  { background: var(--galana-red);   color: var(--color-surface); }
.type-department { background: var(--galana-green); color: var(--color-surface); }
.type-service    { background: var(--color-surface); color: var(--galana-green); border: 1px solid var(--galana-green); }
.entity-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--color-text); }
.entity-responsible {
  font-size: 11px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* ── Liste des employés ── */
.employee-list { display: flex; flex-direction: column; gap: 4px; }
.employee-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--color-bg);
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
}
.employee-name   { font-size: 13px; font-weight: 500; color: var(--color-text); }
.employee-entity { flex: 1; font-size: 12px; color: var(--color-text-muted); }
.role-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── État vide (étape 3) ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 16px;
  text-align: center;
}
.empty-state i { font-size: 48px; color: var(--color-text-muted); }
.empty-title   { font-size: 14px; font-weight: 600; color: var(--color-text); }
.empty-sub     { font-size: 12px; color: var(--color-text-muted); }

/* ── Boutons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.12s, opacity 0.12s;
  white-space: nowrap;
}
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-outline {
  background: var(--color-surface);
  color: var(--color-text);
  border: 0.5px solid var(--color-border);
}
.btn-outline:hover { background: var(--color-bg); }
.btn-skip {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-right: 12px;
  padding: 4px 0;
  transition: color 0.12s;
}
.btn-skip:hover { color: var(--color-text); }

/* ── Pied de page ── */
.ob-footer {
  height: 48px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--color-text-muted);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .ob-center  { padding: 24px 16px; }
  .ob-card    { max-width: 100%; }
  .card-body,
  .card-head,
  .card-foot  { padding-left: 16px; padding-right: 16px; }
  .card-body  { padding-top: 20px; padding-bottom: 20px; }
  .ob-step-label { display: none; }
  .ob-connector  { margin-bottom: 0; }
  .ob-title   { font-size: 22px; }
}
@media (max-width: 480px) {
  .ob-header { padding: 0 16px; }
  .ob-title  { font-size: 18px; }
  .card-foot,
  .card-foot--between,
  .foot-right { flex-direction: column; gap: 10px; align-items: stretch; }
  .foot-right .btn-skip { margin-right: 0; }
  .btn { width: 100%; justify-content: center; }
}
</style>
