<template>
  <div class="px-7 py-6">

        <div class="flex items-start justify-between mb-5 gap-3 flex-wrap">
          <div>
            <div class="text-xl font-bold text-foreground">Statistiques RH</div>
            <div class="text-[13px] text-muted-foreground mt-0.5">Vue d'ensemble — {{ currentYear }}</div>
          </div>
          <div class="flex gap-2 items-center">
            <select v-model="selectedYear" class="h-[34px] px-2.5 border border-border rounded-md bg-card text-[13px] text-foreground outline-none focus:border-primary">
              <option :value="2026">2026</option>
              <option :value="2025">2025</option>
            </select>
            <button :class="L.btnOutline"><FileDown class="w-4 h-4" /> Exporter</button>
          </div>
        </div>

        <!-- ── KPIs globaux ── -->
        <div class="grid grid-cols-4 gap-3 mb-5 max-[1100px]:grid-cols-2 max-md:grid-cols-1">
          <div :class="kpiCard">
            <div :class="kpiIcon" class="bg-success-bg"><Users class="w-5 h-5 text-success" /></div>
            <div>
              <div :class="kpiVal">{{ totalEmployees }}</div>
              <div :class="kpiLabel">Effectif total</div>
              <div :class="kpiSub">+2 ce mois</div>
            </div>
          </div>
          <div :class="kpiCard">
            <div :class="kpiIcon" class="bg-warning-bg"><CalendarOff class="w-5 h-5 text-warning" /></div>
            <div>
              <div :class="kpiVal">{{ absenteeismRate }}%</div>
              <div :class="kpiLabel">Taux d'absentéisme</div>
              <div :class="kpiSub">Cumul {{ selectedYear }}</div>
            </div>
          </div>
          <div :class="kpiCard">
            <div :class="kpiIcon" class="bg-primary/10"><Plane class="w-5 h-5 text-primary" /></div>
            <div>
              <div :class="kpiVal">{{ totalMissions }}</div>
              <div :class="kpiLabel">Ordres de mission</div>
              <div :class="kpiSub">Soumis {{ selectedYear }}</div>
            </div>
          </div>
          <div :class="kpiCard">
            <div :class="kpiIcon" class="bg-neutral-bg"><Check class="w-5 h-5 text-neutral" /></div>
            <div>
              <div :class="kpiVal">{{ approvalRate }}%</div>
              <div :class="kpiLabel">Taux d'approbation</div>
              <div :class="kpiSub">Congés approuvés</div>
            </div>
          </div>
        </div>

        <!-- ── Section absences ── -->
        <div :class="sectionTitle"><CalendarOff class="w-4 h-4 text-primary" /> Absences par type</div>
        <div :class="twoCol">
          <div :class="card">
            <div :class="cardTitle">Répartition des congés</div>
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center gap-2.5" v-for="ab in absencesByType" :key="ab.key">
                <div class="text-xs text-muted-foreground w-[90px] shrink-0">{{ ab.label }}</div>
                <div class="flex-1 h-2 bg-border rounded overflow-hidden">
                  <div class="h-full rounded transition-[width] duration-300" :style="{ width: ab.pct + '%', background: ab.color }"></div>
                </div>
                <div class="text-xs font-semibold text-foreground w-[30px] text-right">{{ ab.count }}j</div>
              </div>
            </div>
          </div>
          <div :class="card">
            <div :class="cardTitle">Statut des demandes</div>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2" v-for="s in leaveStats" :key="s.label">
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: s.color }"></span>
                <span class="flex-1 text-[13px] text-foreground">{{ s.label }}</span>
                <span class="text-sm font-semibold text-foreground">{{ s.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Structure organisationnelle ── -->
        <div :class="sectionTitle"><Network class="w-4 h-4 text-primary" /> Structure</div>
        <div class="grid grid-cols-4 gap-3 mb-2 max-[1100px]:grid-cols-2 max-md:grid-cols-1">
          <div :class="[card, 'text-center !py-5']" v-for="s in structureStats" :key="s.label">
            <div class="text-[28px] font-bold text-primary">{{ s.value }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ s.label }}</div>
          </div>
        </div>

        <!-- ── Missions ── -->
        <div :class="sectionTitle"><Plane class="w-4 h-4 text-primary" /> Missions</div>
        <div :class="twoCol">
          <div :class="card">
            <div :class="cardTitle">Missions par statut</div>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2" v-for="m in missionStats" :key="m.label">
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: m.color }"></span>
                <span class="flex-1 text-[13px] text-foreground">{{ m.label }}</span>
                <span class="text-sm font-semibold text-foreground">{{ m.count }}</span>
              </div>
            </div>
          </div>
          <div :class="card">
            <div :class="cardTitle">Montants engagés</div>
            <div class="flex flex-col gap-2.5">
              <div class="flex justify-between py-1.5 border-b border-border">
                <span class="text-[13px] text-muted-foreground">Total approuvé</span>
                <span class="text-[13px] font-semibold text-foreground">{{ fmt(missionAmounts.approved) }} MGA</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-border">
                <span class="text-[13px] text-muted-foreground">En attente</span>
                <span class="text-[13px] font-semibold text-foreground">{{ fmt(missionAmounts.pending) }} MGA</span>
              </div>
              <div class="flex justify-between pt-2.5 mt-1 border-t border-border">
                <span class="text-[13px] text-muted-foreground">Total global</span>
                <span class="text-[15px] font-semibold text-primary">{{ fmt(missionAmounts.total) }} MGA</span>
              </div>
            </div>
          </div>
        </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileDown, Users, CalendarOff, Plane, Check, Network } from 'lucide-vue-next'
import * as L from '../../lib/listClasses'
import { useAuthStore }    from '../../stores/auth'
import { useAbsenceStore } from '../../stores/absences'
import { useMissionStore } from '../../stores/missions'
import { useEmployeeStore } from '../../stores/employees'

const auth          = useAuthStore()
const absenceStore  = useAbsenceStore()
const missionStore  = useMissionStore()
const employeeStore = useEmployeeStore()

// ── Classes du design system ─────────────────────────────────
const kpiCard = 'bg-card border border-border rounded-[10px] p-4 flex items-center gap-3.5'
const kpiIcon = 'w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0'
const kpiVal = 'text-2xl font-bold text-foreground leading-none'
const kpiLabel = 'text-xs text-muted-foreground mt-0.5'
const kpiSub = 'text-[11px] text-muted-foreground mt-[3px]'
const sectionTitle = 'text-sm font-bold text-foreground flex items-center gap-2 mt-5 mb-3'
const twoCol = 'grid grid-cols-2 gap-3.5 mb-2 max-md:grid-cols-1'
const card = 'bg-card border border-border rounded-[10px] p-4'
const cardTitle = 'text-[13px] font-semibold text-foreground mb-3.5'

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
