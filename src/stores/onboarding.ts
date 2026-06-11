// État en mémoire uniquement — réinitialisé à chaque rechargement (F5).
// Le wizard s'affiche à chaque nouveau chargement mais disparaît
// une fois complété, sans rechargement.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useEmployeeStore } from './employees'

export const useOnboardingStore = defineStore('onboarding', () => {
  // false au chargement → wizard visible
  // true après complete() → wizard caché
  // F5 → repart à false automatiquement
  const isComplete = ref(false)

  const currentStep = ref(1)

  function complete() {
    isComplete.value = true
  }

  function goToStep(step: number) {
    currentStep.value = step
  }

  function nextStep() {
    if (currentStep.value < 3) currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 1) currentStep.value--
  }

  const allStepsComplete = computed(() => isComplete.value)

  // Toujours vrai grâce à l'employé par défaut (compte RH connecté)
  // → bouton « Accéder à l'application » toujours actif dès l'étape 3
  const isEmployeeCreated = computed(() => useEmployeeStore().employees.length >= 1)

  return {
    isComplete,
    currentStep,
    allStepsComplete,
    isEmployeeCreated,
    complete,
    goToStep,
    nextStep,
    prevStep,
  }
})
