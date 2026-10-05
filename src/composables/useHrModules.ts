import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'
import { PLACEHOLDER_MODULES_ENABLED } from '../config/features'

// Modules du cote RH (Administration, Recrutement...) et navigation entre
// eux. Partage par la barre de navigation (grand ecran) et le tiroir du menu
// burger (petit ecran), pour que les deux proposent exactement les memes choix.
export function useHrModules() {
  const router   = useRouter()
  const auth     = useAuthStore()
  const navStore = useNavigationStore()
  const { t }    = useI18n()

  // 'administration' contient des fonctionnalités réelles couvertes par des
  // permissions — masqué si l'utilisateur n'en a aucune. 'recruitment'/
  // 'training'/'payroll'/'reports' restent des modules placeholder (voir
  // PLACEHOLDER_MODULES_ENABLED, src/config/features.ts) — masqués tant
  // qu'ils ne sont pas construits.
  const hrNavItems = computed(() => [
    { key: 'administration', label: t('nav.admin'), visible: auth.hasAnyPermission([
      'EMPLOYE_VOIR_TOUT', 'EMPLOYE_VOIR_EQUIPE', 'ENTITE_VOIR',
      'MISSION_VOIR_TOUT', 'MISSION_VOIR_EQUIPE', 'FRAIS_VOIR_TOUT', 'FRAIS_VOIR_EQUIPE',
      'CONGE_VOIR_TOUT', 'CONGE_VOIR_EQUIPE',
      'CONFIG_CALENDRIER', 'CONFIG_FRAIS_MISSION',
    ]) },
    { key: 'recruitment', label: t('nav.recruitment'), visible: PLACEHOLDER_MODULES_ENABLED },
    { key: 'training',    label: t('nav.training'),    visible: PLACEHOLDER_MODULES_ENABLED },
    { key: 'payroll',     label: t('nav.payroll'),      visible: PLACEHOLDER_MODULES_ENABLED },
    { key: 'reports', label: t('nav.reports'), visible: PLACEHOLDER_MODULES_ENABLED && auth.hasAnyPermission(['RAPPORT_VOIR', 'ENTITE_VOIR']) },
  ].filter((item) => item.visible))

  function handleHRNav(key: string) {
    navStore.setModule(key)
    const defaults: Record<string, string> = {
      administration: 'hr-dashboard',
      recruitment:    'hr-recruitment',
      training:       'hr-training',
      payroll:        'hr-payroll',
      reports:        'hr-reports',
    }
    if (defaults[key]) router.push({ name: defaults[key] })
  }

  return { hrNavItems, handleHRNav }
}
