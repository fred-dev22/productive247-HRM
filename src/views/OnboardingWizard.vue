<template>
  <div class="onboarding-shell">
    <AppTopNav :user="auth.user" />

    <main class="onboarding-content">

      <!-- Logo / titre -->
      <div class="ob-header">
        <div class="ob-logo">
          <span class="ob-logo-text">Productive <span class="logo-accent">247</span> HRM</span>
        </div>
        <h1 class="ob-title">Bienvenue sur Productive 247 HRM</h1>
        <p class="ob-subtitle">Configurez votre espace en 3 étapes avant de commencer</p>
      </div>

      <!-- Barre de progression -->
      <div class="progress-bar">
        <div
          v-for="(step, i) in STEPS" :key="step.key"
          class="progress-step"
          :class="{
            'progress-step--done':    i < currentStep || isStepComplete(step.key),
            'progress-step--current': i === currentStep,
          }"
        >
          <div class="progress-dot">
            <i v-if="isStepComplete(step.key)" class="ti ti-check" aria-hidden="true"></i>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="progress-label">{{ step.label }}</span>
          <div v-if="i < STEPS.length - 1" class="progress-line"></div>
        </div>
      </div>

      <!-- Étape active -->
      <div class="step-card">

        <!-- Icône -->
        <div class="step-icon-wrap">
          <i :class="`ti ${STEPS[currentStep]!.icon} step-icon`" aria-hidden="true"></i>
        </div>

        <h2 class="step-title">{{ STEPS[currentStep]!.title }}</h2>
        <p class="step-desc">{{ STEPS[currentStep]!.description }}</p>

        <!-- Recap si déjà configuré -->
        <div v-if="isStepComplete(STEPS[currentStep]!.key)" class="step-done-card">
          <template v-if="STEPS[currentStep]!.key === 'calendar'">
            <div class="done-item"><i class="ti ti-check-circle"></i> Lundi → Vendredi configurés</div>
            <div class="done-item"><i class="ti ti-check-circle"></i> {{ calStore.calendar.holidays.length }} jours fériés enregistrés</div>
            <div class="done-item"><i class="ti ti-check-circle"></i> 7 types de congés configurés</div>
          </template>
          <template v-else-if="STEPS[currentStep]!.key === 'entity'">
            <div class="done-item"><i class="ti ti-check-circle"></i> {{ entityStore.approvedEntities.length }} entité(s) approuvée(s)</div>
          </template>
          <template v-else-if="STEPS[currentStep]!.key === 'employee'">
            <div class="done-item"><i class="ti ti-check-circle"></i> {{ empStore.employees.length }} employé(s) enregistré(s)</div>
          </template>
        </div>

        <!-- Boutons -->
        <div class="step-actions">
          <button class="btn btn-primary" @click="primaryAction">
            <template v-if="isStepComplete(STEPS[currentStep]!.key)">
              <i class="ti ti-check" aria-hidden="true"></i>
              {{ STEPS[currentStep]!.doneLabel }} — Continuer →
            </template>
            <template v-else>
              {{ STEPS[currentStep]!.actionLabel }} →
            </template>
          </button>
          <button
            v-if="currentStep < STEPS.length - 1"
            class="btn-skip"
            @click="skipStep"
          >
            Passer cette étape
          </button>
        </div>

      </div>

      <!-- Note bas de page -->
      <p class="ob-footer-note">
        <i class="ti ti-info-circle" aria-hidden="true"></i>
        Vous pouvez toujours revenir sur ces configurations plus tard dans le menu
        <strong>Configuration</strong>.
      </p>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppTopNav from '../components/AppTopNav.vue'
import { useAuthStore }       from '../stores/auth'
import { useCalendarStore }   from '../stores/calendar'
import { useEntityStore }     from '../stores/entities'
import { useEmployeeStore }   from '../stores/employees'
import { useOnboardingStore } from '../stores/onboarding'

const auth      = useAuthStore()
const calStore  = useCalendarStore()
const entityStore = useEntityStore()
const empStore  = useEmployeeStore()
const obStore   = useOnboardingStore()
const router    = useRouter()

const currentStep = ref(0)

const STEPS = [
  {
    key:         'calendar',
    label:       'Calendrier',
    icon:        'ti-calendar',
    title:       'Configurez votre calendrier',
    description: 'Définissez les jours ouvrables, les jours fériés et les règles de congés de votre entreprise. Ces paramètres serviront de base pour tous les calculs d\'absences.',
    actionLabel: 'Configurer le calendrier',
    doneLabel:   '✓ Calendrier configuré',
    route:       'config-calendar',
  },
  {
    key:         'entity',
    label:       'Structure',
    icon:        'ti-building',
    title:       'Créez votre structure organisationnelle',
    description: 'Définissez la hiérarchie de votre entreprise — direction, départements et services. Cette structure détermine les circuits de validation des demandes.',
    actionLabel: 'Créer la structure',
    doneLabel:   '✓ Structure créée',
    route:       'entities',
  },
  {
    key:         'employee',
    label:       'Équipe',
    icon:        'ti-users',
    title:       'Ajoutez vos employés',
    description: 'Créez les comptes de vos employés et définissez leurs accès. Les employés sans accès numérique peuvent quand même avoir des demandes créées par leur manager.',
    actionLabel: 'Ajouter des employés',
    doneLabel:   '✓ Employés ajoutés',
    route:       'rh-employees',
  },
] as const

function isStepComplete(key: string): boolean {
  if (key === 'calendar')  return obStore.isCalendarConfigured
  if (key === 'entity')    return obStore.isEntityCreated
  if (key === 'employee')  return obStore.isEmployeeCreated
  return false
}

function primaryAction() {
  const step = STEPS[currentStep.value]!
  if (isStepComplete(step.key)) {
    if (currentStep.value < STEPS.length - 1) {
      currentStep.value++
    } else {
      obStore.complete()
      router.push({ name: 'rh' })
    }
  } else {
    router.push({ name: step.route })
  }
}

function skipStep() {
  if (currentStep.value < STEPS.length - 1) {
    currentStep.value++
  } else {
    obStore.complete()
    router.push({ name: 'rh' })
  }
}
</script>

<style scoped>
.onboarding-shell   { display: flex; flex-direction: column; min-height: 100vh; background: var(--color-bg); }
.onboarding-content { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 48px 20px; gap: 28px; max-width: 680px; margin: 0 auto; width: 100%; }

.ob-header { text-align: center; }
.ob-logo   { margin-bottom: 16px; }
.ob-logo-text { font-size: 22px; font-weight: 700; color: var(--color-text); }
.logo-accent  { color: var(--color-primary); }
.ob-title    { font-size: 26px; font-weight: 700; color: var(--color-text); margin-bottom: 8px; }
.ob-subtitle { font-size: 15px; color: var(--color-text-muted); }

/* Progress bar */
.progress-bar { display: flex; align-items: center; width: 100%; gap: 0; }
.progress-step { display: flex; align-items: center; gap: 10px; flex: 1; }
.progress-step:last-child { flex: none; }
.progress-dot {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-bg); border: 2px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: var(--color-text-muted);
  flex-shrink: 0; transition: all .25s;
}
.progress-step--done    .progress-dot { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.progress-step--current .progress-dot { border-color: var(--color-primary); color: var(--color-primary); }
.progress-label { font-size: 12px; font-weight: 500; color: var(--color-text-muted); white-space: nowrap; }
.progress-step--current .progress-label { color: var(--color-primary); font-weight: 600; }
.progress-step--done    .progress-label { color: var(--color-text); }
.progress-line { flex: 1; height: 2px; background: var(--color-border); margin: 0 8px; }
.progress-step--done + .progress-step .progress-line { background: var(--color-primary); }

/* Step card */
.step-card {
  background: var(--color-surface); border: 0.5px solid var(--color-border);
  border-radius: 16px; padding: 40px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  width: 100%; text-align: center;
  box-shadow: 0 2px 16px rgba(0,0,0,.06);
}
.step-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; }
.step-icon      { font-size: 36px; color: var(--color-primary); }
.step-title     { font-size: 20px; font-weight: 700; color: var(--color-text); }
.step-desc      { font-size: 14px; color: var(--color-text-muted); line-height: 1.6; max-width: 500px; }

.step-done-card {
  background: var(--color-bg); border: 0.5px solid var(--color-border);
  border-radius: 8px; padding: 16px 20px;
  display: flex; flex-direction: column; gap: 8px; align-self: stretch;
}
.done-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text); }
.done-item i { color: var(--color-success); font-size: 16px; }

.step-actions { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 8px; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all .12s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-dark); }

.btn-skip { background: none; border: none; cursor: pointer; font-size: 13px; color: var(--color-text-muted); padding: 4px 8px; transition: color .12s; }
.btn-skip:hover { color: var(--color-text); }

.ob-footer-note { font-size: 13px; color: var(--color-text-muted); text-align: center; display: flex; align-items: center; gap: 6px; }
.ob-footer-note i { color: var(--color-primary); }
</style>
