<template>
  <span class="status-pill" :style="{ background: cfg.bg, color: cfg.color }">
    {{ cfg.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

interface PillConfig { label: string; bg: string; color: string }

const CONFIG: Record<string, PillConfig> = {
  draft:            { label: 'Brouillon',  bg: 'var(--color-neutral-bg)', color: 'var(--color-neutral)' },
  pending:          { label: 'En attente', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  pending_approval: { label: 'En attente', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  approved:         { label: 'Approuvé',   bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  rejected:         { label: 'Refusé',     bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)'  },
  cancelled:        { label: 'Annulé',     bg: 'var(--color-neutral-bg)', color: 'var(--color-neutral)' },
  inactive:         { label: 'Inactif',    bg: 'var(--color-neutral-bg)', color: 'var(--color-neutral)' },
  active:           { label: 'Actif',      bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  trial:            { label: 'En essai',   bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  onleave:          { label: 'En congé',   bg: 'var(--color-info-bg)',    color: 'var(--color-info)'    },
}

const cfg = computed<PillConfig>(() =>
  CONFIG[props.status] ?? { label: props.status, bg: 'var(--color-neutral-bg)', color: 'var(--color-neutral)' }
)
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
