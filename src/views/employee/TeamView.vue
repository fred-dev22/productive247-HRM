<template>
  <div :class="L.shell">
    <AppTopNav :user="auth.user" />
    <div :class="L.mainLayout">
      <AppSidebar />
      <main :class="L.content">

        <!-- ── En-tête ── -->
        <div class="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 class="text-xl font-bold text-foreground">Mon équipe</h1>
            <p class="text-[13px] text-muted-foreground mt-0.5">{{ entityName }}</p>
          </div>
          <span class="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3.5 py-[5px] rounded-full">
            <Users class="w-3.5 h-3.5" />
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
            <div class="flex items-center gap-2">
              <UserAvatar :name="row.name" size="sm" />
              <div class="flex flex-col gap-px">
                <span class="text-[13px] font-medium text-foreground">{{ row.name }}</span>
                <span class="text-[11px] text-muted-foreground">{{ row.email }}</span>
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
import { Users } from 'lucide-vue-next'
import AppTopNav  from '../../components/AppTopNav.vue'
import AppSidebar from '../../components/AppSidebar.vue'
import DataTable  from '../../components/ui/DataTable.vue'
import UserAvatar from '../../components/ui/UserAvatar.vue'
import StatusPill from '../../components/ui/StatusPill.vue'
import * as L from '../../lib/listClasses'
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
