import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore }       from '../stores/auth'
import { useOnboardingStore } from '../stores/onboarding'
import LoginView         from '../views/LoginView.vue'
import DashboardHR       from '../views/DashboardHR.vue'
import DashboardEmployee from '../views/DashboardEmployee.vue'
import CalendarView      from '../views/calendar/CalendarView.vue'

const PH = () => import('../views/placeholders/PlaceholderView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },

    // ── Dashboards ──────────────────────────────────────────────
    { path: '/hr',       name: 'hr-dashboard',       component: DashboardHR,       meta: { requiresAuth: true } },
    { path: '/employee', name: 'employee-dashboard', component: DashboardEmployee, meta: { requiresAuth: true } },

    // ── Onboarding ───────────────────────────────────────────────
    // Pas de requiresAuth — vérification manuelle dans le composant pour éviter les boucles
    {
      path: '/onboarding', name: 'onboarding',
      component: () => import('../views/OnboardingWizard.vue'),
    },

    // ── HR Absences ─────────────────────────────────────────────
    {
      path: '/hr/absences', name: 'hr-absences',
      component: () => import('../views/absences/AbsenceListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hr/absences/balances', name: 'hr-leave-balances',
      component: () => import('../views/absences/LeaveBalancesView.vue'),
      meta: { requiresAuth: true },
    },

    // ── HR Administration ────────────────────────────────────────
    {
      path: '/hr/employees', name: 'hr-employees',
      component: () => import('../views/employees/EmployeeListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hr/employees/new', name: 'hr-employee-create',
      component: () => import('../views/employees/EmployeeFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hr/employees/:id/edit', name: 'hr-employee-edit',
      component: () => import('../views/employees/EmployeeFormView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/hr/missions',           name: 'hr-missions',   component: () => import('../views/missions/MissionListView.vue'),  meta: { requiresAuth: true } },
    { path: '/hr/expenses',           name: 'hr-expenses',   component: () => import('../views/expenses/ExpenseListView.vue'),   meta: { requiresAuth: true } },
    { path: '/hr/contracts',          name: 'hr-contracts',  component: PH, meta: { requiresAuth: true, title: 'Gestion des Contrats' } },
    { path: '/hr/reports/statistics', name: 'hr-statistics', component: () => import('../views/reports/StatisticsView.vue'),     meta: { requiresAuth: true } },
    {
      path: '/hr/org-chart', name: 'hr-org-chart',
      component: () => import('../views/rh/OrgChartView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/hr/planning', name: 'hr-planning',
      component: () => import('../views/employee/EmployeePlanningView.vue'),
      meta: { requiresAuth: true },
    },

    // ── Configuration ─────────────────────────────────────────────
    { path: '/hr/config', redirect: '/hr/config/calendar' },
    {
      path: '/hr/config/calendar', name: 'hr-config-calendar',
      component: CalendarView,
      meta: { requiresAuth: true },
    },
    { path: '/hr/config/leave-types', name: 'hr-config-leave-types', redirect: '/hr/config/calendar' },
    {
      path: '/hr/config/mission-fees', name: 'hr-config-mission-fees',
      component: () => import('../views/configuration/MissionConfigView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hr/config/perdiems', name: 'hr-config-perdiems',
      component: () => import('../views/configuration/PerdiemView.vue'),
      meta: { requiresAuth: true },
    },

    // Redirects de compatibilité (anciennes URLs)
    { path: '/hr/calendar', redirect: '/hr/config/calendar' },
    { path: '/rh', redirect: '/hr' },
    { path: '/rh/:pathMatch(.*)*', redirect: (to) => ({ path: '/hr/' + (to.params.pathMatch as string[]).join('/') }) },
    { path: '/employe', redirect: '/employee' },
    { path: '/employe/:pathMatch(.*)*', redirect: (to) => ({ path: '/employee/' + (to.params.pathMatch as string[]).join('/') }) },

    // ── Entités ──────────────────────────────────────────────────
    {
      path: '/hr/entities', name: 'hr-entities',
      component: () => import('../views/entities/EntityListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hr/entities/new', name: 'hr-entity-create',
      component: () => import('../views/entities/EntityFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hr/entities/:id/edit', name: 'hr-entity-edit',
      component: () => import('../views/entities/EntityFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hr/entities/:id', name: 'hr-entity-detail',
      component: () => import('../views/entities/EntityDetailView.vue'),
      meta: { requiresAuth: true },
    },

    // ── Module Recrutement ───────────────────────────────────────
    { path: '/hr/recruitment',              name: 'hr-recruitment',              component: PH, meta: { requiresAuth: true, title: 'Tableau de bord Recrutement' } },
    { path: '/hr/recruitment/positions',    name: 'hr-recruitment-positions',    component: PH, meta: { requiresAuth: true, title: "Offres d'emploi" } },
    { path: '/hr/recruitment/applications', name: 'hr-recruitment-applications', component: PH, meta: { requiresAuth: true, title: 'Candidatures' } },
    { path: '/hr/recruitment/interviews',   name: 'hr-recruitment-interviews',   component: PH, meta: { requiresAuth: true, title: 'Entretiens' } },
    { path: '/hr/recruitment/pipeline',     name: 'hr-recruitment-pipeline',     component: PH, meta: { requiresAuth: true, title: 'Pipeline de recrutement' } },
    { path: '/hr/recruitment/cv-library',   name: 'hr-recruitment-cv-library',   component: PH, meta: { requiresAuth: true, title: 'CVthèque / Potentiels' } },
    { path: '/hr/recruitment/spontaneous',  name: 'hr-recruitment-spontaneous',  component: PH, meta: { requiresAuth: true, title: 'Candidatures spontanées' } },
    { path: '/hr/recruitment/internships',  name: 'hr-recruitment-internships',  component: PH, meta: { requiresAuth: true, title: 'Demandes de stage' } },
    { path: '/hr/recruitment/needs',        name: 'hr-recruitment-needs',        component: PH, meta: { requiresAuth: true, title: "Expressions de besoin" } },
    { path: '/hr/recruitment/contracts',    name: 'hr-recruitment-contracts',    component: PH, meta: { requiresAuth: true, title: 'Contrats à générer' } },
    { path: '/hr/recruitment/trial',        name: 'hr-recruitment-trial',        component: PH, meta: { requiresAuth: true, title: "Périodes d'essai" } },

    // ── Module Formation ─────────────────────────────────────────
    { path: '/hr/training',             name: 'hr-training',             component: PH, meta: { requiresAuth: true, title: 'Tableau de bord Formation' } },
    { path: '/hr/training/catalog',     name: 'hr-training-catalog',     component: PH, meta: { requiresAuth: true, title: 'Catalogue formations' } },
    { path: '/hr/training/sessions',    name: 'hr-training-sessions',    component: PH, meta: { requiresAuth: true, title: 'Sessions planifiées' } },
    { path: '/hr/training/enrollments', name: 'hr-training-enrollments', component: PH, meta: { requiresAuth: true, title: 'Inscriptions' } },
    { path: '/hr/training/hot-evals',   name: 'hr-training-hot-evals',   component: PH, meta: { requiresAuth: true, title: 'Évaluations à chaud' } },
    { path: '/hr/training/cold-evals',  name: 'hr-training-cold-evals',  component: PH, meta: { requiresAuth: true, title: 'Évaluations à froid' } },
    { path: '/hr/training/grades',      name: 'hr-training-grades',      component: PH, meta: { requiresAuth: true, title: 'Notes participants' } },
    { path: '/hr/training/budget',      name: 'hr-training-budget',      component: PH, meta: { requiresAuth: true, title: 'Suivi budgétaire' } },
    { path: '/hr/training/providers',   name: 'hr-training-providers',   component: PH, meta: { requiresAuth: true, title: 'Prestataires' } },

    // ── Module Paie ──────────────────────────────────────────────
    { path: '/hr/payroll',              name: 'hr-payroll',              component: PH, meta: { requiresAuth: true, title: 'Tableau de bord Paie' } },
    { path: '/hr/payroll/periods',      name: 'hr-payroll-periods',      component: PH, meta: { requiresAuth: true, title: 'Périodes de paie' } },
    { path: '/hr/payroll/payslips',     name: 'hr-payroll-payslips',     component: PH, meta: { requiresAuth: true, title: 'Bulletins de paie' } },
    { path: '/hr/payroll/register',     name: 'hr-payroll-register',     component: PH, meta: { requiresAuth: true, title: 'Registre du personnel' } },
    { path: '/hr/payroll/attendance',   name: 'hr-payroll-attendance',   component: PH, meta: { requiresAuth: true, title: 'Suivi des présences' } },
    { path: '/hr/payroll/import',       name: 'hr-payroll-import',       component: PH, meta: { requiresAuth: true, title: 'Import CSV présences' } },
    { path: '/hr/payroll/overtime',     name: 'hr-payroll-overtime',     component: PH, meta: { requiresAuth: true, title: 'Heures supplémentaires' } },
    { path: '/hr/payroll/cnaps',        name: 'hr-payroll-cnaps',        component: PH, meta: { requiresAuth: true, title: 'État CNaPS' } },
    { path: '/hr/payroll/ostie',        name: 'hr-payroll-ostie',        component: PH, meta: { requiresAuth: true, title: 'État OSTIE' } },
    { path: '/hr/payroll/fmfp',         name: 'hr-payroll-fmfp',         component: PH, meta: { requiresAuth: true, title: 'État FMFP' } },
    { path: '/hr/payroll/irsa',         name: 'hr-payroll-irsa',         component: PH, meta: { requiresAuth: true, title: 'État IRSA' } },
    { path: '/hr/payroll/salary-grids', name: 'hr-payroll-salary-grids', component: PH, meta: { requiresAuth: true, title: 'Grilles salariales' } },
    { path: '/hr/payroll/raises',       name: 'hr-payroll-raises',       component: PH, meta: { requiresAuth: true, title: 'Augmentations' } },
    { path: '/hr/payroll/thirteenth',   name: 'hr-payroll-thirteenth',   component: PH, meta: { requiresAuth: true, title: '13e mois' } },

    // ── Module Rapports ──────────────────────────────────────────
    { path: '/hr/reports',              name: 'hr-reports',              component: PH, meta: { requiresAuth: true, title: 'Tableau de bord Rapports' } },
    { path: '/hr/reports/headcount',    name: 'hr-reports-headcount',    component: PH, meta: { requiresAuth: true, title: 'Liste du personnel' } },
    { path: '/hr/reports/movements',    name: 'hr-reports-movements',    component: PH, meta: { requiresAuth: true, title: 'Mouvements du personnel' } },
    { path: '/hr/reports/pyramid',      name: 'hr-reports-pyramid',      component: PH, meta: { requiresAuth: true, title: 'Pyramide des âges' } },
    { path: '/hr/reports/absenteeism',  name: 'hr-reports-absenteeism',  component: PH, meta: { requiresAuth: true, title: "Taux d'absentéisme" } },
    { path: '/hr/reports/turnover',     name: 'hr-reports-turnover',     component: PH, meta: { requiresAuth: true, title: 'Turnover & ancienneté' } },
    { path: '/hr/reports/export-excel', name: 'hr-reports-export-excel', component: PH, meta: { requiresAuth: true, title: 'Export Excel' } },
    { path: '/hr/reports/export-csv',   name: 'hr-reports-export-csv',   component: PH, meta: { requiresAuth: true, title: 'Export CSV' } },
    { path: '/hr/reports/navision',     name: 'hr-reports-navision',     component: PH, meta: { requiresAuth: true, title: 'Intégration Navision' } },

    // ── Espace Employé ───────────────────────────────────────────
    {
      path: '/employee/absences', name: 'employee-absences',
      component: () => import('../views/absences/AbsenceRequestView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/employee/profile', name: 'employee-profile', component: () => import('../views/employee/UserProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/hr/profile',       name: 'hr-profile',       component: () => import('../views/employee/UserProfileView.vue'), meta: { requiresAuth: true } },
    {
      path: '/employee/planning', name: 'employee-planning',
      component: () => import('../views/employee/EmployeePlanningView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/employee/missions', name: 'employee-missions', component: () => import('../views/missions/MissionListView.vue'),  meta: { requiresAuth: true } },
    { path: '/employee/expenses', name: 'employee-expenses', component: () => import('../views/expenses/ExpenseListView.vue'),   meta: { requiresAuth: true } },
    {
      path: '/employee/to-validate', name: 'employee-to-validate',
      component: () => import('../views/employee/ToValidateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/employee/team', name: 'employee-team',
      component: () => import('../views/employee/TeamView.vue'),
      meta: { requiresAuth: true },
    },

    // Catch-all → login
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// ── Guard de navigation ──────────────────────────────────────
router.beforeEach((to) => {
  const auth       = useAuthStore()
  const onboarding = useOnboardingStore()

  // Non connecté → login
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/' }
  }

  // Déjà connecté → pas besoin du login
  if (to.name === 'login' && auth.isLoggedIn) {
    return auth.isHRSide ? { path: '/hr' } : { path: '/employee' }
  }

  if (auth.isLoggedIn) {
    if (to.path.startsWith('/hr') && auth.isEmployeeSide) {
      return { path: '/employee' }
    }
    if (to.path.startsWith('/employee') && auth.isHRSide) {
      return { path: '/hr' }
    }

    // RH connecté + wizard pas terminé → forcer le wizard
    if (
      auth.isHRSide &&
      !onboarding.allStepsComplete &&
      to.path !== '/onboarding'
    ) {
      return { path: '/onboarding' }
    }
  }
})

export default router
