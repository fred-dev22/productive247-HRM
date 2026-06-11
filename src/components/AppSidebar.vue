<template>
  <aside class="sidebar">

    <!-- ══════════ CÔTÉ RH ══════════ -->
    <template v-if="auth.isHRSide">

      <!-- MODULE : Administration -->
      <template v-if="navStore.activeModule === 'administration'">
        <SidebarSection :label="t('sidebar.dashboard')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.overview')"    :to="{ name: 'hr-dashboard' }" />
          <SidebarItem icon="ti ti-calendar-week"    :label="t('sidebar.my_planning')" :to="{ name: 'hr-planning' }" />
        </SidebarSection>

        <SidebarSection :label="t('sidebar.absence_requests')">
          <SidebarItem icon="ti ti-calendar-off" :label="t('sidebar.requests')" :to="{ name: 'hr-absences' }"     :badge="pendingCount" />
          <SidebarItem icon="ti ti-chart-pie"    :label="t('sidebar.balances')" :to="{ name: 'hr-leave-balances' }" />
        </SidebarSection>

        <SidebarSection :label="t('sidebar.management')">
          <SidebarItem icon="ti ti-users"   :label="t('sidebar.employees')"  :to="{ name: 'hr-employees' }" />
          <SidebarItem icon="ti ti-building" :label="t('sidebar.entities')"   :to="{ name: 'hr-entities' }" />
          <SidebarItem icon="ti ti-plane"    :label="t('sidebar.missions')"   :to="{ name: 'hr-missions' }" />
          <SidebarItem icon="ti ti-receipt"  :label="t('sidebar.expenses')"   :to="{ name: 'hr-expenses' }" />
          <SidebarItem icon="ti ti-sitemap"  :label="t('sidebar.org_chart')"  :to="{ name: 'hr-org-chart' }" />
        </SidebarSection>

        <SidebarSection :label="t('sidebar.configuration')">
          <SidebarItem icon="ti ti-calendar-event" :label="t('sidebar.config_calendar')" :to="{ name: 'hr-config-calendar' }" />
          <SidebarItem icon="ti ti-coin"           :label="t('sidebar.fees_perdiems')"   :to="{ name: 'hr-config-mission-fees' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Recrutement -->
      <template v-else-if="navStore.activeModule === 'recruitment'">
        <SidebarSection :label="t('nav.recruitment')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.dashboard')"   :to="{ name: 'hr-recruitment' }" />
          <SidebarItem icon="ti ti-briefcase"        :label="t('sidebar.job_offers')"  :to="{ name: 'hr-recruitment-positions' }" />
          <SidebarItem icon="ti ti-users"            :label="t('sidebar.applications')" :to="{ name: 'hr-recruitment-applications' }" />
          <SidebarItem icon="ti ti-calendar"         :label="t('sidebar.interviews')"  :to="{ name: 'hr-recruitment-interviews' }" />
          <SidebarItem icon="ti ti-git-merge"        :label="t('sidebar.pipeline')"    :to="{ name: 'hr-recruitment-pipeline' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.candidates')">
          <SidebarItem icon="ti ti-address-book" :label="t('sidebar.cvtheque')"           :to="{ name: 'hr-recruitment-cv-library' }" />
          <SidebarItem icon="ti ti-inbox"        :label="t('sidebar.spontaneous_apps')"   :to="{ name: 'hr-recruitment-spontaneous' }" />
          <SidebarItem icon="ti ti-school"       :label="t('sidebar.internship_requests')" :to="{ name: 'hr-recruitment-internships' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.hr_admin_section')">
          <SidebarItem icon="ti ti-file-plus"  :label="t('sidebar.needs')"                 :to="{ name: 'hr-recruitment-needs' }" />
          <SidebarItem icon="ti ti-file-text"  :label="t('sidebar.contracts_to_generate')" :to="{ name: 'hr-recruitment-contracts' }" />
          <SidebarItem icon="ti ti-clock"      :label="t('sidebar.trial_periods')"          :to="{ name: 'hr-recruitment-trial' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Formation -->
      <template v-else-if="navStore.activeModule === 'training'">
        <SidebarSection :label="t('nav.training')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.dashboard')"   :to="{ name: 'hr-training' }" />
          <SidebarItem icon="ti ti-books"            :label="t('sidebar.catalog')"     :to="{ name: 'hr-training-catalog' }" />
          <SidebarItem icon="ti ti-calendar-event"   :label="t('sidebar.sessions')"    :to="{ name: 'hr-training-sessions' }" />
          <SidebarItem icon="ti ti-user-plus"        :label="t('sidebar.enrollments')" :to="{ name: 'hr-training-enrollments' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.evaluation')">
          <SidebarItem icon="ti ti-flame"     :label="t('sidebar.hot_evals')"         :to="{ name: 'hr-training-hot-evals' }" />
          <SidebarItem icon="ti ti-snowflake" :label="t('sidebar.cold_evals')"        :to="{ name: 'hr-training-cold-evals' }" />
          <SidebarItem icon="ti ti-star"      :label="t('sidebar.participants_notes')" :to="{ name: 'hr-training-grades' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.budget_section')">
          <SidebarItem icon="ti ti-coin"          :label="t('sidebar.budget_tracking')" :to="{ name: 'hr-training-budget' }" />
          <SidebarItem icon="ti ti-building-bank" :label="t('sidebar.providers')"       :to="{ name: 'hr-training-providers' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Paie -->
      <template v-else-if="navStore.activeModule === 'payroll'">
        <SidebarSection :label="t('nav.payroll')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.dashboard')"  :to="{ name: 'hr-payroll' }" />
          <SidebarItem icon="ti ti-calendar"         :label="t('sidebar.pay_periods')" :to="{ name: 'hr-payroll-periods' }" />
          <SidebarItem icon="ti ti-file-invoice"     :label="t('sidebar.payslips')"   :to="{ name: 'hr-payroll-payslips' }" />
          <SidebarItem icon="ti ti-list"             :label="t('sidebar.register')"   :to="{ name: 'hr-payroll-register' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.attendance')">
          <SidebarItem icon="ti ti-clock-hour-3" :label="t('sidebar.daily_tracking')" :to="{ name: 'hr-payroll-attendance' }" />
          <SidebarItem icon="ti ti-upload"        :label="t('sidebar.import_csv')"    :to="{ name: 'hr-payroll-import' }" />
          <SidebarItem icon="ti ti-alarm"         :label="t('sidebar.overtime')"      :to="{ name: 'hr-payroll-overtime' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.regulatory_states')">
          <SidebarItem icon="ti ti-building-bank" label="CNaPS" :to="{ name: 'hr-payroll-cnaps' }" />
          <SidebarItem icon="ti ti-building-bank" label="OSTIE" :to="{ name: 'hr-payroll-ostie' }" />
          <SidebarItem icon="ti ti-building-bank" label="FMFP"  :to="{ name: 'hr-payroll-fmfp' }" />
          <SidebarItem icon="ti ti-building-bank" label="IRSA"  :to="{ name: 'hr-payroll-irsa' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.payroll_settings')">
          <SidebarItem icon="ti ti-table"       :label="t('sidebar.salary_grids')" :to="{ name: 'hr-payroll-salary-grids' }" />
          <SidebarItem icon="ti ti-trending-up" :label="t('sidebar.raises')"       :to="{ name: 'hr-payroll-raises' }" />
          <SidebarItem icon="ti ti-gift"        :label="t('sidebar.thirteenth')"   :to="{ name: 'hr-payroll-thirteenth' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Rapports -->
      <template v-else-if="navStore.activeModule === 'reports'">
        <SidebarSection :label="t('sidebar.reports')">
          <SidebarItem icon="ti ti-chart-bar" :label="t('sidebar.statistics')" :to="{ name: 'hr-statistics' }" />
          <SidebarItem icon="ti ti-sitemap"   :label="t('sidebar.org_chart')"  :to="{ name: 'hr-org-chart' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.hr_reports')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.hr_dashboard')" :to="{ name: 'hr-reports' }" />
          <SidebarItem icon="ti ti-users"            :label="t('sidebar.staff_list')"   :to="{ name: 'hr-reports-headcount' }" />
          <SidebarItem icon="ti ti-arrows-exchange"  :label="t('sidebar.movements')"    :to="{ name: 'hr-reports-movements' }" />
          <SidebarItem icon="ti ti-chart-bar"        :label="t('sidebar.age_pyramid')"  :to="{ name: 'hr-reports-pyramid' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.analyses')">
          <SidebarItem icon="ti ti-percentage"    :label="t('sidebar.absenteeism')" :to="{ name: 'hr-reports-absenteeism' }" />
          <SidebarItem icon="ti ti-trending-down" :label="t('sidebar.turnover')"    :to="{ name: 'hr-reports-turnover' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.exports')">
          <SidebarItem icon="ti ti-file-spreadsheet" :label="t('sidebar.export_excel')" :to="{ name: 'hr-reports-export-excel' }" />
          <SidebarItem icon="ti ti-file-text"        :label="t('sidebar.export_csv')"   :to="{ name: 'hr-reports-export-csv' }" />
          <SidebarItem icon="ti ti-plug"             :label="t('sidebar.navision')"      :to="{ name: 'hr-reports-navision' }" />
        </SidebarSection>
      </template>

    </template>

    <!-- ══════════ CÔTÉ EMPLOYÉ / VALIDATEUR ══════════ -->
    <template v-else>
      <SidebarSection :label="t('sidebar.my_space')">
        <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.dashboard')" :to="{ name: 'employee-dashboard' }" />
        <SidebarItem icon="ti ti-calendar-week"    :label="t('sidebar.my_planning')" :to="{ name: 'employee-planning' }" />
      </SidebarSection>

      <SidebarSection :label="t('sidebar.my_requests')">
        <SidebarItem icon="ti ti-calendar-off" :label="t('sidebar.absence_requests')" :to="{ name: 'employee-absences' }" :badge="myPendingCount" />
        <SidebarItem icon="ti ti-plane"        :label="t('sidebar.my_missions')"      :to="{ name: 'employee-missions' }" />
        <SidebarItem icon="ti ti-receipt"      :label="t('sidebar.expenses')"          :to="{ name: 'employee-expenses' }" />
      </SidebarSection>

      <template v-if="auth.isValidator">
        <SidebarSection :label="t('sidebar.my_team')">
          <SidebarItem
            icon="ti ti-checkbox"
            :label="t('sidebar.to_validate')"
            :to="{ name: 'employee-to-validate' }"
            :badge="pendingCount"
            :badge-orange="true"
          />
          <SidebarItem icon="ti ti-users" :label="t('sidebar.members')" :to="{ name: 'employee-team' }" />
        </SidebarSection>
      </template>
    </template>

  </aside>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import { RouterLink }         from 'vue-router'
import { useI18n }            from 'vue-i18n'
import { useAuthStore }       from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'
import { useAbsenceStore }    from '../stores/absences'

const { t }        = useI18n()
const auth         = useAuthStore()
const navStore     = useNavigationStore()
const absenceStore = useAbsenceStore()

const pendingCount   = computed(() => absenceStore.pendingLeaves.length)
const myPendingCount = computed(() => absenceStore.myPendingLeaves.length)

// ── Sub-components définis inline ────────────────────────────
const SidebarSection = defineComponent({
  props: { label: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'sidebar-section' }, [
      h('div', { class: 'sidebar-label' }, props.label),
      slots.default?.(),
    ])
  },
})

const SidebarItem = defineComponent({
  props: {
    icon:        { type: String,  required: true },
    label:       { type: String,  required: true },
    to:          { type: Object,  required: true },
    badge:       { type: Number,  default: 0 },
    badgeOrange: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const iconEl  = h('i', { class: props.icon, 'aria-hidden': 'true' })
      const labelEl = h('span', props.label)
      const badgeEl = props.badge > 0
        ? h('span', { class: ['badge', props.badgeOrange ? 'badge-orange' : ''] }, String(props.badge))
        : null

      const children = [iconEl, labelEl, badgeEl].filter(Boolean)

      return h(RouterLink, { to: props.to, class: 'sidebar-item', activeClass: 'active' }, () => children)
    }
  },
})
</script>

<style scoped>
.sidebar {
  width: 220px; flex-shrink: 0;
  background: var(--p247-white);
  border-right: 0.5px solid var(--p247-border);
  padding: 10px 5px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-section { margin-bottom: 4px; }
.sidebar-label {
  font-size: 10px; font-weight: 700;
  color: var(--p247-muted); text-transform: uppercase;
  letter-spacing: .07em; padding: 8px 16px 4px 20px;
}

:deep(.sidebar-item) {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 16px 7px 24px; color: var(--p247-muted);
  cursor: pointer; font-size: 13px; transition: all .12s;
  text-decoration: none; user-select: none;
}
:deep(.sidebar-item i)   { font-size: 16px; flex-shrink: 0; }
:deep(.sidebar-item span:first-of-type) { flex: 1; }
:deep(.sidebar-item:hover) { background: var(--p247-orange-light); color: var(--p247-orange); }
:deep(.sidebar-item.active),
:deep(.sidebar-item.router-link-active) {
  background: var(--p247-orange-light); color: var(--p247-orange);
  font-weight: 500; border-right: 2px solid var(--p247-orange);
}

/* Badge */
:deep(.badge) {
  margin-left: auto;
  background: var(--p247-orange); color: white;
  font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 10px;
}
:deep(.badge-orange) { background: var(--p247-orange); }

@media (max-width: 768px) {
  .sidebar { display: none; }
}
</style>
