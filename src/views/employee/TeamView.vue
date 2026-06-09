<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <!-- ── En-tête ── -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Mon équipe</h1>
            <p class="page-sub">{{ entityName }}</p>
          </div>
          <span class="count-badge">
            <i class="ti ti-users" aria-hidden="true"></i>
            {{ teamMembers.length }} membre{{ teamMembers.length > 1 ? 's' : '' }}
          </span>
        </div>

        <!-- ── DataTable ── -->
        <DataTable
          :columns="columns"
          :rows="teamMembers"
          empty-message="Aucun membre d'équipe trouvé"
          row-key="id"
        >
          <template #cell-name="{ row }">
            <div class="emp-cell">
              <UserAvatar
                :name="row.name"
                size="sm"
              />
              <div class="emp-info">
                <span class="emp-name">{{ row.name }}</span>
                <span class="emp-email">{{ row.email }}</span>
              </div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <StatusPill :status="row.status" />
          </template>
        </DataTable>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import DataTable  from '../../components/ui/DataTable.vue'
import UserAvatar from '../../components/ui/UserAvatar.vue'
import StatusPill from '../../components/ui/StatusPill.vue'
import { useAuthStore }     from '../../stores/auth'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore }   from '../../stores/entities'

const auth          = useAuthStore()
const employeeStore = useEmployeeStore()
const entityStore   = useEntityStore()

const columns = [
  { key: 'name',         label: 'Employé',         sortable: true  },
  { key: 'jobTitle',     label: 'Poste',            sortable: true  },
  { key: 'entityName',   label: 'Entité',           sortable: true  },
  { key: 'contractType', label: 'Contrat',          sortable: false },
  { key: 'status',       label: 'Statut',           sortable: false },
]

const myEntityId = computed(() => auth.user?.entityId ?? '')

const entityName = computed(() => {
  if (!myEntityId.value) return ''
  return entityStore.getEntityById(myEntityId.value)?.name ?? ''
})

const teamMembers = computed(() => {
  if (!myEntityId.value) return []
  return employeeStore.employees.filter(
    e => e.entityId === myEntityId.value && e.id !== auth.user?.id
  )
})
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.page-title  { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub    { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.count-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--color-primary-light); color: var(--color-primary); font-size: 12px; font-weight: 600; padding: 5px 14px; border-radius: 20px; }

.emp-cell  { display: flex; align-items: center; gap: 8px; }
.emp-info  { display: flex; flex-direction: column; gap: 1px; }
.emp-name  { font-size: 13px; font-weight: 500; color: var(--color-text); }
.emp-email { font-size: 11px; color: var(--color-text-muted); }

@media (max-width: 768px) { .content { padding: 16px; } }
</style>
