<template>
  <span
    class="inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-medium whitespace-nowrap"
    :class="cfg.class"
  >
    {{ cfg.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

interface PillConfig { label: string; class: string }

const CONFIG: Record<string, PillConfig> = {
  draft:            { label: 'Brouillon',  class: 'bg-neutral-bg text-neutral' },
  returned:         { label: 'Retourné',   class: 'bg-info-bg text-info'       },
  pending:          { label: 'En attente', class: 'bg-warning-bg text-warning' },
  pending_approval: { label: 'En attente', class: 'bg-warning-bg text-warning' },
  approved:         { label: 'Approuvé',   class: 'bg-success-bg text-success' },
  rejected:         { label: 'Refusé',     class: 'bg-danger-bg text-danger'   },
  cancelled:        { label: 'Annulé',     class: 'bg-neutral-bg text-neutral' },
  inactive:         { label: 'Désactivé',  class: 'bg-danger-bg text-danger'   },
  active:           { label: 'Actif',      class: 'bg-success-bg text-success' },
  trial:            { label: 'En essai',   class: 'bg-warning-bg text-warning' },
  onleave:          { label: 'En congé',   class: 'bg-info-bg text-info'       },
  registered:       { label: 'Enregistré', class: 'bg-info-bg text-info'       },
  done:             { label: 'Effectué',   class: 'bg-success-bg text-success' },
  regularized:      { label: 'Régularisé', class: 'bg-neutral-bg text-neutral' },
  // OrganizationUnit.Status (backend, PascalCase) — kept distinct from the
  // lowercase keys above, which other domains (Employee…) still use.
  Draft:            { label: 'Brouillon',  class: 'bg-neutral-bg text-neutral' },
  PendingApproval:  { label: 'En attente', class: 'bg-warning-bg text-warning' },
  Active:           { label: 'Approuvé',   class: 'bg-success-bg text-success' },
  Inactive:         { label: 'Désactivée', class: 'bg-danger-bg text-danger'   },

  // LeaveRequest.Status (backend, PascalCase — voir schema.prisma) — Draft
  // est déjà couvert ci-dessus.
  Pending:          { label: 'En attente', class: 'bg-warning-bg text-warning' },
  InApprovalN1:     { label: 'Validation N+1', class: 'bg-warning-bg text-warning' },
  InApprovalN2:     { label: 'Validation N+2', class: 'bg-warning-bg text-warning' },
  InApprovalN3:     { label: 'Validation N+3', class: 'bg-warning-bg text-warning' },
  InApprovalN4:     { label: 'Validation N+4', class: 'bg-warning-bg text-warning' },
  Approved:         { label: 'Approuvé',   class: 'bg-success-bg text-success' },
  Rejected:         { label: 'Refusé',     class: 'bg-danger-bg text-danger'   },
  Returned:         { label: 'Retourné',   class: 'bg-info-bg text-info'       },
  Cancelled:        { label: 'Annulé',     class: 'bg-neutral-bg text-neutral' },
  Registered:       { label: 'Enregistré', class: 'bg-info-bg text-info'       },
  Done:             { label: 'Effectué',   class: 'bg-success-bg text-success' },
  Regularized:      { label: 'Régularisé', class: 'bg-neutral-bg text-neutral' },
}

const cfg = computed<PillConfig>(() =>
  CONFIG[props.status] ?? { label: props.status, class: 'bg-neutral-bg text-neutral' }
)
</script>
