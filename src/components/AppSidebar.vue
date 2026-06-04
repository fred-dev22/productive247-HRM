<template>
  <aside class="sidebar">
    <!-- Vue RH -->
    <template v-if="role === 'rh'">
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t('sidebar.dashboard') }}</div>
        <router-link :to="{ name: 'rh' }" class="sidebar-item" active-class="active">
          <i class="ti ti-layout-dashboard" aria-hidden="true"></i> {{ t('sidebar.overview') }}
        </router-link>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t('sidebar.leaves_absences') }}</div>
        <router-link :to="{ name: 'rh-leaves' }" class="sidebar-item" active-class="active">
          <i class="ti ti-calendar-event" aria-hidden="true"></i>
          {{ t('sidebar.requests') }} <span class="badge">3</span>
        </router-link>
        <div class="sidebar-item">
          <i class="ti ti-calendar-off" aria-hidden="true"></i> {{ t('sidebar.absences') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-clock-hour-3" aria-hidden="true"></i> {{ t('sidebar.recovery') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-home-2" aria-hidden="true"></i> {{ t('sidebar.remote') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-chart-pie" aria-hidden="true"></i> {{ t('sidebar.balances') }}
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t('sidebar.administration') }}</div>
        <div class="sidebar-item">
          <i class="ti ti-users" aria-hidden="true"></i> {{ t('sidebar.employees') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-building" aria-hidden="true"></i> {{ t('sidebar.entities') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-plane" aria-hidden="true"></i> {{ t('sidebar.missions') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-receipt" aria-hidden="true"></i> {{ t('sidebar.expenses') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-file-text" aria-hidden="true"></i> {{ t('sidebar.contracts') }}
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t('sidebar.reports') }}</div>
        <div class="sidebar-item">
          <i class="ti ti-chart-bar" aria-hidden="true"></i> {{ t('sidebar.statistics') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-sitemap" aria-hidden="true"></i> {{ t('sidebar.org_chart') }}
        </div>
      </div>
    </template>

    <!-- Vue Employé -->
    <template v-else>
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t('sidebar.my_space') }}</div>
        <router-link :to="{ name: 'employe' }" class="sidebar-item" active-class="active">
          <i class="ti ti-layout-dashboard" aria-hidden="true"></i> {{ t('sidebar.dashboard') }}
        </router-link>
        <div class="sidebar-item">
          <i class="ti ti-user" aria-hidden="true"></i> {{ t('sidebar.my_profile') }}
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t('sidebar.my_requests') }}</div>
        <router-link :to="{ name: 'employee-leave-request' }" class="sidebar-item" active-class="active">
          <i class="ti ti-calendar-event" aria-hidden="true"></i>
          {{ t('sidebar.leaves') }} <span class="badge">1</span>
        </router-link>
        <div class="sidebar-item">
          <i class="ti ti-clock-hour-3" aria-hidden="true"></i> {{ t('sidebar.recovery') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-home-2" aria-hidden="true"></i> {{ t('sidebar.remote') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-plane" aria-hidden="true"></i> {{ t('sidebar.missions') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-receipt" aria-hidden="true"></i> {{ t('sidebar.expenses') }}
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t('sidebar.history') }}</div>
        <div class="sidebar-item">
          <i class="ti ti-history" aria-hidden="true"></i> {{ t('sidebar.my_requests') }}
        </div>
        <div class="sidebar-item">
          <i class="ti ti-calendar" aria-hidden="true"></i> {{ t('sidebar.my_planning') }}
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UserRole } from '../types'

defineProps<{ role: UserRole }>()

const { t } = useI18n()
</script>

<style scoped>
.sidebar {
  width: 215px; flex-shrink: 0;
  background: var(--p247-white);
  border-right: 0.5px solid var(--p247-border);
  padding: 12px 0;
  overflow-y: auto;
}
.sidebar-section { margin-bottom: 6px; }
.sidebar-label {
  font-size: 11px; font-weight: 600;
  color: var(--p247-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 8px 16px 4px;
}
.sidebar-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 16px;
  color: var(--p247-muted);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.12s;
  text-decoration: none;
}
.sidebar-item i { font-size: 17px; flex-shrink: 0; }
.sidebar-item:hover { background: var(--p247-orange-light); color: var(--p247-orange); }
.sidebar-item.active {
  background: var(--p247-orange-light);
  color: var(--p247-orange);
  font-weight: 500;
  border-right: 2px solid var(--p247-orange);
}
.badge {
  margin-left: auto;
  background: var(--p247-orange);
  color: white;
  font-size: 9px; font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
}
</style>
