<template>
  <div class="emp-selector" ref="rootEl">

    <!-- Trigger -->
    <button
      type="button"
      class="trigger"
      :class="{ 'trigger--open': open, 'trigger--selected': !!selected }"
      :disabled="disabled"
      @click="toggle"
    >
      <template v-if="selected">
        <span
          class="avatar-sm"
          :style="{ background: selected.avatarBg ?? '#B5D4F4', color: selected.avatarText ?? '#0C447C' }"
        >{{ getInitials(selected.name) }}</span>
        <span class="trigger-name">{{ selected.name }}</span>
        <button type="button" class="clear-btn" @click.stop="clear">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </template>
      <template v-else>
        <i class="ti ti-user" aria-hidden="true"></i>
        <span class="trigger-placeholder">{{ placeholder }}</span>
        <i class="ti ti-chevron-down arrow" aria-hidden="true"></i>
      </template>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div v-if="open" class="dropdown">
        <!-- Search -->
        <div class="search-wrap">
          <i class="ti ti-search search-icon" aria-hidden="true"></i>
          <input
            ref="searchEl"
            v-model="query"
            type="text"
            class="search-input"
            placeholder="Rechercher..."
            @keydown.escape="close"
          />
        </div>

        <!-- List -->
        <div class="list">
          <button
            v-for="emp in filtered"
            :key="emp.id"
            type="button"
            class="item"
            :class="{ 'item--active': modelValue === emp.id }"
            @click="select(emp.id)"
          >
            <span
              class="avatar-sm"
              :style="{ background: emp.avatarBg ?? '#B5D4F4', color: emp.avatarText ?? '#0C447C' }"
            >{{ getInitials(emp.name) }}</span>
            <span class="item-info">
              <span class="item-name">{{ emp.name }}</span>
              <span v-if="emp.entityName" class="item-entity">{{ emp.entityName }}</span>
            </span>
            <i v-if="modelValue === emp.id" class="ti ti-check item-check" aria-hidden="true"></i>
          </button>

          <div v-if="filtered.length === 0" class="empty">
            Aucun résultat pour « {{ query }} »
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { getInitials } from '../../utils/helpers'

interface EmpItem {
  id:          string
  name:        string
  avatarBg?:   string
  avatarText?: string
  entityName?: string
}

const props = withDefaults(defineProps<{
  employees:   EmpItem[]
  modelValue?: string
  placeholder?: string
  disabled?:   boolean
}>(), {
  placeholder: 'Sélectionner un employé',
  disabled:    false,
})

const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const rootEl   = ref<HTMLElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)
const open     = ref(false)
const query    = ref('')

const selected = computed(() =>
  props.modelValue ? props.employees.find(e => e.id === props.modelValue) : undefined
)

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  return q ? props.employees.filter(e => e.name.toLowerCase().includes(q)) : props.employees
})

function toggle() {
  if (props.disabled) return
  open.value ? close() : openDropdown()
}

function openDropdown() {
  open.value = true
  query.value = ''
  nextTick(() => searchEl.value?.focus())
}

function close() {
  open.value = false
  query.value = ''
}

function select(id: string) {
  emit('update:modelValue', id)
  close()
}

function clear() {
  emit('update:modelValue', '')
}

onClickOutside(rootEl, close)

watch(() => props.modelValue, () => {
  if (!props.modelValue) query.value = ''
})
</script>

<style scoped>
.emp-selector { position: relative; }

/* ── Trigger ── */
.trigger {
  display: flex; align-items: center; gap: 8px;
  width: 100%; height: 38px; padding: 0 10px;
  border: 0.5px solid var(--color-border);
  border-radius: 6px; background: var(--color-bg);
  font-size: 13px; color: var(--color-text-muted);
  cursor: pointer; transition: border-color .12s, background .12s;
  text-align: left;
}
.trigger:hover:not(:disabled)     { border-color: var(--color-primary); }
.trigger--open, .trigger--selected { border-color: var(--color-primary); background: var(--color-surface); }
.trigger:disabled                  { opacity: .5; cursor: not-allowed; }

.trigger-placeholder { flex: 1; color: var(--color-text-muted); }
.trigger-name        { flex: 1; color: var(--color-text); font-weight: 500; }
.arrow               { font-size: 12px; color: var(--color-text-muted); transition: transform .15s; }
.trigger--open .arrow { transform: rotate(180deg); }

.clear-btn {
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none;
  background: var(--color-border); border-radius: 50%;
  cursor: pointer; color: var(--color-text-muted); font-size: 11px;
  flex-shrink: 0; transition: background .12s;
}
.clear-btn:hover { background: var(--color-danger-bg); color: var(--color-danger); }

/* ── Avatar ── */
.avatar-sm {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}

/* ── Dropdown ── */
.dropdown {
  position: absolute; top: calc(100% + 4px); left: 0;
  z-index: 200; min-width: 280px; width: 100%;
  background: var(--color-surface);
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
  overflow: hidden;
}

/* Search */
.search-wrap {
  position: relative;
  padding: 8px 8px 4px;
  border-bottom: 0.5px solid var(--color-border);
}
.search-icon {
  position: absolute; left: 16px; top: 50%;
  transform: translateY(-50%) translateY(2px);
  color: var(--color-text-muted); font-size: 13px;
  pointer-events: none;
}
.search-input {
  width: 100%; height: 32px; padding: 0 10px 0 32px;
  border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); font-size: 13px;
  color: var(--color-text); outline: none;
}
.search-input:focus { border-color: var(--color-primary); }

/* List */
.list { max-height: 220px; overflow-y: auto; padding: 4px; }

.item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 8px; border: none; border-radius: 6px;
  background: none; cursor: pointer; text-align: left;
  transition: background .1s;
}
.item:hover    { background: var(--color-primary-light); }
.item--active  { background: var(--color-primary-light); }

.item-info  { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.item-name  { font-size: 13px; font-weight: 500; color: var(--color-text); }
.item-entity { font-size: 11px; color: var(--color-text-muted); }
.item-check { color: var(--color-primary); font-size: 14px; flex-shrink: 0; }

.empty { padding: 16px; text-align: center; font-size: 13px; color: var(--color-text-muted); }

/* Transition */
.dropdown-enter-active, .dropdown-leave-active { transition: all .15s; }
.dropdown-enter-from, .dropdown-leave-to       { opacity: 0; transform: translateY(-4px); }
</style>
