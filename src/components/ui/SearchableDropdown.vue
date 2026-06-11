<template>
  <div class="sd-wrap" ref="rootEl">

    <!-- Trigger -->
    <button
      type="button"
      class="sd-trigger"
      :class="{ 'sd-trigger--open': open, 'sd-trigger--selected': !!selected }"
      :disabled="disabled"
      @click="toggle"
    >
      <template v-if="selected">
        <span v-if="showAvatar" class="sd-avatar" :style="avatarStyle(selected)">
          {{ avatarText(selected) }}
        </span>
        <span class="sd-trigger-label">{{ selected.label }}</span>
        <button type="button" class="sd-clear" @click.stop="clear">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </template>
      <template v-else>
        <i v-if="showAvatar" class="ti ti-user sd-placeholder-icon" aria-hidden="true"></i>
        <span class="sd-trigger-placeholder">{{ placeholder }}</span>
        <i class="ti ti-chevron-down sd-arrow" aria-hidden="true"></i>
      </template>
    </button>

    <!-- Dropdown -->
    <Transition name="sd-drop">
      <div v-if="open" class="sd-dropdown">
        <div class="sd-search-wrap">
          <i class="ti ti-search sd-search-icon" aria-hidden="true"></i>
          <input
            ref="searchEl"
            v-model="query"
            type="text"
            class="sd-search-input"
            placeholder="Rechercher..."
            @keydown.escape="close"
          />
        </div>
        <div class="sd-list">
          <button
            v-for="item in filtered"
            :key="item.id"
            type="button"
            class="sd-item"
            :class="{ 'sd-item--active': modelValue === item.id }"
            @click="select(item.id)"
          >
            <span v-if="showAvatar" class="sd-avatar" :style="avatarStyle(item)">
              {{ avatarText(item) }}
            </span>
            <span class="sd-item-info">
              <span class="sd-item-label">{{ item.label }}</span>
              <span v-if="item.sublabel" class="sd-item-sub">{{ item.sublabel }}</span>
            </span>
            <i v-if="modelValue === item.id" class="ti ti-check sd-check" aria-hidden="true"></i>
          </button>
          <div v-if="filtered.length === 0" class="sd-empty">
            Aucun résultat{{ query ? ` pour « ${query} »` : '' }}
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { getInitials } from '../../utils/helpers'

export interface DropdownItem {
  id:          string
  label:       string
  sublabel?:   string
  initials?:   string
  avatarColor?: string
}

const props = withDefaults(defineProps<{
  items:        DropdownItem[]
  modelValue?:  string
  placeholder?: string
  disabled?:    boolean
  showAvatar?:  boolean
}>(), {
  placeholder: 'Sélectionner...',
  disabled:    false,
  showAvatar:  false,
})

const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const rootEl   = ref<HTMLElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)
const open     = ref(false)
const query    = ref('')

const selected = computed(() =>
  props.modelValue ? props.items.find(i => i.id === props.modelValue) : undefined
)

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  return q
    ? props.items.filter(i =>
        i.label.toLowerCase().includes(q) ||
        (i.sublabel ?? '').toLowerCase().includes(q)
      )
    : props.items
})

// Si initials fourni et sans chiffre → l'utiliser ;
// sinon (code type "C447", "EMP001") calculer depuis le label.
function avatarText(item: DropdownItem): string {
  if (item.initials && !/\d/.test(item.initials)) return item.initials
  return getInitials(item.label)
}

function avatarStyle(item: DropdownItem): Record<string, string> {
  return {
    background: item.avatarColor ?? 'var(--color-primary-light)',
    color:      item.avatarColor ? '#fff' : 'var(--color-primary)',
  }
}

function toggle() {
  if (props.disabled) return
  open.value ? close() : openDrop()
}

function openDrop() {
  open.value  = true
  query.value = ''
  nextTick(() => searchEl.value?.focus())
}

function close() {
  open.value  = false
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
</script>

<style scoped>
.sd-wrap { position: relative; }

.sd-trigger {
  display: flex; align-items: center; gap: 8px;
  width: 100%; height: 38px; padding: 0 10px;
  border: 0.5px solid var(--color-border);
  border-radius: 6px; background: var(--color-bg);
  font-size: 13px; color: var(--color-text-muted);
  cursor: pointer; transition: border-color .12s, background .12s;
  text-align: left;
}
.sd-trigger:hover:not(:disabled)      { border-color: var(--color-primary); }
.sd-trigger--open, .sd-trigger--selected { border-color: var(--color-primary); background: var(--color-surface); }
.sd-trigger:disabled                   { opacity: .5; cursor: not-allowed; }

.sd-trigger-placeholder { flex: 1; color: var(--color-text-muted); }
.sd-trigger-label       { flex: 1; color: var(--color-text); font-weight: 500; }
.sd-placeholder-icon    { font-size: 14px; color: var(--color-text-muted); }
.sd-arrow               { font-size: 12px; color: var(--color-text-muted); transition: transform .15s; flex-shrink: 0; }
.sd-trigger--open .sd-arrow { transform: rotate(180deg); }

.sd-clear {
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none;
  background: var(--color-border); border-radius: 50%;
  cursor: pointer; color: var(--color-text-muted); font-size: 11px;
  flex-shrink: 0; transition: background .12s;
}
.sd-clear:hover { background: var(--color-danger-bg); color: var(--color-danger); }

.sd-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}

.sd-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0;
  z-index: 200; min-width: 260px; width: 100%;
  background: var(--color-surface);
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
  overflow: hidden;
}

.sd-search-wrap {
  position: relative;
  padding: 8px 8px 4px;
  border-bottom: 0.5px solid var(--color-border);
}
.sd-search-icon {
  position: absolute; left: 16px; top: 50%;
  transform: translateY(-50%) translateY(2px);
  color: var(--color-text-muted); font-size: 13px; pointer-events: none;
}
.sd-search-input {
  width: 100%; height: 32px; padding: 0 10px 0 32px;
  border: 0.5px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); font-size: 13px; color: var(--color-text); outline: none;
}
.sd-search-input:focus { border-color: var(--color-primary); }

.sd-list { max-height: 240px; overflow-y: auto; padding: 4px; }

.sd-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 8px; border: none; border-radius: 6px;
  background: none; cursor: pointer; text-align: left; transition: background .1s;
}
.sd-item:hover   { background: var(--color-primary-light); }
.sd-item--active { background: var(--color-primary-light); }

.sd-item-info  { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.sd-item-label { font-size: 13px; font-weight: 500; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sd-item-sub   { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sd-check      { color: var(--color-primary); font-size: 14px; flex-shrink: 0; }

.sd-empty { padding: 14px; text-align: center; font-size: 13px; color: var(--color-text-muted); }

.sd-drop-enter-active, .sd-drop-leave-active { transition: all .15s; }
.sd-drop-enter-from, .sd-drop-leave-to       { opacity: 0; transform: translateY(-4px); }
</style>
