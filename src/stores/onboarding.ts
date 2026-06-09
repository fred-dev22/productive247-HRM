import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCalendarStore }  from './calendar'
import { useEntityStore }    from './entities'
import { useEmployeeStore }  from './employees'

export const useOnboardingStore = defineStore('onboarding', () => {
  const forceDone = ref(false)

  const isCalendarConfigured = computed(() => {
    const calStore = useCalendarStore()
    return Object.values(calStore.calendar.workingDays).some(d => d.enabled)
  })

  const isEntityCreated = computed(() => {
    const entityStore = useEntityStore()
    return entityStore.approvedEntities.length > 0
  })

  const isEmployeeCreated = computed(() => {
    const empStore = useEmployeeStore()
    return empStore.employees.length > 0
  })

  const allStepsComplete = computed(() =>
    forceDone.value || (
      isCalendarConfigured.value &&
      isEntityCreated.value &&
      isEmployeeCreated.value
    )
  )

  function complete() {
    forceDone.value = true
  }

  return {
    isCalendarConfigured,
    isEntityCreated,
    isEmployeeCreated,
    allStepsComplete,
    complete,
  }
})
