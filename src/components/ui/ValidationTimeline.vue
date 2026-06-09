<template>
  <div class="timeline">
    <div
      v-for="(s, i) in history"
      :key="i"
      class="timeline-step"
      :class="`step--${s.action}`"
    >
      <!-- Connecteur vertical -->
      <div v-if="i < history.length - 1" class="timeline-connector" />

      <!-- Dot -->
      <div class="timeline-dot">
        <i :class="dotIcon(s.action)" aria-hidden="true"></i>
      </div>

      <!-- Contenu -->
      <div class="timeline-content">
        <div class="timeline-header">
          <UserAvatar :name="s.actorName" size="sm" />
          <span class="actor-name">{{ s.actorName }}</span>
          <span class="level-badge">{{ levelLabel(s.level) }}</span>
          <span v-if="s.date" class="timeline-date">{{ formatDate(s.date) }}</span>
        </div>
        <div class="timeline-action">{{ actionLabel(s.action) }}</div>
        <div v-if="s.comment" class="timeline-comment">"{{ s.comment }}"</div>
        <div v-if="s.action === 'pending'" class="timeline-pending">
          <i class="ti ti-dots" aria-hidden="true"></i> En attente de validation...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UserAvatar from './UserAvatar.vue'
import type { ValidationStep } from '../../types'

defineProps<{ history: ValidationStep[] }>()

function dotIcon(action: ValidationStep['action']): string {
  const m: Record<ValidationStep['action'], string> = {
    submitted: 'ti ti-send',
    approved:  'ti ti-check',
    rejected:  'ti ti-x',
    returned:  'ti ti-arrow-back',
    pending:   'ti ti-clock',
  }
  return m[action] ?? 'ti ti-circle'
}

function actionLabel(action: ValidationStep['action']): string {
  const m: Record<ValidationStep['action'], string> = {
    submitted: 'Demande soumise',
    approved:  'Validé',
    rejected:  'Refusé',
    returned:  'Retourné pour corrections',
    pending:   'En attente',
  }
  return m[action] ?? action
}

function levelLabel(level: ValidationStep['level']): string {
  const m: Record<ValidationStep['level'], string> = {
    employee: 'Demandeur',
    n1:       'Validateur N+1',
    n2:       'Validateur N+2',
    n3:       'Validateur N+3',
    n4:       'Validateur N+4',
    rh:       'RH',
    system:   'Système',
  }
  return m[level] ?? level
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 0;
}

.timeline-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  padding-bottom: 16px;
}
.timeline-step:last-child { padding-bottom: 0; }

.timeline-connector {
  position: absolute;
  left: 11px;
  top: 24px;
  width: 2px;
  height: calc(100% - 8px);
  background: var(--color-border);
  z-index: 0;
}

.timeline-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; flex-shrink: 0; position: relative; z-index: 1;
  border: 2px solid currentColor;
}

/* Dot colors by action */
.step--submitted .timeline-dot { color: var(--color-info);    background: var(--color-info-bg); }
.step--approved  .timeline-dot { color: var(--color-success); background: var(--color-success-bg); }
.step--rejected  .timeline-dot { color: var(--color-danger);  background: var(--color-danger-bg); }
.step--returned  .timeline-dot { color: var(--color-warning); background: var(--color-warning-bg); }
.step--pending   .timeline-dot { color: var(--color-neutral); background: var(--color-neutral-bg); }

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
  flex: 1;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.actor-name { font-size: 13px; font-weight: 600; color: var(--color-text); }

.level-badge {
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 20px;
  background: var(--color-neutral-bg); color: var(--color-neutral);
  white-space: nowrap;
}

.timeline-date {
  font-size: 11px; color: var(--color-text-muted);
  margin-left: auto; white-space: nowrap;
}

.timeline-action {
  font-size: 12px; color: var(--color-text-muted);
}

.step--approved  .timeline-action { color: var(--color-success); font-weight: 500; }
.step--rejected  .timeline-action { color: var(--color-danger);  font-weight: 500; }
.step--returned  .timeline-action { color: var(--color-warning); font-weight: 500; }
.step--submitted .timeline-action { color: var(--color-info);    font-weight: 500; }

.timeline-comment {
  font-size: 12px; color: var(--color-text-muted);
  font-style: italic;
  background: var(--color-bg);
  border-left: 2px solid var(--color-border);
  padding: 4px 8px;
  border-radius: 0 4px 4px 0;
}

.timeline-pending {
  font-size: 11px; color: var(--color-neutral);
  display: flex; align-items: center; gap: 4px;
  font-style: italic;
}
</style>
