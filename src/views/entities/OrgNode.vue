<template>
  <div class="org-item">
    <!-- ── Carte du nœud ── -->
    <div class="org-card" :class="`type-${entity.type}`">
      <div class="card-main">

        <!-- Toggle collapse -->
        <button
          v-if="hasChildren"
          class="toggle-btn"
          @click.stop="toggle"
          :title="isCollapsed ? 'Déplier' : 'Replier'"
        >
          <i :class="isCollapsed ? 'ti ti-chevron-right' : 'ti ti-chevron-down'"></i>
        </button>
        <div v-else class="toggle-spacer"></div>

        <!-- Icône type -->
        <div class="type-icon">
          <i :class="typeIcon"></i>
        </div>

        <!-- Code badge -->
        <span class="code-badge">{{ entity.code }}</span>

        <!-- Nom + responsable -->
        <div class="card-body">
          <div class="card-name">{{ entity.name }}</div>
          <div class="card-responsible" v-if="entity.responsibleName">
            <i class="ti ti-user"></i> {{ entity.responsibleName }}
          </div>
        </div>

        <!-- Méta droite -->
        <div class="card-meta">
          <span class="headcount">
            <i class="ti ti-users"></i> {{ entity.headcount }}
          </span>
          <span class="status-pill" :class="statusClass">{{ statusText }}</span>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <button class="act-btn" @click.stop="navigateToDetail(entity.id)">
            Voir →
          </button>
          <button
            v-if="entity.status === 'draft'"
            class="act-btn act-warning"
            @click.stop="submitEntity"
          >Soumettre</button>
          <button
            v-if="entity.status === 'pending_approval'"
            class="act-btn act-success"
            @click.stop="approveEntity"
          >Approuver</button>
          <router-link
            v-if="entity.status === 'approved'"
            :to="{ name: 'hr-entity-edit', params: { id: entity.id } }"
            class="act-btn act-muted"
          >Modifier</router-link>
        </div>
      </div>
    </div>

    <!-- ── Enfants (récursif) ── -->
    <div v-if="hasChildren && !isCollapsed" class="org-children">
      <div
        v-for="child in entity.children"
        :key="child.id"
        class="org-child"
      >
        <OrgNode :entity="child" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useEntityStore } from '../../stores/entities'
import type { Entity } from '../../types'
import type { Ref } from 'vue'

defineOptions({ name: 'OrgNode' })

const props = defineProps<{ entity: Entity }>()

const router         = useRouter()
const store          = useEntityStore()
const collapsedIds   = inject<Ref<string[]>>('entity-collapsed')!
const toggleCollapse = inject<(id: string) => void>('entity-toggle')!
const navigateToDetail = inject<(id: string) => void>(
  'navigate-to-detail',
  (id: string) => router.push({ name: 'hr-entity-detail', params: { id } })
)

const hasChildren = computed(() => (props.entity.children?.length ?? 0) > 0)
const isCollapsed = computed(() => collapsedIds.value.includes(props.entity.id))

function toggle() { toggleCollapse(props.entity.id) }

// ── Type helpers ─────────────────────────────────────────────
const typeIcon = computed(() => {
  const map: Record<string, string> = {
    direction:  'ti ti-building-skyscraper',
    department: 'ti ti-layout-grid',
    service:    'ti ti-tool',
  }
  return map[props.entity.type] ?? 'ti ti-building'
})

// ── Status helpers ────────────────────────────────────────────
const statusText = computed(() => {
  const map: Record<string, string> = {
    draft:            'Brouillon',
    pending_approval: 'En attente',
    approved:         'Approuvé',
    inactive:         'Inactif',
  }
  return map[props.entity.status] ?? props.entity.status
})
const statusClass = computed(() => ({
  'pill-approved':  props.entity.status === 'approved',
  'pill-pending':   props.entity.status === 'pending_approval',
  'pill-draft':     props.entity.status === 'draft',
  'pill-inactive':  props.entity.status === 'inactive',
}))

// ── Actions ───────────────────────────────────────────────────
function submitEntity()  { store.submitEntity(props.entity.id) }
function approveEntity() { store.approveEntity(props.entity.id) }
</script>

<style scoped>
/* ── Node item wrapper ── */
.org-item {
  display: flex;
  flex-direction: column;
  min-width: max-content;
}

/* ── Card ── */
.org-card {
  border: 0.5px solid var(--p247-border);
  border-radius: 8px;
  background: var(--p247-white);
  overflow: hidden;
  transition: box-shadow .15s;
  min-width: 380px;
  max-width: 560px;
}
.org-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.08); }

/* Type accent on left border — use organigramme level variables */
.org-card.type-direction  { border-left: 4px solid var(--galana-direction-bg); }
.org-card.type-department { border-left: 3px solid var(--galana-department-bg); }
.org-card.type-service    { border-left: 2px solid var(--galana-service-border); }

.card-main {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
}

/* Toggle button */
.toggle-btn {
  width: 22px; height: 22px;
  border: none; background: none;
  cursor: pointer; color: var(--p247-muted);
  font-size: 13px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background .1s;
}
.toggle-btn:hover { background: var(--p247-bg); color: var(--p247-text); }
.toggle-spacer { width: 22px; flex-shrink: 0; }

/* Type icon */
.type-icon {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.type-direction  .type-icon { background: var(--galana-red-light);   color: var(--galana-red); }
.type-department .type-icon { background: var(--galana-green-light); color: var(--galana-green); }
.type-service    .type-icon { background: var(--galana-green-light); color: var(--galana-green); }

/* Code badge */
.code-badge {
  font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 4px;
  white-space: nowrap; flex-shrink: 0;
  letter-spacing: .04em;
}
.type-direction  .code-badge { background: var(--galana-red-light);   color: var(--galana-red); }
.type-department .code-badge { background: var(--galana-green-light); color: var(--galana-green); }
.type-service    .code-badge { background: var(--galana-green-light); color: var(--galana-green); }

/* Card body */
.card-body { flex: 1; min-width: 0; }
.card-name {
  font-size: 13px; font-weight: 600;
  color: var(--p247-text); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.card-responsible {
  font-size: 11px; color: var(--p247-muted);
  display: flex; align-items: center; gap: 4px; margin-top: 2px;
}
.card-responsible i { font-size: 11px; }

/* Méta droite */
.card-meta {
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
}
.headcount {
  font-size: 11px; color: var(--p247-muted);
  display: flex; align-items: center; gap: 3px;
}
.headcount i { font-size: 11px; }

/* Status pills */
.status-pill { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
.pill-approved  { background: var(--color-success-bg); color: var(--p247-success); }
.pill-pending   { background: var(--p247-warning-bg); color: var(--p247-warning); }
.pill-draft     { background: transparent; color: #666; border: 0.5px solid #ccc; }
.pill-inactive  { background: var(--p247-bg); color: var(--p247-muted); }

/* Action buttons */
.card-actions {
  display: flex; gap: 4px; flex-shrink: 0;
}
.act-btn {
  padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500;
  cursor: pointer; border: none; white-space: nowrap; text-decoration: none;
  display: inline-flex; align-items: center;
  background: var(--p247-bg); color: var(--p247-muted); transition: all .1s;
}
.act-btn:hover    { background: var(--color-neutral-bg); color: var(--p247-text); }
.act-warning      { background: var(--p247-warning-bg); color: var(--p247-warning); }
.act-warning:hover { background: var(--color-warning-bg); }
.act-success      { background: var(--color-success-bg); color: var(--p247-success); }
.act-success:hover { background: var(--color-success-bg); }
.act-muted        { background: var(--p247-bg); color: var(--p247-muted); }

/* ── Arbre CSS ── */
.org-children {
  margin-left: 32px;
  padding-left: 22px;
  border-left: 2px solid var(--galana-green-mid);
  margin-top: 6px;
  padding-bottom: 2px;
}
.org-child {
  position: relative;
  margin-top: 8px;
}
/* Connecteur horizontal */
.org-child::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 22px;
  width: 22px;
  height: 2px;
  background: var(--galana-green-mid);
}
/* Effacer la ligne verticale sous le dernier enfant */
.org-child:last-child::after {
  content: '';
  position: absolute;
  left: -24px;
  top: 23px;
  bottom: -10px;
  width: 4px;
  background: var(--p247-white);
}
</style>
