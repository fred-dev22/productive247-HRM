import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView        from '../views/LoginView.vue'
import DashboardRH       from '../views/DashboardRH.vue'
import DashboardEmployee from '../views/DashboardEmployee.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/rh',
      name: 'rh',
      component: DashboardRH,
      meta: { requiresAuth: true, role: 'rh' },
    },
    {
      path: '/employe',
      name: 'employe',
      component: DashboardEmployee,
      meta: { requiresAuth: true, role: 'employee' },
    },
    {
      path: '/rh/conges',
      name: 'rh-leaves',
      component: () => import('../views/leaves/LeaveListView.vue'),
      meta: { requiresAuth: true, role: 'rh' },
    },
    {
      path: '/employe/demande-conge',
      name: 'employee-leave-request',
      component: () => import('../views/leaves/LeaveRequestView.vue'),
      meta: { requiresAuth: true, role: 'employee' },
    },
    // Catch-all → login
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Guard de navigation
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }

  // Si déjà connecté et on essaie d'aller sur /login → rediriger vers le bon dashboard
  if (to.name === 'login' && auth.isLoggedIn) {
    return auth.isRH ? { name: 'rh' } : { name: 'employe' }
  }
})

export default router