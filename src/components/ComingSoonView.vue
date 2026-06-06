<template>
  <div class="coming-soon">
    <div class="coming-soon-icon">
      <i class="ti ti-tools"></i>
    </div>
    <h2>{{ title }}</h2>
    <p>Ce module est en cours de développement.</p>
    <p>Il sera disponible prochainement.</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<style scoped>
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: var(--p247-muted);
}
.coming-soon-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--p247-border);
}
.coming-soon h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--p247-text);
  margin-bottom: 8px;
}
.coming-soon p {
  font-size: 13px;
  margin-bottom: 4px;
}
</style>
