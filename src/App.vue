<template>
  <DashboardLayout v-if="$route.meta.layout === 'dashboard'">
    <RouterView />
  </DashboardLayout>
  <RouterView v-else />
  <Snackbar />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import DashboardLayout from './layouts/DashboardLayout.vue'
import Snackbar from './components/ui/Snackbar.vue'
</script>
