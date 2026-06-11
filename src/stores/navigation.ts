import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  const activeModule = ref('administration')

  const previousEntityRoute = ref('/hr/entities')
  const activeEntityTab     = ref('tree')

  function setModule(module: string) {
    activeModule.value = module
  }

  function setPreviousRoute(route: string) {
    previousEntityRoute.value = route
  }

  function setEntityTab(tab: string) {
    activeEntityTab.value = tab
  }

  return {
    activeModule, setModule,
    previousEntityRoute, activeEntityTab,
    setPreviousRoute, setEntityTab,
  }
})
