<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- ── En-tête ── -->
        <div class="page-header">
          <div>
            <div class="page-title">Entités organisationnelles</div>
            <div class="page-sub">Structure hiérarchique de Galana Petroleum Ltd</div>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" @click="showEntityModal = true">
              <i class="ti ti-plus"></i> Nouvelle entité
            </button>
          </div>
        </div>

        <!-- ── KPIs ── -->
        <div class="kpi-strip">
          <div class="kpi-item">
            <div class="kpi-icon" style="background:var(--color-success-bg)">
              <i class="ti ti-building" style="color:var(--color-success)"></i>
            </div>
            <div>
              <div class="kpi-val">{{ store.entities.length }}</div>
              <div class="kpi-lbl">Total entités</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-icon" style="background:var(--color-success-bg)">
              <i class="ti ti-users" style="color:var(--color-success)"></i>
            </div>
            <div>
              <div class="kpi-val">{{ store.totalHeadcount }}</div>
              <div class="kpi-lbl">Effectif total</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-icon" style="background:var(--color-primary-light)">
              <i class="ti ti-check" style="color:var(--color-primary)"></i>
            </div>
            <div>
              <div class="kpi-val">{{ store.approvedEntities.length }}</div>
              <div class="kpi-lbl">Approuvées</div>
            </div>
          </div>
          <div class="kpi-item">
            <div class="kpi-icon"
              :style="store.pendingEntities.length > 0
                ? 'background:var(--color-warning-bg)'
                : 'background:var(--color-bg)'">
              <i class="ti ti-clock"
                :style="store.pendingEntities.length > 0
                  ? 'color:var(--color-warning)'
                  : 'color:var(--color-text-muted)'"></i>
            </div>
            <div>
              <div class="kpi-val" style="display:flex;align-items:center;gap:6px">
                {{ store.pendingEntities.length }}
                <span v-if="store.pendingEntities.length > 0" class="pending-badge">!</span>
              </div>
              <div class="kpi-lbl">En attente</div>
            </div>
          </div>
        </div>

        <!-- ── Onglets (source unique : EntityTabsContent) ── -->
        <EntityTabsContent />

      </main>
    </div>
  </div>

  <!-- ── Modal création entité ── -->
  <EntityFormModal v-model="showEntityModal" @saved="showEntityModal = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AppSidebar, AppTopNav } from '../../components'
import { useAuthStore }   from '../../stores/auth'
import { useEntityStore } from '../../stores/entities'
import EntityTabsContent from '../../components/entities/EntityTabsContent.vue'
import EntityFormModal   from '../../components/entities/EntityFormModal.vue'

const auth  = useAuthStore()
const store = useEntityStore()

const showEntityModal = ref(false)
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--color-bg); }

.page-header    { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.page-title     { font-size: 18px; font-weight: 600; }
.page-sub       { font-size: 13px; color: var(--color-text-muted); margin-top: 1px; }
.header-actions { display: flex; gap: 8px; }

.btn         { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all .12s; }
.btn-primary { background: var(--color-primary); color: var(--color-surface); }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }

.kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.kpi-item  { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.kpi-icon  { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.kpi-val   { font-size: 22px; font-weight: 700; line-height: 1; }
.kpi-lbl   { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
.pending-badge { background: var(--color-danger); color: var(--color-surface); font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 10px; }

@media (max-width: 900px) { .kpi-strip { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .kpi-strip { grid-template-columns: 1fr; } .content { padding: 16px; } }
</style>
