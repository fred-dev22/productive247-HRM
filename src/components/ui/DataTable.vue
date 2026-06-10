<template>
  <div class="datatable" :class="{ 'datatable--compact': density === 'compact' }">

    <!-- Filters bar + built-in toolbar -->
    <div v-if="$slots.filters || hideableColumns.length > 0" class="datatable__filters">
      <div class="filters-content">
        <slot name="filters" />
      </div>
      <div class="datatable__tools">
        <button
          class="tool-btn"
          :class="{ active: density === 'compact' }"
          :title="density === 'compact' ? 'Affichage normal' : 'Affichage compact'"
          @click="toggleDensity"
        >
          <i class="ti ti-layout-rows"></i>
        </button>
        <div v-if="hideableColumns.length > 0" ref="colsWrapRef" class="col-toggle-wrap">
          <button
            class="tool-btn"
            :class="{ active: showColMenu }"
            title="Visibilité des colonnes"
            @click="showColMenu = !showColMenu"
          >
            <i class="ti ti-layout-columns"></i>
          </button>
          <div v-if="showColMenu" class="col-menu">
            <div class="col-menu-title">COLONNES</div>
            <label v-for="col in hideableColumns" :key="col.key" class="col-menu-item">
              <input
                type="checkbox"
                :checked="!hiddenKeys.includes(col.key)"
                @change="toggleColumn(col.key)"
              />
              <span>{{ col.label }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="datatable__wrapper">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in visibleColumns" :key="col.key"
              :style="{ width: col.width, textAlign: col.align ?? 'left' }"
              :class="{ 'col-sortable': col.sortable }"
              @click="col.sortable && $emit('sort', col.key)"
            >
              <span class="th-inner">
                {{ col.label }}
                <span v-if="col.sortable" class="sort-icon">
                  <i v-if="sortKey === col.key && sortDir === 'asc'"  class="ti ti-sort-ascending-letters"></i>
                  <i v-else-if="sortKey === col.key && sortDir === 'desc'" class="ti ti-sort-descending-letters"></i>
                  <i v-else class="ti ti-arrows-sort"></i>
                </span>
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td :colspan="visibleColumns.length" class="datatable__state">
              <i class="ti ti-loader-2 spin"></i> Chargement…
            </td>
          </tr>

          <tr v-else-if="!rows.length">
            <td :colspan="visibleColumns.length" class="datatable__state datatable__empty">
              <i class="ti ti-inbox"></i>
              {{ emptyMessage ?? 'Aucun résultat trouvé' }}
            </td>
          </tr>

          <template v-else v-for="(row, i) in pagedRows" :key="rowKey ? row[rowKey] : i">
            <tr class="datatable__row" @click="$emit('rowClick', row)">
              <td
                v-for="col in visibleColumns" :key="col.key"
                :style="{ textAlign: col.align ?? 'left' }"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
            <slot name="row-after" :row="row" :index="i" />
          </template>
        </tbody>
      </table>
    </div>

    <!-- Built-in pagination (when pageSize prop is set and no external #pagination slot) -->
    <div v-if="props.pageSize && !$slots.pagination && rows.length > 0" class="datatable__pagination">
      <span class="pg-info">{{ pageStart + 1 }}–{{ pageEnd }} / {{ rows.length }}</span>
      <div class="pg-controls">
        <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage--">
          <i class="ti ti-chevron-left"></i>
        </button>
        <span class="pg-label">{{ currentPage }} / {{ totalPages }}</span>
        <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage++">
          <i class="ti ti-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- External pagination slot (backward compat) -->
    <div v-else-if="$slots.pagination" class="datatable__pagination">
      <slot name="pagination" />
    </div>

  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  columns: Array<{
    key: string
    label: string
    width?: string
    align?: 'left' | 'center' | 'right'
    sortable?: boolean
    hideable?: boolean
  }>
  rows: T[]
  loading?: boolean
  emptyMessage?: string
  rowKey?: string
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  pageSize?: number
}>()

defineEmits<{
  rowClick: [row: T]
  sort: [key: string]
}>()

// ── Density ──────────────────────────────────────────────────
const density = ref<'normal' | 'compact'>('normal')
function toggleDensity() {
  density.value = density.value === 'normal' ? 'compact' : 'normal'
}

// ── Column visibility ─────────────────────────────────────────
const hiddenKeys   = ref<string[]>([])
const showColMenu  = ref(false)
const colsWrapRef  = ref<HTMLElement | null>(null)

onClickOutside(colsWrapRef, () => { showColMenu.value = false })

const hideableColumns = computed(() => props.columns.filter(c => c.hideable))
const visibleColumns  = computed(() => props.columns.filter(c => !hiddenKeys.value.includes(c.key)))

function toggleColumn(key: string) {
  const idx = hiddenKeys.value.indexOf(key)
  if (idx >= 0) hiddenKeys.value.splice(idx, 1)
  else hiddenKeys.value.push(key)
}

// ── Pagination ─────────────────────────────────────────────────
const currentPage = ref(1)

const totalPages = computed(() =>
  props.pageSize ? Math.max(1, Math.ceil(props.rows.length / props.pageSize)) : 1
)
const pageStart = computed(() =>
  props.pageSize ? (currentPage.value - 1) * props.pageSize : 0
)
const pageEnd = computed(() =>
  props.pageSize
    ? Math.min(pageStart.value + props.pageSize, props.rows.length)
    : props.rows.length
)
const pagedRows = computed(() =>
  props.pageSize ? props.rows.slice(pageStart.value, pageEnd.value) : props.rows
)

watch(() => props.rows.length, () => { currentPage.value = 1 })
</script>

<style scoped>
.datatable {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: 8px;
  border: 0.5px solid var(--color-border);
  overflow: hidden;
}

.datatable__filters {
  min-height: 44px;
  border-bottom: 0.5px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}

.filters-content {
  flex: 1;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.datatable__tools {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.tool-btn {
  width: 30px; height: 30px;
  border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); color: var(--color-text-muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: all .12s;
}
.tool-btn:hover { background: var(--color-surface); color: var(--color-text); }
.tool-btn.active { background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary); }

.col-toggle-wrap { position: relative; }
.col-menu {
  position: absolute; top: calc(100% + 4px); right: 0; z-index: 300;
  background: var(--color-surface); border: 0.5px solid var(--color-border);
  border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12);
  padding: 6px; min-width: 160px;
}
.col-menu-title {
  font-size: 10px; font-weight: 700; color: var(--color-text-muted);
  letter-spacing: .06em; padding: 4px 8px 6px;
}
.col-menu-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 5px; font-size: 12px; color: var(--color-text);
  cursor: pointer; user-select: none;
}
.col-menu-item:hover { background: var(--color-bg); }
.col-menu-item input[type="checkbox"] { accent-color: var(--color-primary); }

.datatable__wrapper { overflow-x: auto; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead tr {
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

thead th {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.col-sortable { cursor: pointer; user-select: none; }
.col-sortable:hover { color: var(--color-primary); }

.th-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sort-icon { font-size: 12px; opacity: 0.6; }

tbody tr.datatable__row {
  border-bottom: 0.5px solid var(--color-border);
  transition: background 0.1s;
  cursor: pointer;
}
tbody tr.datatable__row:last-child { border-bottom: none; }
tbody tr.datatable__row:hover { background: var(--color-primary-light); }

tbody td {
  padding: 10px 14px;
  color: var(--color-text);
  vertical-align: middle;
}

/* Compact density */
.datatable--compact thead th { padding: 6px 14px; }
.datatable--compact tbody td { padding: 6px 14px; }

.datatable__state {
  text-align: center;
  padding: 48px 20px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.datatable__empty i { font-size: 28px; display: block; margin-bottom: 8px; }

/* Pagination */
.datatable__pagination {
  padding: 8px 14px;
  border-top: 0.5px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.pg-info { font-size: 12px; color: var(--color-text-muted); flex: 1; }

.pg-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pg-btn {
  width: 28px; height: 28px;
  border: 0.5px solid var(--color-border); border-radius: 5px;
  background: var(--color-bg); color: var(--color-text-muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 13px; transition: all .12s;
}
.pg-btn:hover:not(:disabled) { background: var(--color-surface); color: var(--color-text); }
.pg-btn:disabled { opacity: 0.4; cursor: default; }

.pg-label { font-size: 12px; color: var(--color-text); min-width: 50px; text-align: center; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; display: inline-block; }
</style>
