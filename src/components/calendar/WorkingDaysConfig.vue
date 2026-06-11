<template>
  <div class="wdc">

    <!-- ── 7 toggles de jours avec horaires + pauses ── -->
    <div class="days-grid">
      <div
        v-for="key in DAY_ORDER" :key="key"
        class="day-row" :class="{ 'day-row--on': days[key].enabled }"
      >
        <!-- Nom du jour -->
        <span class="day-name">{{ DAY_LABELS[key] }}</span>

        <!-- Toggle actif/inactif -->
        <label class="toggle-wrap day-toggle-label">
          <input type="checkbox" class="toggle-input" v-model="days[key].enabled" />
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </label>

        <!-- Horaires + Pause (une seule ligne) -->
        <template v-if="days[key].enabled">
          <input type="time" class="time-input" v-model="days[key].start" />
          <span class="hours-sep">→</span>
          <input type="time" class="time-input" v-model="days[key].end" />
          <span class="day-hours-total">{{ calcDayHours(days[key]) }} eff.</span>

          <!-- Séparateur visuel -->
          <span class="row-divider" aria-hidden="true">|</span>

          <!-- Toggle Pause -->
          <label class="break-toggle-label">
            <span class="toggle-wrap">
              <input type="checkbox" class="toggle-input" v-model="days[key].breakEnabled" />
              <span class="toggle-track toggle-track--sm"><span class="toggle-thumb toggle-thumb--sm"></span></span>
            </span>
            <span class="break-label-text">Pause</span>
          </label>

          <!-- Plage de pause -->
          <template v-if="days[key].breakEnabled">
            <input type="time" class="time-input time-input--sm" v-model="days[key].breakStart"
              :class="{ 'time-input--error': !!dayBreakError(key) }" />
            <span class="hours-sep">→</span>
            <input type="time" class="time-input time-input--sm" v-model="days[key].breakEnd"
              :class="{ 'time-input--error': !!dayBreakError(key) }" />
            <span v-if="dayBreakError(key)" class="break-error-inline">
              <i class="ti ti-alert-circle" aria-hidden="true"></i>
              {{ dayBreakError(key) }}
            </span>
          </template>
          <span v-else class="no-break-label">Aucune pause</span>
        </template>
        <span v-else class="day-disabled-label">Jour non travaillé</span>
      </div>
    </div>

    <!-- ── Récapitulatif hebdomadaire ── -->
    <div class="wdc-recap">
      <i class="ti ti-clock" aria-hidden="true"></i>
      {{ calendarStore.daysPerWeek }} jour{{ calendarStore.daysPerWeek > 1 ? 's' : '' }}
      · {{ calendarStore.formatMinutes(calendarStore.weeklyMinutes) }} par semaine
      · {{ calendarStore.formatMinutes(Math.round(calendarStore.weeklyMinutes * 4.33)) }} par mois
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCalendarStore } from '../../stores/calendar'
import type { WorkingDays, WorkingDayConfig } from '../../types'

// Lit et écrit directement dans calendarStore — aucune prop
const calendarStore = useCalendarStore()
const days = computed(() => calendarStore.calendar.workingDays)

const DAY_ORDER: (keyof WorkingDays)[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<keyof WorkingDays, string> = {
  monday:'Lundi', tuesday:'Mardi', wednesday:'Mercredi',
  thursday:'Jeudi', friday:'Vendredi', saturday:'Samedi', sunday:'Dimanche',
}

function calcDayHours(day: WorkingDayConfig): string {
  const workMin  = calendarStore.toMinutes(day.end) - calendarStore.toMinutes(day.start)
  const breakMin = day.breakEnabled
    ? calendarStore.toMinutes(day.breakEnd) - calendarStore.toMinutes(day.breakStart)
    : 0
  return calendarStore.formatMinutes(Math.max(0, workMin - breakMin))
}

function dayBreakError(key: keyof WorkingDays): string | null {
  const day = days.value[key]
  if (!day.enabled || !day.breakEnabled) return null
  const bStart = calendarStore.toMinutes(day.breakStart)
  const bEnd   = calendarStore.toMinutes(day.breakEnd)
  if (bEnd <= bStart)                            return 'Fin avant début'
  if (bStart < calendarStore.toMinutes(day.start)) return 'Avant l\'heure de début'
  if (bEnd   > calendarStore.toMinutes(day.end))   return 'Après l\'heure de fin'
  return null
}
</script>

<style scoped>
/* ── Day rows — une seule ligne ── */
.days-grid { display: flex; flex-direction: column; gap: 2px; }
.day-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background .12s;
  flex-wrap: nowrap;
  min-height: 44px;
}
.day-row--on { background: var(--color-primary-light); }
.day-name    { font-size: 13px; font-weight: 500; color: var(--color-text); width: 90px; flex-shrink: 0; }
.day-toggle-label { cursor: pointer; flex-shrink: 0; }
.day-disabled-label { font-size: 11px; color: var(--color-text-muted); font-style: italic; }
.row-divider { color: var(--color-border); font-size: 16px; user-select: none; flex-shrink: 0; }

/* Toggle switch */
.toggle-wrap  { position: relative; display: inline-flex; align-items: center; flex-shrink: 0; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track { width: 36px; height: 20px; background: var(--color-border-strong); border-radius: 10px; position: relative; transition: background .2s; cursor: pointer; flex-shrink: 0; }
.toggle-input:checked + .toggle-track { background: var(--color-primary); }
.toggle-thumb { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
.toggle-input:checked + .toggle-track .toggle-thumb { left: 19px; }
/* Small */
.toggle-track--sm { width: 28px; height: 16px; }
.toggle-thumb--sm { width: 10px; height: 10px; top: 3px; left: 3px; }
.toggle-input:checked + .toggle-track--sm .toggle-thumb--sm { left: 15px; }

.hours-sep   { color: var(--color-text-muted); font-size: 14px; flex-shrink: 0; }
.time-input  { height: 32px; padding: 0 8px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 13px; color: var(--color-text); background: var(--color-surface); outline: none; width: 96px; flex-shrink: 0; transition: border-color .12s; }
.time-input--sm    { width: 80px; height: 28px; font-size: 12px; }
.time-input:focus  { border-color: var(--color-primary); }
.time-input--error { border-color: var(--color-danger) !important; }
.day-hours-total   { font-size: 11px; font-weight: 600; color: var(--color-primary); background: var(--color-primary-light); border-radius: 4px; padding: 2px 8px; white-space: nowrap; flex-shrink: 0; }

.break-toggle-label { display: flex; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0; }
.break-label-text   { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }
.no-break-label     { font-size: 11px; color: var(--color-text-muted); font-style: italic; white-space: nowrap; }
.break-error-inline { font-size: 10px; color: var(--color-danger); display: flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; }

/* ── Récapitulatif hebdomadaire ── */
.wdc-recap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--color-bg);
  border: 0.5px solid var(--color-border);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}
.wdc-recap i { font-size: 15px; color: var(--color-primary); }

@media (max-width: 768px) {
  .day-row { flex-wrap: wrap; }
  .row-divider { display: none; }
  .break-toggle-label { margin-left: 100px; }
}
</style>
