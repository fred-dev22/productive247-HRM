<template>
  <div class="avatar" :class="`avatar--${size ?? 'md'}`">
    <img v-if="photoUrl" :src="photoUrl" :alt="name" />
    <span v-else :style="{ background: bgColor }">
      {{ initials ?? getInitials(name) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getInitials } from '../../utils/helpers'

const props = defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg'
  photoUrl?: string
  initials?: string
}>()

const COLORS = [
  'var(--galana-green)',
  'var(--galana-red)',
  'var(--color-info)',
  '#854F0B',
  '#993556',
  '#3C3489',
]

const bgColor = computed(() => {
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
})
</script>

<style scoped>
.avatar {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: inline-flex;
}
.avatar--sm  { width: 24px; height: 24px; font-size:  9px; }
.avatar--md  { width: 32px; height: 32px; font-size: 11px; }
.avatar--lg  { width: 40px; height: 40px; font-size: 14px; }

.avatar img  { width: 100%; height: 100%; object-fit: cover; }

.avatar span {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700;
  font-size: inherit;
}
</style>
