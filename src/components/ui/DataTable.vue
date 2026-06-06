<template>
  <div class="datatable">

    <!-- Slot filtres -->
    <div v-if="$slots.filters" class="datatable__filters">
      <slot name="filters" />
    </div>

    <!-- Table -->
    <div class="datatable__wrapper">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in columns" :key="col.key"
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
          <!-- Loading -->
          <tr v-if="loading">
            <td :colspan="columns.length" class="datatable__state">
              <i class="ti ti-loader-2 spin"></i> Chargement…
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="datatable__state datatable__empty">
              <i class="ti ti-inbox"></i>
              {{ emptyMessage ?? 'Aucun résultat trouvé' }}
            </td>
          </tr>

          <!-- Rows -->
          <template v-else v-for="(row, i) in rows" :key="rowKey ? row[rowKey] : i">
            <tr class="datatable__row" @click="$emit('rowClick', row)">
              <td
                v-for="col in columns" :key="col.key"
                :style="{ textAlign: col.align ?? 'left' }"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
            <!-- Slot ligne détail (expandable rows) -->
            <slot name="row-after" :row="row" :index="i" />
          </template>
        </tbody>
      </table>
    </div>

    <!-- Slot pagination -->
    <div v-if="$slots.pagination" class="datatable__pagination">
      <slot name="pagination" />
    </div>

  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
defineProps<{
  columns: Array<{
    key: string
    label: string
    width?: string
    align?: 'left' | 'center' | 'right'
    sortable?: boolean
  }>
  rows: T[]
  loading?: boolean
  emptyMessage?: string
  rowKey?: string
  sortKey?: string
  sortDir?: 'asc' | 'desc'
}>()

defineEmits<{
  rowClick: [row: T]
  sort: [key: string]
}>()
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
  padding: 10px 14px;
  border-bottom: 0.5px solid var(--color-border);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

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

.datatable__state {
  text-align: center;
  padding: 48px 20px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.datatable__empty i { font-size: 28px; display: block; margin-bottom: 8px; }

.datatable__pagination {
  padding: 10px 14px;
  border-top: 0.5px solid var(--color-border);
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; display: inline-block; }
</style>
