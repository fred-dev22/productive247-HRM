// État en mémoire uniquement — réinitialisé à chaque rechargement (F5).
// Le wizard s'affiche à chaque nouveau chargement mais disparaît
// une fois complété, sans rechargement.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  return {
    isComplete,
    currentStep,
    allStepsComplete,
    complete,
    goToStep,
    nextStep,
    prevStep,
  }
})
