<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- Entité introuvable -->
        <div v-if="!entity" class="not-found">
          <i class="ti ti-alert-triangle"></i>
          <p>Entité introuvable.</p>
          <router-link :to="{ name: 'entities' }" class="btn btn-primary">Retour à la liste</router-link>
        </div>

        <template v-else>
          <!-- ── Breadcrumb + actions ── -->
          <div class="page-header">
            <div>
              <div class="breadcrumb">
                <router-link :to="{ name: 'entities' }" class="bc-link">Entités</router-link>
                <i class="ti ti-chevron-right bc-sep"></i>
                <span class="bc-current">{{ entity.name }}</span>
              </div>
              <div class="title-row">
                <h1 class="page-title">{{ entity.name }}</h1>
                <span class="code-chip">{{ entity.code }}</span>
                <span class="status-pill" :class="statusClass">{{ statusLabel }}</span>
              </div>
            </div>
            <div class="header-actions">
              <!-- Retour contextuel -->
              <button class="btn btn-outline" @click="router.push(navStore.previousEntityRoute)">
                <i class="ti ti-arrow-left"></i> Retour
              </button>

              <!-- draft -->
              <template v-if="entity.status === 'draft'">
                <router-link :to="{ name: 'entity-edit', params: { id: entity.id } }" class="btn btn-outline">
                  <i class="ti ti-pencil"></i> Modifier
                </router-link>
                <button class="btn btn-primary" @click="store.submitEntity(entity.id)">
                  <i class="ti ti-send"></i> Soumettre pour approbation
                </button>
              </template>
              <!-- pending -->
              <template v-else-if="entity.status === 'pending_approval'">
                <button class="btn btn-success" @click="store.approveEntity(entity.id)">
                  <i class="ti ti-check"></i> Approuver
                </button>
                <button class="btn btn-danger" @click="store.rejectEntity(entity.id)">
                  <i class="ti ti-x"></i> Rejeter
                </button>
              </template>
              <!-- approved -->
              <template v-else-if="entity.status === 'approved'">
                <router-link :to="{ name: 'entity-edit', params: { id: entity.id } }" class="btn btn-outline">
                  <i class="ti ti-pencil"></i> Modifier
                </router-link>
                <button class="btn btn-danger-outline" @click="store.deactivateEntity(entity.id)">
                  <i class="ti ti-ban"></i> Désactiver
                </button>
              </template>
            </div>
          </div>

          <!-- ── Corps deux colonnes ── -->
          <div class="detail-grid">

            <!-- Colonne gauche -->
            <div class="col-left">

              <!-- Card Informations -->
              <div class="card">
                <div class="card-title"><i class="ti ti-info-circle"></i> Informations</div>
                <div class="info-rows">
                  <div class="info-row"><span class="info-lbl">Code</span><span class="code-chip">{{ entity.code }}</span></div>
                  <div class="info-row"><span class="info-lbl">Type</span><span class="type-badge" :class="`type-${entity.type}`">{{ typeLabel }}</span></div>
                  <div class="info-row" v-if="entity.legalIdentifier"><span class="info-lbl">Identifiant légal</span><span>{{ entity.legalIdentifier }}</span></div>
                  <div class="info-row" v-if="entity.address"><span class="info-lbl">Adresse</span><span>{{ entity.address }}</span></div>
                  <div class="info-row" v-if="entity.phone"><span class="info-lbl">Téléphone</span><span>{{ entity.phone }}</span></div>
                  <div class="info-row" v-if="entity.email">
                    <span class="info-lbl">Email</span>
                    <a :href="`mailto:${entity.email}`" class="link">{{ entity.email }}</a>
                  </div>
                  <div class="info-row" v-if="entity.responsibleName">
                    <span class="info-lbl">Responsable</span>
                    <div class="responsible-cell">
                      <div class="avatar-sm" :style="{ background: 'var(--p247-orange-light)', color: 'var(--p247-orange)' }">
                        {{ respInitials }}
                      </div>
                      <span>{{ entity.responsibleName }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <span class="info-lbl">Effectif rattaché</span>
                    <span class="headcount-val"><i class="ti ti-users"></i> {{ entity.headcount }} employé{{ entity.headcount > 1 ? 's' : '' }}</span>
                  </div>
                </div>
              </div>

              <!-- Card Entité parente -->
              <div class="card">
                <div class="card-title"><i class="ti ti-arrow-up"></i> Entité parente</div>
                <div v-if="parentEntity">
                  <router-link :to="{ name: 'entity-detail', params: { id: parentEntity.id } }" class="entity-link">
                    <span class="code-chip">{{ parentEntity.code }}</span>
                    <span>{{ parentEntity.name }}</span>
                    <i class="ti ti-arrow-right"></i>
                  </router-link>
                </div>
                <div v-else class="empty-info">Aucune — entité racine</div>
              </div>

              <!-- Card Sous-entités -->
              <div class="card">
                <div class="card-title"><i class="ti ti-arrow-down"></i> Sous-entités ({{ children.length }})</div>
                <div v-if="children.length > 0" class="children-list">
                  <router-link
                    v-for="child in children" :key="child.id"
                    :to="{ name: 'entity-detail', params: { id: child.id } }"
                    class="entity-link"
                  >
                    <span class="type-badge" :class="`type-${child.type}`">{{ typeLabelOf(child.type) }}</span>
                    <span class="code-chip">{{ child.code }}</span>
                    <span>{{ child.name }}</span>
                    <i class="ti ti-arrow-right"></i>
                  </router-link>
                </div>
                <div v-else class="empty-info">Aucune sous-entité</div>
              </div>

            </div>

            <!-- Colonne droite -->
            <div class="col-right">

              <!-- Card Pools de validation -->
              <div class="card">
                <div class="card-title"><i class="ti ti-shield-check"></i> Pools de validation</div>
                <div v-if="entity.validatorPools.length > 0" class="pools-list">
                  <div v-for="pool in sortedPools" :key="pool.level" class="pool-item">
                    <div class="pool-avatar" :style="{ background: pool.validatorColor }">
                      {{ pool.validatorInitials }}
                    </div>
                    <div class="pool-info">
                      <div class="pool-name">{{ pool.validatorName }}</div>
                      <div class="pool-level">Validateur N+{{ pool.level }}</div>
                    </div>
                    <span class="level-badge">N+{{ pool.level }}</span>
                  </div>
                </div>
                <div v-else class="empty-info">
                  <i class="ti ti-alert-circle"></i>
                  Aucun validateur configuré — les demandes ne pourront pas être traitées
                </div>
              </div>

              <!-- Card Employés rattachés -->
              <div class="card">
                <div class="card-title"><i class="ti ti-users"></i> Employés rattachés</div>
                <div class="emp-count">{{ entity.headcount }} employé{{ entity.headcount > 1 ? 's' : '' }}</div>
                <div class="mock-employees">
                  <div v-for="emp in mockEmployees" :key="emp.name" class="emp-row">
                    <div class="emp-avatar" :style="{ background: emp.color }">{{ emp.initials }}</div>
                    <div class="emp-name">{{ emp.name }}</div>
                  </div>
                </div>
                <div v-if="entity.headcount > 3" class="see-all-link">
                  Voir tous les {{ entity.headcount }} employés →
                </div>
              </div>

              <!-- Card Historique -->
              <div class="card">
                <div class="card-title"><i class="ti ti-history"></i> Historique</div>
                <div class="history-list">
                  <div class="history-item">
                    <div class="hist-icon"><i class="ti ti-circle-plus"></i></div>
                    <div>
                      <div class="hist-label">Créée le</div>
                      <div class="hist-val">{{ entity.createdAt }}</div>
                    </div>
                  </div>
                  <div v-if="entity.submittedAt" class="history-item">
                    <div class="hist-icon pending"><i class="ti ti-send"></i></div>
                    <div>
                      <div class="hist-label">Soumise le</div>
                      <div class="hist-val">{{ entity.submittedAt }}</div>
                    </div>
                  </div>
                  <div v-if="entity.approvedAt" class="history-item">
                    <div class="hist-icon approved"><i class="ti ti-check"></i></div>
                    <div>
                      <div class="hist-label">Approuvée le</div>
                      <div class="hist-val">{{ entity.approvedAt }}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </template>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppSidebar, AppTopNav } from '../../components'
import { useAuthStore }       from '../../stores/auth'
import { useEntityStore }     from '../../stores/entities'
import { useNavigationStore } from '../../stores/navigation'
import type { EntityType } from '../../types'

const auth     = useAuthStore()
const store    = useEntityStore()
const navStore = useNavigationStore()
const route    = useRoute()
const router   = useRouter()

const entityId = computed(() => route.params.id as string)
const entity   = computed(() => store.getEntityById(entityId.value))
const parent   = computed(() => entity.value?.parentId)
const parentEntity = computed(() => parent.value ? store.getEntityById(parent.value) : undefined)
const children     = computed(() => store.getChildren(entityId.value))
const sortedPools  = computed(() => [...(entity.value?.validatorPools ?? [])].sort((a, b) => a.level - b.level))

// ── Helpers affichage ─────────────────────────────────────────
const typeLabel = computed(() => {
  const map: Record<string, string> = { direction: 'Direction', department: 'Département', service: 'Service' }
  return map[entity.value?.type ?? ''] ?? entity.value?.type ?? ''
})
function typeLabelOf(t: EntityType): string {
  const map: Record<string, string> = { direction: 'Direction', department: 'Département', service: 'Service' }
  return map[t] ?? t
}

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    draft: 'Brouillon', pending_approval: 'En attente', approved: 'Approuvé', inactive: 'Inactif',
  }
  return map[entity.value?.status ?? ''] ?? ''
})
const statusClass = computed(() => ({
  'pill-approved':  entity.value?.status === 'approved',
  'pill-pending':   entity.value?.status === 'pending_approval',
  'pill-draft':     entity.value?.status === 'draft',
  'pill-inactive':  entity.value?.status === 'inactive',
}))

const respInitials = computed(() => {
  const name = entity.value?.responsibleName ?? ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
  return (parts[0] ?? '?').slice(0, 2).toUpperCase()
})

// Mock employés (3 premiers)
const MOCK_COLORS = ['#B5D4F4', '#C0DD97', '#F4C0D1', '#FAC775', '#AFA9EC']
const mockEmployees = computed(() => {
  const count = Math.min(3, entity.value?.headcount ?? 0)
  const names = ['Aminata D.', 'Kofi M.', 'Fatou S.', 'Jean-Pierre M.', 'Rose N.']
  return Array.from({ length: count }, (_, i) => ({
    name:     names[i] ?? `Employé ${i + 1}`,
    initials: names[i]?.split(' ').map(p => p[0]).join('') ?? 'E',
    color:    MOCK_COLORS[i % MOCK_COLORS.length],
  }))
})
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--p247-bg); }

/* ── Header ── */
.page-header  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 12px; }
.breadcrumb   { display: flex; align-items: center; gap: 4px; font-size: 12px; margin-bottom: 6px; }
.bc-link      { color: var(--p247-orange); text-decoration: none; }
.bc-link:hover { text-decoration: underline; }
.bc-sep       { font-size: 11px; color: var(--p247-muted); }
.bc-current   { color: var(--p247-muted); }
.title-row    { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.page-title   { font-size: 18px; font-weight: 700; margin: 0; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

/* ── Buttons ── */
.btn      { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-primary      { background: var(--p247-orange); color: white; }
.btn-primary:hover { background: var(--p247-orange-dark); }
.btn-outline      { background: var(--p247-white); color: var(--p247-text); border: 0.5px solid var(--p247-border); }
.btn-outline:hover { background: var(--p247-bg); }
.btn-success      { background: var(--color-success-bg); color: var(--p247-success); border: 0.5px solid var(--p247-success); }
.btn-danger       { background: var(--p247-danger-bg); color: var(--p247-danger); border: 0.5px solid var(--p247-danger); }
.btn-danger-outline { background: transparent; color: var(--p247-danger); border: 0.5px solid var(--p247-danger); }

/* ── Cards ── */
.card {
  background: var(--p247-white); border: 0.5px solid var(--p247-border);
  border-radius: 8px; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.card-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  padding-bottom: 10px; border-bottom: 0.5px solid var(--p247-border);
  color: var(--p247-text);
}
.card-title i { color: var(--p247-orange); font-size: 15px; }

/* ── Layout deux colonnes ── */
.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 14px; align-items: start;
}
.col-left, .col-right { display: flex; flex-direction: column; gap: 14px; }

/* ── Info rows ── */
.info-rows { display: flex; flex-direction: column; gap: 8px; }
.info-row  { display: flex; align-items: center; justify-content: space-between; font-size: 13px; gap: 8px; }
.info-lbl  { font-size: 12px; color: var(--p247-muted); flex-shrink: 0; }
.responsible-cell { display: flex; align-items: center; gap: 6px; }
.avatar-sm {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 700; background: var(--p247-orange-light); color: var(--p247-orange);
}
.headcount-val { display: flex; align-items: center; gap: 4px; font-weight: 500; color: var(--p247-text); }

/* ── Badges ── */
.code-chip { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: var(--p247-orange-light); color: var(--p247-orange); letter-spacing: .04em; }
.status-pill { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.pill-approved { background: var(--color-success-bg); color: var(--p247-success); }
.pill-pending  { background: var(--p247-warning-bg); color: var(--p247-warning); }
.pill-draft    { background: transparent; color: #666; border: 0.5px solid #ccc; }
.pill-inactive { background: var(--p247-bg); color: var(--p247-muted); }
.type-badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 12px; }
.type-direction  { background: var(--color-success-bg); color: var(--p247-success); }
.type-department { background: var(--color-success-bg); color: var(--p247-success); }
.type-service    { background: var(--color-accent-light); color: var(--color-accent); }

/* ── Entity links ── */
.entity-link {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border-radius: 6px; background: var(--p247-bg); text-decoration: none;
  color: var(--p247-text); font-size: 13px; transition: background .1s;
}
.entity-link:hover { background: var(--p247-orange-light); }
.entity-link i { margin-left: auto; color: var(--p247-muted); font-size: 12px; }
.children-list { display: flex; flex-direction: column; gap: 6px; }

/* ── Pools ── */
.pools-list { display: flex; flex-direction: column; gap: 10px; }
.pool-item  { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--p247-bg); border-radius: 6px; }
.pool-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
}
.pool-info  { flex: 1; }
.pool-name  { font-size: 13px; font-weight: 500; }
.pool-level { font-size: 11px; color: var(--p247-muted); }
.level-badge {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px;
  background: var(--p247-orange-light); color: var(--p247-orange);
  border: 1px solid rgba(200, 16, 46, 0.2); flex-shrink: 0;
}

/* ── Employés mock ── */
.emp-count { font-size: 13px; font-weight: 500; }
.mock-employees { display: flex; flex-direction: column; gap: 6px; }
.emp-row  { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
.emp-avatar { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
.emp-name { font-size: 13px; }
.see-all-link { font-size: 12px; color: var(--p247-info); cursor: pointer; margin-top: 4px; }

/* ── Historique ── */
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-item { display: flex; align-items: flex-start; gap: 10px; }
.hist-icon {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--p247-bg); color: var(--p247-muted);
  display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;
}
.hist-icon.pending  { background: var(--p247-warning-bg); color: var(--p247-warning); }
.hist-icon.approved { background: var(--color-success-bg); color: var(--p247-success); }
.hist-label { font-size: 11px; color: var(--p247-muted); }
.hist-val   { font-size: 13px; font-weight: 500; }

/* ── Misc ── */
.empty-info { font-size: 12px; color: var(--p247-muted); display: flex; align-items: center; gap: 6px; }
.link { color: var(--p247-info); text-decoration: none; }
.link:hover { text-decoration: underline; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 0; color: var(--p247-muted); }
.not-found i { font-size: 48px; }

@media (max-width: 900px) {
  .detail-grid { grid-template-columns: 1fr; }
  .content { padding: 16px; }
}
</style>
