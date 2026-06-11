<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <!-- ── En-tête ── -->
        <div :class="L.pageHeader">
          <div>
            <div :class="L.pageTitle">Entités organisationnelles</div>
            <div :class="L.pageSub">Structure hiérarchique de Galana Petroleum Ltd</div>
          </div>
          <div class="flex gap-2">
            <button :class="L.btnPrimary" @click="showEntityModal = true">
              <Plus class="w-4 h-4" /> Nouvelle entité
            </button>
          </div>
        </div>

        <!-- ── KPIs ── -->
        <div class="grid grid-cols-4 gap-2.5 mb-4 max-md:grid-cols-2">
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-success-bg"><Building class="w-[18px] h-[18px] text-success" /></div>
            <div>
              <div :class="kpiVal">{{ store.entities.length }}</div>
              <div :class="kpiLbl">Total entités</div>
            </div>
          </div>
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-success-bg"><Users class="w-[18px] h-[18px] text-success" /></div>
            <div>
              <div :class="kpiVal">{{ store.totalHeadcount }}</div>
              <div :class="kpiLbl">Effectif total</div>
            </div>
          </div>
          <div :class="kpiItem">
            <div :class="kpiIcon" class="bg-primary/10"><Check class="w-[18px] h-[18px] text-primary" /></div>
            <div>
              <div :class="kpiVal">{{ store.approvedEntities.length }}</div>
              <div :class="kpiLbl">Approuvées</div>
            </div>
          </div>
          <div :class="kpiItem">
            <div :class="[kpiIcon, store.pendingEntities.length > 0 ? 'bg-warning-bg' : 'bg-background']">
              <Clock class="w-[18px] h-[18px]" :class="store.pendingEntities.length > 0 ? 'text-warning' : 'text-muted-foreground'" />
            </div>
            <div>
              <div :class="kpiVal" class="flex items-center gap-1.5">
                {{ store.pendingEntities.length }}
                <span v-if="store.pendingEntities.length > 0" class="bg-danger text-white text-[9px] font-bold px-[5px] py-px rounded-full">!</span>
              </div>
              <div :class="kpiLbl">En attente</div>
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
import { Plus, Building, Users, Check, Clock } from 'lucide-vue-next'
import { AppSidebar, AppTopNav } from '../../components'
import * as L from '../../lib/listClasses'
import { useAuthStore }   from '../../stores/auth'
import { useEntityStore } from '../../stores/entities'
import EntityTabsContent from '../../components/entities/EntityTabsContent.vue'
import EntityFormModal   from '../../components/entities/EntityFormModal.vue'

const auth  = useAuthStore()
const store = useEntityStore()

const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal = 'text-[22px] font-bold leading-none'
const kpiLbl = 'text-xs text-muted-foreground mt-0.5'

const showEntityModal = ref(false)
</script>
