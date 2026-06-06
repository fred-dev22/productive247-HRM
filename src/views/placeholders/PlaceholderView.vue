<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">
        <ComingSoonView :title="(route.meta.title as string) ?? 'Module en développement'" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { AppTopNav, AppSidebar, ComingSoonView } from '../../components'
import { useAuthStore } from '../../stores/auth'

const auth  = useAuthStore()
const route = useRoute()
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--p247-bg); }
</style>
