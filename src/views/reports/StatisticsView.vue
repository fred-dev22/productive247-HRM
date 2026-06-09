<template>
  <div class="app-shell">
    <AppTopNav :user="auth.user" />
    <div class="main-layout">
      <AppSidebar />
      <main class="content">

        <div class="page-header">
          <div>
            <div class="page-title">Statistiques RH</div>
            <div class="page-sub">Vue d'ensemble — {{ currentYear }}</div>
          </div>
          <div class="header-actions">
            <select v-model="selectedYear" class="filter-select">
              <option :value="2026">2026</option>
              <option :value="2025">2025</option>
            </select>
            <button class="btn btn-outline"><i class="ti ti-file-export"></i> Exporter</button>
          </div>
        </div>

        <!-- ── KPIs globaux ── -->
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-icon" style="background:var(--color-success-bg)">
              <i class="ti ti-users" style="color:var(--color-success)"></i>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ totalEmployees }}</div>
              <div class="kpi-label">Effectif total</div>
              <div class="kpi-sub">+2 ce mois</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:var(--color-warning-bg)">
              <i class="ti ti-calendar-off" style="color:var(--color-warning)"></i>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ absenteeismRate }}%</div>
              <div class="kpi-label">Taux d'absentéisme</div>
              <div class="kpi-sub">Cumul {{ selectedYear }}</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:var(--color-primary-light)">
              <i class="ti ti-plane" style="color:var(--color-primary)"></i>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ totalMissions }}</div>
              <div class="kpi-label">Ordres de mission</div>
              <div class="kpi-sub">Soumis {{ selectedYear }}</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:var(--color-neutral-bg)">
              <i class="ti ti-check" style="color:var(--color-neutral)"></i>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ approvalRate }}%</div>
              <div class="kpi-label">Taux d'approbation</div>
              <div class="kpi-sub">Congés approuvés</div>
            </div>
          </div>
        </div>

        <!-- ── Section absences ── -->
        <div class="section-title"><i class="ti ti-calendar-off"></i> Absences par type</div>
        <div class="two-col">
          <div class="card">
            <div class="card-title">Répartition des congés</div>
            <div class="absence-bars">
              <div class="ab-row" v-for="ab in absencesByType" :key="ab.key">
                <div class="ab-type">{{ ab.label }}</div>
                <div class="ab-bar-wrap">
                  <div class="ab-bar" :style="{ width: ab.pct + '%', background: ab.color }"></div>
                </div>
                <div class="ab-count">{{ ab.count }}j</div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Statut des demandes</div>
            <div class="status-list">
              <div class="stat-row" v-for="s in leaveStats" :key="s.label">
                <span class="stat-dot" :style="{ background: s.color }"></span>
                <span class="stat-label">{{ s.label }}</span>
                <span class="stat-val">{{ s.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Structure organisationnelle ── -->
        <div class="section-title"><i class="ti ti-sitemap"></i> Structure</div>
        <div class="structure-row">
          <div class="card struct-card" v-for="s in structureStats" :key="s.label">
            <div class="struct-val">{{ s.value }}</div>
            <div class="struct-label">{{ s.label }}</div>
          </div>
        </div>

        <!-- ── Missions ── -->
        <div class="section-title"><i class="ti ti-plane"></i> Missions</div>
        <div class="two-col">
          <div class="card">
            <div class="card-title">Missions par statut</div>
            <div class="status-list">
              <div class="stat-row" v-for="m in missionStats" :key="m.label">
                <span class="stat-dot" :style="{ background: m.color }"></span>
                <span class="stat-label">{{ m.label }}</span>
                <span class="stat-val">{{ m.count }}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Montants engagés</div>
            <div class="mission-amounts">
              <div class="amount-row">
                <span class="amount-label">Total approuvé</span>
                <span class="amount-val">{{ fmt(missionAmounts.approved) }} MGA</span>
              </div>
              <div class="amount-row">
                <span class="amount-label">En attente</span>
                <span class="amount-val">{{ fmt(missionAmounts.pending) }} MGA</span>
              </div>
              <div class="amount-row total-row">
                <span class="amount-label">Total global</span>
                <span class="amount-val amount-total">{{ fmt(missionAmounts.total) }} MGA</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppSidebar, AppTopNav } from '../../components'
import { useAuthStore }    from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import { useMissionStore } from '../../stores/missions'
import { useEmployeeStore } from '../../stores/employees'

const auth          = useAuthStore()
const absenceStore  = useAbsenceStore()
const missionStore  = useMissionStore()
const employeeStore = useEmployeeStore()

const selectedYear = ref(2026)
const currentYear  = computed(() => selectedYear.value)

const totalEmployees = computed(() => employeeStore.employees.filter(e => e.status === 'active').length)

const absenteeismRate = computed(() => {
  const approved = absenceStore.allLeaves.filter(l => l.status === 'approved').length
  return ((approved / totalEmployees.value) * 100).toFixed(1)
})

const totalMissions  = computed(() => missionStore.missions.length)
const approvalRate   = computed(() => {
  const total    = absenceStore.allLeaves.length
  const approved = absenceStore.allLeaves.filter(l => l.status === 'approved').length
  return total > 0 ? ((approved / total) * 100).toFixed(0) : '0'
})

const absencesByType = computed(() => {
  const types = [
    { key: 'Congé annuel',              label: 'Annuel',     color: 'var(--color-primary)' },
    { key: 'Congé maladie',             label: 'Maladie',    color: 'var(--color-danger)' },
    { key: 'Récupération',              label: 'Récup.',     color: 'var(--color-info)' },
    { key: 'Télétravail',               label: 'Télétravail', color: 'var(--color-warning)' },
    { key: 'Congé maternité',           label: 'Maternité',  color: 'var(--color-neutral)' },
    { key: 'Permission exceptionnelle', label: 'Permission', color: 'var(--color-success)' },
  ]
  const max = 100
  return types.map(t => {
    const count = absenceStore.allLeaves
      .filter(l => l.type === t.key)
      .reduce((acc, l) => acc + l.workingDays, 0)
    return { ...t, count, pct: Math.min(100, (count / max) * 100) }
  })
})

const leaveStats = computed(() => [
  { label: 'En attente',  count: absenceStore.allLeaves.filter(l => l.status === 'pending').length,  color: 'var(--color-warning)' },
  { label: 'Approuvées',  count: absenceStore.allLeaves.filter(l => l.status === 'approved').length, color: 'var(--color-success)' },
  { label: 'Refusées',    count: absenceStore.allLeaves.filter(l => l.status === 'rejected').length, color: 'var(--color-danger)'  },
  { label: 'Brouillons',  count: absenceStore.allLeaves.filter(l => l.status === 'draft').length,    color: 'var(--color-neutral)' },
])

const structureStats = computed(() => [
  { label: 'Directions',   value: 2  },
  { label: 'Départements', value: 6  },
  { label: 'Services',     value: 8  },
  { label: 'Effectif RH',  value: totalEmployees.value },
])

const missionStats = computed(() => [
  { label: 'En attente',  count: missionStore.missions.filter(m => m.status === 'pending').length,  color: 'var(--color-warning)' },
  { label: 'Approuvées',  count: missionStore.missions.filter(m => m.status === 'approved').length, color: 'var(--color-success)' },
  { label: 'Refusées',    count: missionStore.missions.filter(m => m.status === 'rejected').length, color: 'var(--color-danger)'  },
  { label: 'Brouillons',  count: missionStore.missions.filter(m => m.status === 'draft').length,    color: 'var(--color-neutral)' },
])

const missionAmounts = computed(() => {
  const approved = missionStore.missions.filter(m => m.status === 'approved').reduce((s, m) => s + m.totalMission, 0)
  const pending  = missionStore.missions.filter(m => m.status === 'pending').reduce((s, m) => s + m.totalMission, 0)
  return { approved, pending, total: approved + pending }
})

function fmt(n: number) { return n.toLocaleString('fr-FR') }
</script>

<style scoped>
.app-shell   { display: flex; flex-direction: column; min-height: 100vh; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.content     { flex: 1; padding: 24px 28px; background: var(--color-bg); overflow-y: auto; }

.page-header  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
.page-title   { font-size: 20px; font-weight: 700; color: var(--color-text); }
.page-sub     { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; align-items: center; }

.btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all .12s; }
.btn-outline { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg); }
.filter-select { height: 34px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; background: var(--color-surface); font-size: 13px; color: var(--color-text); outline: none; }

/* KPIs */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.kpi-card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 14px; }
.kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px; }
.kpi-val  { font-size: 24px; font-weight: 700; color: var(--color-text); line-height: 1; }
.kpi-label { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
.kpi-sub  { font-size: 11px; color: var(--color-text-muted); margin-top: 3px; }

/* Section title */
.section-title { font-size: 14px; font-weight: 700; color: var(--color-text); display: flex; align-items: center; gap: 8px; margin: 20px 0 12px; }
.section-title i { color: var(--color-primary); }

/* Cards */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 8px; }
.card { background: var(--color-surface); border: 0.5px solid var(--color-border); border-radius: 10px; padding: 16px; }
.card-title { font-size: 13px; font-weight: 600; color: var(--color-text); margin-bottom: 14px; }

/* Absence bars */
.absence-bars { display: flex; flex-direction: column; gap: 10px; }
.ab-row  { display: flex; align-items: center; gap: 10px; }
.ab-type { font-size: 12px; color: var(--color-text-muted); width: 90px; flex-shrink: 0; }
.ab-bar-wrap { flex: 1; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.ab-bar  { height: 100%; border-radius: 4px; transition: width .3s; }
.ab-count { font-size: 12px; font-weight: 600; color: var(--color-text); width: 30px; text-align: right; }

/* Status list */
.status-list { display: flex; flex-direction: column; gap: 8px; }
.stat-row  { display: flex; align-items: center; gap: 8px; }
.stat-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.stat-label { flex: 1; font-size: 13px; color: var(--color-text); }
.stat-val   { font-size: 14px; font-weight: 600; color: var(--color-text); }

/* Structure */
.structure-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
.struct-card { text-align: center; padding: 20px 16px; }
.struct-val  { font-size: 28px; font-weight: 700; color: var(--color-primary); }
.struct-label { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }

/* Amounts */
.mission-amounts { display: flex; flex-direction: column; gap: 10px; }
.amount-row  { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 0.5px solid var(--color-border); }
.amount-row:last-child { border-bottom: none; }
.total-row   { padding-top: 10px; margin-top: 4px; border-top: 1px solid var(--color-border); }
.amount-label { font-size: 13px; color: var(--color-text-muted); }
.amount-val   { font-size: 13px; font-weight: 600; color: var(--color-text); }
.amount-total { font-size: 15px; color: var(--color-primary); }

@media (max-width: 1100px) { .kpi-row { grid-template-columns: 1fr 1fr; } .structure-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px)  { .kpi-row, .two-col, .structure-row { grid-template-columns: 1fr; } .content { padding: 16px; } }
</style>
