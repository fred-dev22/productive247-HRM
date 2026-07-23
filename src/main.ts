import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './plugins/i18n'
import { Vue3OrgChartPlugin } from 'vue3-org-chart'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(Vue3OrgChartPlugin)

// Restore the session (if a valid JWT is in localStorage) before mounting —
// otherwise the router's first navigation guard would see isLoggedIn=false
// and bounce an already-authenticated user back to /login.
await useAuthStore().restoreSession()

app.mount('#app')
