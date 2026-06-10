import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore }      from '../stores/auth'
import { useOnboardingStore } from '../stores/onboarding'
import LoginView        from '../views/LoginView.vue'
import DashboardRH       from '../views/DashboardRH.vue'
import DashboardEmployee from '../views/DashboardEmployee.vue'
import CalendarView      from '../views/calendar/CalendarView.vue'

const PH = () => import('../views/placeholders/PlaceholderView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },

    // ── Dashboards ──────────────────────────────────────────────
    { path: '/rh',     name: 'rh',     component: DashboardRH,       meta: { requiresAuth: true } },
    { path: '/employe', name: 'employe', component: DashboardEmployee, meta: { requiresAuth: true } },

    // ── Onboarding ───────────────────────────────────────────────
    {
      path: '/onboarding', name: 'onboarding',
      component: () => import('../views/OnboardingWizard.vue'),
      meta: { requiresAuth: true },
    },

    // ── Absences RH ─────────────────────────────────────────────
    {
      path: '/rh/absences', name: 'rh-absences',
      component: () => import('../views/absences/AbsenceListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rh/absences/soldes', name: 'rh-absence-balances',
      component: () => import('../views/absences/AbsenceBalancesView.vue'),
      meta: { requiresAuth: true },
    },

    // ── Administration RH ────────────────────────────────────────
    {
      path: '/rh/employes', name: 'rh-employees',
      component: () => import('../views/employees/EmployeeListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rh/employes/nouveau', name: 'rh-employee-create',
      component: () => import('../views/employees/EmployeeFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rh/employes/:id/modifier', name: 'rh-employee-edit',
      component: () => import('../views/employees/EmployeeFormView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/rh/missions',       name: 'rh-missions',   component: () => import('../views/missions/MissionListView.vue'), meta: { requiresAuth: true } },
    { path: '/rh/notes-de-frais', name: 'rh-expenses',   component: () => import('../views/expenses/ExpenseListView.vue'), meta: { requiresAuth: true } },
    { path: '/rh/contrats',       name: 'rh-contracts',  component: PH, meta: { requiresAuth: true, title: 'Gestion des Contrats' } },
    { path: '/rh/rapports/stats', name: 'rh-stats',      component: () => import('../views/reports/StatisticsView.vue'), meta: { requiresAuth: true } },
    {
      path: '/rh/organigramme', name: 'rh-organigramme',
      component: () => import('../views/rh/OrganigrammeView.vue'),
      meta: { requiresAuth: true },
    },

    // ── Configuration ─────────────────────────────────────────────
    { path: '/rh/configuration', redirect: '/rh/configuration/calendrier' },
    {
      path: '/rh/configuration/calendrier', name: 'config-calendar',
      component: CalendarView,
      meta: { requiresAuth: true },
    },
    { path: '/rh/configuration/types-absence', name: 'config-leave-types', redirect: '/rh/configuration/calendrier' },
    {
      path: '/rh/configuration/missions', name: 'config-missions',
      component: () => import('../views/configuration/MissionConfigView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rh/configuration/perdiems', name: 'config-perdiems',
      component: () => import('../views/configuration/PerdiemView.vue'),
      meta: { requiresAuth: true },
    },

    // Ancienne route calendrier → redirect pour compatibilité
    { path: '/rh/calendrier', redirect: '/rh/configuration/calendrier' },

    // ── Entités ──────────────────────────────────────────────────
    {
      path: '/rh/entites', name: 'entities',
      component: () => import('../views/entities/EntityListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rh/entites/nouvelle', name: 'entity-create',
      component: () => import('../views/entities/EntityFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rh/entites/:id/modifier', name: 'entity-edit',
      component: () => import('../views/entities/EntityFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rh/entites/:id', name: 'entity-detail',
      component: () => import('../views/entities/EntityDetailView.vue'),
      meta: { requiresAuth: true },
    },

    // ── Module Recrutement ───────────────────────────────────────
    { path: '/rh/recrutement',              name: 'rh-recrutement',              component: PH, meta: { requiresAuth: true, title: 'Tableau de bord Recrutement' } },
    { path: '/rh/recrutement/offres',       name: 'rh-recrutement-offres',       component: PH, meta: { requiresAuth: true, title: "Offres d'emploi" } },
    { path: '/rh/recrutement/candidatures', name: 'rh-recrutement-candidatures', component: PH, meta: { requiresAuth: true, title: 'Candidatures' } },
    { path: '/rh/recrutement/entretiens',   name: 'rh-recrutement-entretiens',   component: PH, meta: { requiresAuth: true, title: 'Entretiens' } },
    { path: '/rh/recrutement/pipeline',     name: 'rh-recrutement-pipeline',     component: PH, meta: { requiresAuth: true, title: 'Pipeline de recrutement' } },
    { path: '/rh/recrutement/cvtheque',     name: 'rh-recrutement-cvtheque',     component: PH, meta: { requiresAuth: true, title: 'CVthèque / Potentiels' } },
    { path: '/rh/recrutement/spontanees',   name: 'rh-recrutement-spontanees',   component: PH, meta: { requiresAuth: true, title: 'Candidatures spontanées' } },
    { path: '/rh/recrutement/stages',       name: 'rh-recrutement-stages',       component: PH, meta: { requiresAuth: true, title: 'Demandes de stage' } },
    { path: '/rh/recrutement/besoins',      name: 'rh-recrutement-besoins',      component: PH, meta: { requiresAuth: true, title: "Expressions de besoin" } },
    { path: '/rh/recrutement/contrats',     name: 'rh-recrutement-contrats',     component: PH, meta: { requiresAuth: true, title: 'Contrats à générer' } },
    { path: '/rh/recrutement/essai',        name: 'rh-recrutement-essai',        component: PH, meta: { requiresAuth: true, title: "Périodes d'essai" } },

    // ── Module Formation ─────────────────────────────────────────
    { path: '/rh/formation',               name: 'rh-formation',               component: PH, meta: { requiresAuth: true, title: 'Tableau de bord Formation' } },
    { path: '/rh/formation/catalogue',     name: 'rh-formation-catalogue',     component: PH, meta: { requiresAuth: true, title: 'Catalogue formations' } },
    { path: '/rh/formation/sessions',      name: 'rh-formation-sessions',      component: PH, meta: { requiresAuth: true, title: 'Sessions planifiées' } },
    { path: '/rh/formation/inscriptions',  name: 'rh-formation-inscriptions',  component: PH, meta: { requiresAuth: true, title: 'Inscriptions' } },
    { path: '/rh/formation/eval-chaud',    name: 'rh-formation-eval-chaud',    component: PH, meta: { requiresAuth: true, title: 'Évaluations à chaud' } },
    { path: '/rh/formation/eval-froid',    name: 'rh-formation-eval-froid',    component: PH, meta: { requiresAuth: true, title: 'Évaluations à froid' } },
    { path: '/rh/formation/notes',         name: 'rh-formation-notes',         component: PH, meta: { requiresAuth: true, title: 'Notes participants' } },
    { path: '/rh/formation/budget',        name: 'rh-formation-budget',        component: PH, meta: { requiresAuth: true, title: 'Suivi budgétaire' } },
    { path: '/rh/formation/prestataires',  name: 'rh-formation-prestataires',  component: PH, meta: { requiresAuth: true, title: 'Prestataires' } },

    // ── Module Paie ──────────────────────────────────────────────
    { path: '/rh/paie',               name: 'rh-paie',               component: PH, meta: { requiresAuth: true, title: 'Tableau de bord Paie' } },
    { path: '/rh/paie/periodes',      name: 'rh-paie-periodes',      component: PH, meta: { requiresAuth: true, title: 'Périodes de paie' } },
    { path: '/rh/paie/bulletins',     name: 'rh-paie-bulletins',     component: PH, meta: { requiresAuth: true, title: 'Bulletins de paie' } },
    { path: '/rh/paie/registre',      name: 'rh-paie-registre',      component: PH, meta: { requiresAuth: true, title: 'Registre du personnel' } },
    { path: '/rh/paie/presences',     name: 'rh-paie-presences',     component: PH, meta: { requiresAuth: true, title: 'Suivi des présences' } },
    { path: '/rh/paie/import-csv',    name: 'rh-paie-import-csv',    component: PH, meta: { requiresAuth: true, title: 'Import CSV présences' } },
    { path: '/rh/paie/heures-supp',   name: 'rh-paie-heures-supp',   component: PH, meta: { requiresAuth: true, title: 'Heures supplémentaires' } },
    { path: '/rh/paie/cnaps',         name: 'rh-paie-cnaps',         component: PH, meta: { requiresAuth: true, title: 'État CNaPS' } },
    { path: '/rh/paie/ostie',         name: 'rh-paie-ostie',         component: PH, meta: { requiresAuth: true, title: 'État OSTIE' } },
    { path: '/rh/paie/fmfp',          name: 'rh-paie-fmfp',          component: PH, meta: { requiresAuth: true, title: 'État FMFP' } },
    { path: '/rh/paie/irsa',          name: 'rh-paie-irsa',          component: PH, meta: { requiresAuth: true, title: 'État IRSA' } },
    { path: '/rh/paie/grilles',       name: 'rh-paie-grilles',       component: PH, meta: { requiresAuth: true, title: 'Grilles salariales' } },
    { path: '/rh/paie/augmentations', name: 'rh-paie-augmentations', component: PH, meta: { requiresAuth: true, title: 'Augmentations' } },
    { path: '/rh/paie/treizieme',     name: 'rh-paie-treizieme',     component: PH, meta: { requiresAuth: true, title: '13e mois' } },

    // ── Module Rapports ──────────────────────────────────────────
    { path: '/rh/rapports',               name: 'rh-rapports',               component: PH, meta: { requiresAuth: true, title: 'Tableau de bord Rapports' } },
    { path: '/rh/rapports/personnel',     name: 'rh-rapports-personnel',     component: PH, meta: { requiresAuth: true, title: 'Liste du personnel' } },
    { path: '/rh/rapports/mouvements',    name: 'rh-rapports-mouvements',    component: PH, meta: { requiresAuth: true, title: 'Mouvements du personnel' } },
    { path: '/rh/rapports/pyramide',      name: 'rh-rapports-pyramide',      component: PH, meta: { requiresAuth: true, title: 'Pyramide des âges' } },
    { path: '/rh/rapports/absenteisme',   name: 'rh-rapports-absenteisme',   component: PH, meta: { requiresAuth: true, title: "Taux d'absentéisme" } },
    { path: '/rh/rapports/turnover',      name: 'rh-rapports-turnover',      component: PH, meta: { requiresAuth: true, title: 'Turnover & ancienneté' } },
    { path: '/rh/rapports/export-excel',  name: 'rh-rapports-export-excel',  component: PH, meta: { requiresAuth: true, title: 'Export Excel' } },
    { path: '/rh/rapports/export-csv',    name: 'rh-rapports-export-csv',    component: PH, meta: { requiresAuth: true, title: 'Export CSV' } },
    { path: '/rh/rapports/navision',      name: 'rh-rapports-navision',      component: PH, meta: { requiresAuth: true, title: 'Intégration Navision' } },

    // ── Espace Employé ───────────────────────────────────────────
    {
      path: '/employe/absences', name: 'employee-absences',
      component: () => import('../views/absences/AbsenceRequestView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/employe/profil', name: 'employee-profile', component: () => import('../views/employee/ProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/rh/profil',      name: 'rh-profile',       component: () => import('../views/employee/ProfileView.vue'), meta: { requiresAuth: true } },
    {
      path: '/employe/planning', name: 'employee-planning',
      component: () => import('../views/employee/PlanningView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rh/planning', name: 'rh-planning',
      component: () => import('../views/employee/PlanningView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/employe/missions',      name: 'employee-missions', component: () => import('../views/missions/MissionListView.vue'),  meta: { requiresAuth: true } },
    { path: '/employe/notes-de-frais', name: 'employee-expenses', component: () => import('../views/expenses/ExpenseListView.vue'), meta: { requiresAuth: true } },
    {
      path: '/employe/a-valider', name: 'employee-validator',
      component: () => import('../views/employee/ToValidateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/employe/equipe', name: 'employee-team',
      component: () => import('../views/employee/TeamView.vue'),
      meta: { requiresAuth: true },
    },

    // Catch-all → login
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// ── Guard de navigation ──────────────────────────────────────
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }

  if (to.name === 'login' && auth.isLoggedIn) {
    return auth.isHRSide ? { name: 'rh' } : { name: 'employe' }
  }

  if (auth.isLoggedIn) {
    if (to.path.startsWith('/rh') && auth.isEmployeeSide) {
      return { name: 'employe' }
    }
    if (to.path.startsWith('/employe') && auth.isHRSide) {
      return { name: 'rh' }
    }

    // Guard onboarding — côté RH uniquement, hors onboarding lui-même
    if (auth.isHRSide && to.name !== 'onboarding') {
      const ob = useOnboardingStore()
      if (!ob.allStepsComplete) {
        return { name: 'onboarding' }
      }
    }
  }
})

export default router
