import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './plugins/i18n'
import { Vue3OrgChartPlugin } from 'vue3-org-chart'
import './assets/main.css'
import '@tabler/icons-webfont/dist/tabler-icons.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(Vue3OrgChartPlugin)
app.mount('#app')
