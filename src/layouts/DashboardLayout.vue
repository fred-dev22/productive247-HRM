<script setup lang="ts">
/**
 * Coquille de page principale du HRM (calquée sur le DashboardLayout du
 * frontdesk P247_FD_LWL_APP).
 *
 * Structure : AppTopNav (topbar sombre + navbar) au-dessus d'une zone
 * `#below-topbar` qui contient la sidebar + le contenu de page. Les cards
 * (CardModalShell / CreateModalShell) se téléportent dans `#below-topbar`
 * et le recouvrent (overlay `absolute inset-0`), en gardant la topbar visible.
 */
import AppTopNav from '../components/AppTopNav.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <AppTopNav :user="auth.user" />
    <div id="below-topbar" class="flex flex-1 min-h-0 relative">
      <AppSidebar />
      <main class="flex-1 min-w-0 overflow-y-auto bg-background dashboard-scroll">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.dashboard-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.dashboard-scroll::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
.dashboard-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--color-muted-foreground);
}
</style>
