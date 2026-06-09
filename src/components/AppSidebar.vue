<template>
  <aside class="sidebar">

    <!-- ══════════ CÔTÉ RH ══════════ -->
    <template v-if="auth.isHRSide">

      <!-- MODULE : Administration -->
      <template v-if="navStore.activeModule === 'administration'">
        <SidebarSection :label="t('sidebar.dashboard')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.overview')"  :to="{ name: 'rh' }" />
          <SidebarItem icon="ti ti-user"             :label="t('sidebar.my_profile')" :to="{ name: 'rh-profile' }" />
        </SidebarSection>

        <SidebarSection :label="t('sidebar.absence_requests')">
          <SidebarItem icon="ti ti-calendar-off" :label="t('sidebar.requests')" :to="{ name: 'rh-absences' }" :badge="pendingCount" />
          <SidebarItem icon="ti ti-chart-pie"    :label="t('sidebar.balances')" :to="{ name: 'rh-absence-balances' }" />
        </SidebarSection>

        <SidebarSection :label="t('sidebar.administration')">
          <SidebarItem icon="ti ti-users"          :label="t('sidebar.employees')" :to="{ name: 'rh-employees' }" />
          <SidebarItem icon="ti ti-building"       :label="t('sidebar.entities')"  :to="{ name: 'entities' }" />
          <SidebarItem icon="ti ti-calendar-event" label="Calendrier"              :to="{ name: 'calendar' }" />
          <SidebarItem icon="ti ti-plane"          :label="t('sidebar.missions')"  :to="{ name: 'rh-missions' }" />
          <SidebarItem icon="ti ti-receipt"   :label="t('sidebar.expenses')"  :to="{ name: 'rh-expenses' }" />
          <SidebarItem icon="ti ti-file-text" :label="t('sidebar.contracts')" :to="{ name: 'rh-contracts' }" />
        </SidebarSection>

        <SidebarSection :label="t('sidebar.reports')">
          <SidebarItem icon="ti ti-chart-bar" :label="t('sidebar.statistics')" :to="{ name: 'rh-stats' }" />
          <SidebarItem icon="ti ti-sitemap"   :label="t('sidebar.org_chart')"  :to="{ name: 'rh-organigramme' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Recrutement -->
      <template v-else-if="navStore.activeModule === 'recrutement'">
        <SidebarSection :label="t('nav.recruitment')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.dashboard')"   :to="{ name: 'rh-recrutement' }" />
          <SidebarItem icon="ti ti-briefcase"        :label="t('sidebar.job_offers')"  :to="{ name: 'rh-recrutement-offres' }" />
          <SidebarItem icon="ti ti-users"            :label="t('sidebar.applications')" :to="{ name: 'rh-recrutement-candidatures' }" />
          <SidebarItem icon="ti ti-calendar"         :label="t('sidebar.interviews')"  :to="{ name: 'rh-recrutement-entretiens' }" />
          <SidebarItem icon="ti ti-git-merge"        :label="t('sidebar.pipeline')"    :to="{ name: 'rh-recrutement-pipeline' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.candidates')">
          <SidebarItem icon="ti ti-address-book" :label="t('sidebar.cvtheque')"           :to="{ name: 'rh-recrutement-cvtheque' }" />
          <SidebarItem icon="ti ti-inbox"        :label="t('sidebar.spontaneous_apps')"   :to="{ name: 'rh-recrutement-spontanees' }" />
          <SidebarItem icon="ti ti-school"       :label="t('sidebar.internship_requests')" :to="{ name: 'rh-recrutement-stages' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.hr_admin_section')">
          <SidebarItem icon="ti ti-file-plus"  :label="t('sidebar.needs')"                 :to="{ name: 'rh-recrutement-besoins' }" />
          <SidebarItem icon="ti ti-file-text"  :label="t('sidebar.contracts_to_generate')" :to="{ name: 'rh-recrutement-contrats' }" />
          <SidebarItem icon="ti ti-clock"      :label="t('sidebar.trial_periods')"          :to="{ name: 'rh-recrutement-essai' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Formation -->
      <template v-else-if="navStore.activeModule === 'formation'">
        <SidebarSection :label="t('nav.training')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.dashboard')"   :to="{ name: 'rh-formation' }" />
          <SidebarItem icon="ti ti-books"            :label="t('sidebar.catalog')"     :to="{ name: 'rh-formation-catalogue' }" />
          <SidebarItem icon="ti ti-calendar-event"   :label="t('sidebar.sessions')"    :to="{ name: 'rh-formation-sessions' }" />
          <SidebarItem icon="ti ti-user-plus"        :label="t('sidebar.enrollments')" :to="{ name: 'rh-formation-inscriptions' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.evaluation')">
          <SidebarItem icon="ti ti-flame"     :label="t('sidebar.hot_evals')"         :to="{ name: 'rh-formation-eval-chaud' }" />
          <SidebarItem icon="ti ti-snowflake" :label="t('sidebar.cold_evals')"        :to="{ name: 'rh-formation-eval-froid' }" />
          <SidebarItem icon="ti ti-star"      :label="t('sidebar.participants_notes')" :to="{ name: 'rh-formation-notes' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.budget_section')">
          <SidebarItem icon="ti ti-coin"          :label="t('sidebar.budget_tracking')" :to="{ name: 'rh-formation-budget' }" />
          <SidebarItem icon="ti ti-building-bank" :label="t('sidebar.providers')"       :to="{ name: 'rh-formation-prestataires' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Paie -->
      <template v-else-if="navStore.activeModule === 'paie'">
        <SidebarSection :label="t('nav.payroll')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.dashboard')"  :to="{ name: 'rh-paie' }" />
          <SidebarItem icon="ti ti-calendar"         :label="t('sidebar.pay_periods')" :to="{ name: 'rh-paie-periodes' }" />
          <SidebarItem icon="ti ti-file-invoice"     :label="t('sidebar.payslips')"   :to="{ name: 'rh-paie-bulletins' }" />
          <SidebarItem icon="ti ti-list"             :label="t('sidebar.register')"   :to="{ name: 'rh-paie-registre' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.attendance')">
          <SidebarItem icon="ti ti-clock-hour-3" :label="t('sidebar.daily_tracking')" :to="{ name: 'rh-paie-presences' }" />
          <SidebarItem icon="ti ti-upload"        :label="t('sidebar.import_csv')"    :to="{ name: 'rh-paie-import-csv' }" />
          <SidebarItem icon="ti ti-alarm"         :label="t('sidebar.overtime')"      :to="{ name: 'rh-paie-heures-supp' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.regulatory_states')">
          <SidebarItem icon="ti ti-building-bank" label="CNaPS" :to="{ name: 'rh-paie-cnaps' }" />
          <SidebarItem icon="ti ti-building-bank" label="OSTIE" :to="{ name: 'rh-paie-ostie' }" />
          <SidebarItem icon="ti ti-building-bank" label="FMFP"  :to="{ name: 'rh-paie-fmfp' }" />
          <SidebarItem icon="ti ti-building-bank" label="IRSA"  :to="{ name: 'rh-paie-irsa' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.payroll_settings')">
          <SidebarItem icon="ti ti-table"       :label="t('sidebar.salary_grids')" :to="{ name: 'rh-paie-grilles' }" />
          <SidebarItem icon="ti ti-trending-up" :label="t('sidebar.raises')"       :to="{ name: 'rh-paie-augmentations' }" />
          <SidebarItem icon="ti ti-gift"        :label="t('sidebar.thirteenth')"   :to="{ name: 'rh-paie-treizieme' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Rapports -->
      <template v-else-if="navStore.activeModule === 'rapports'">
        <SidebarSection :label="t('sidebar.hr_reports')">
          <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.hr_dashboard')" :to="{ name: 'rh-rapports' }" />
          <SidebarItem icon="ti ti-users"            :label="t('sidebar.staff_list')"   :to="{ name: 'rh-rapports-personnel' }" />
          <SidebarItem icon="ti ti-arrows-exchange"  :label="t('sidebar.movements')"    :to="{ name: 'rh-rapports-mouvements' }" />
          <SidebarItem icon="ti ti-chart-bar"        :label="t('sidebar.age_pyramid')"  :to="{ name: 'rh-rapports-pyramide' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.analyses')">
          <SidebarItem icon="ti ti-percentage"    :label="t('sidebar.absenteeism')" :to="{ name: 'rh-rapports-absenteisme' }" />
          <SidebarItem icon="ti ti-trending-down" :label="t('sidebar.turnover')"    :to="{ name: 'rh-rapports-turnover' }" />
          <SidebarItem icon="ti ti-sitemap"       :label="t('sidebar.org_chart')"   :to="{ name: 'rh-organigramme' }" />
        </SidebarSection>
        <SidebarSection :label="t('sidebar.exports')">
          <SidebarItem icon="ti ti-file-spreadsheet" :label="t('sidebar.export_excel')" :to="{ name: 'rh-rapports-export-excel' }" />
          <SidebarItem icon="ti ti-file-text"        :label="t('sidebar.export_csv')"   :to="{ name: 'rh-rapports-export-csv' }" />
          <SidebarItem icon="ti ti-plug"             :label="t('sidebar.navision')"      :to="{ name: 'rh-rapports-navision' }" />
        </SidebarSection>
      </template>

    </template>

    <!-- ══════════ CÔTÉ EMPLOYÉ / VALIDATEUR ══════════ -->
    <template v-else>
      <SidebarSection :label="t('sidebar.my_space')">
        <SidebarItem icon="ti ti-layout-dashboard" :label="t('sidebar.dashboard')"  :to="{ name: 'employe' }" />
        <SidebarItem icon="ti ti-user"             :label="t('sidebar.my_profile')" :to="{ name: 'employee-profile' }" />
        <SidebarItem icon="ti ti-calendar"         :label="t('sidebar.my_planning')" :to="{ name: 'employee-planning' }" />
      </SidebarSection>

      <SidebarSection :label="t('sidebar.my_requests')">
        <SidebarItem icon="ti ti-calendar-off" :label="t('sidebar.absence_requests')" :to="{ name: 'employee-absences' }"  :badge="myPendingCount" />
        <SidebarItem icon="ti ti-plane"        :label="t('sidebar.my_missions')"      :to="{ name: 'employee-missions' }" />
        <SidebarItem icon="ti ti-receipt"      label="Notes de frais"                 :to="{ name: 'employee-expenses' }" />
      </SidebarSection>

      <template v-if="auth.isValidator">
        <SidebarSection :label="t('sidebar.my_team')">
          <SidebarItem
            icon="ti ti-checkbox"
            :label="t('sidebar.to_validate')"
            :to="{ name: 'employee-validator' }"
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
  padding: 10px 0;
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
