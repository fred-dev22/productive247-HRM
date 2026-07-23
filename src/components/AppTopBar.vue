<template>
  <!-- ── BARRE 1 : TopBar (sombre) ── -->
  <div class="bg-header text-header-foreground h-11 px-5 flex items-center justify-between shrink-0 relative z-60">
    <div class="flex items-center">
      <span class="text-[15px] font-semibold">{{ t('nav.app_name') }}</span>
    </div>
    <div class="flex items-center gap-2.5" v-if="!searchOpen">
      <button
        :class="[iconBtnClass, 'w-auto px-2 mr-1.5 gap-2 group']"
        @click="openSearch"
        :title="t('topbar.search_placeholder')"
      >
        <Search class="w-4 h-4" />
        <span class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white/10 rounded border border-white/20 group-hover:border-white/30">
          Ctrl+K
        </span>
      </button>
      <div :class="iconBtnClass" :title="t('topbar.notifications')" @click.stop="toggleDropdown('notif')">
        <Bell class="w-4 h-4" />
        <span
          v-if="notifStore.unreadCount > 0"
          class="absolute -top-1 -right-1 bg-destructive text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold"
        >{{ notifStore.unreadCount }}</span>
        <div
          v-if="activeDropdown === 'notif'"
          :class="[dropdownClass, 'min-w-[300px] max-w-[340px] p-0']"
          @click.stop
        >
          <div class="flex items-center justify-between px-3.5 pt-2.5 pb-2 border-b border-border">
            <span class="text-xs font-bold text-foreground">Notifications</span>
            <button
              v-if="notifStore.unreadCount > 0"
              class="text-[11px] text-primary cursor-pointer"
              @click="notifStore.markAllAsRead()"
            >
              Tout marquer lu
            </button>
          </div>
          <div class="max-h-80 overflow-y-auto">
            <div
              v-for="n in notifStore.notifications"
              :key="n.id"
              class="flex gap-2.5 px-3.5 py-2.5 border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-background"
              :class="{ 'bg-primary/10': !n.read }"
              @click="notifStore.markAsRead(n.id)"
            >
              <span class="w-2 h-2 rounded-full shrink-0 mt-1" :class="NOTIF_DOT[n.type] ?? NOTIF_DOT.system"></span>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-foreground">{{ n.title }}</div>
                <div class="text-[11px] text-muted-foreground mt-0.5 truncate">{{ n.message }}</div>
                <div class="text-[10px] text-muted-foreground mt-[3px]">{{ n.date }}</div>
              </div>
            </div>
            <div v-if="notifStore.notifications.length === 0" class="p-5 text-center text-xs text-muted-foreground">
              Aucune notification
            </div>
          </div>
        </div>
      </div>
      <button :class="iconBtnClass" :title="t('topbar.settings')">
        <Settings class="w-4 h-4" />
      </button>
      <button :class="iconBtnClass" :title="t('topbar.help')">
        <HelpCircle class="w-4 h-4" />
      </button>
      <!-- Avatar + menu utilisateur -->
      <div :class="[iconBtnClass, 'w-auto px-1.5 gap-1']" @click.stop="toggleDropdown('user')">
        <UserAvatar :name="user?.name ?? '?'" size="md" />
        <div v-if="activeDropdown === 'user'" :class="[dropdownClass, 'min-w-60 p-0']" @click.stop>

          <!-- En-tête -->
          <div class="flex items-center gap-2.5 px-4 py-3 bg-background border-b border-border">
            <UserAvatar :name="user?.name ?? '?'" size="lg" />
            <div class="min-w-0">
              <div class="text-[13px] font-bold text-foreground truncate">{{ user?.name }}</div>
              <div class="text-[11px] text-muted-foreground mt-0.5 truncate">{{ roleLabel }} · {{ user?.entityName }}</div>
            </div>
          </div>

          <!-- Items principaux -->
          <div :class="dropdownItemClass" @click.stop="goToProfile">
            <CircleUser class="w-4 h-4" /><span>Mon profil</span>
          </div>

          <div class="h-px bg-border my-1"></div>

          <!-- Déconnexion -->
          <div
            class="flex items-center gap-2 px-4 py-[9px] text-[13px] cursor-pointer text-foreground transition-colors hover:bg-danger-bg hover:text-danger"
            @click.stop="handleLogout"
          >
            <LogOut class="w-4 h-4" /><span>{{ t('topbar.logout') }}</span>
          </div>

        </div>
      </div>
    </div>

    <!-- Search -->
    <div v-if="searchOpen" class="flex items-center gap-2 flex-1 justify-end">
      <input
        ref="searchInput"
        class="w-60 bg-white/10 text-white rounded-md px-3 py-1.5 text-[13px] outline-none placeholder:text-gray-500"
        type="text"
        :placeholder="t('topbar.search_placeholder')"
        v-model="searchQuery"
        @keydown.escape="closeSearch"
      />
      <button :class="iconBtnClass" @click="closeSearch"><X class="w-4 h-4" /></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, Bell, Settings, HelpCircle, CircleUser, LogOut, X } from 'lucide-vue-next'
import UserAvatar from './ui/UserAvatar.vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import type { AuthUser } from '../types'

defineProps<{ user: AuthUser | null }>()

const router       = useRouter()
const auth         = useAuthStore()
const notifStore   = useNotificationStore()
const { t } = useI18n()

const iconBtnClass =
  'w-8 h-8 rounded-md flex items-center justify-center cursor-pointer relative shrink-0 text-white transition-colors hover:bg-white/10 select-none'
const dropdownClass =
  'absolute top-[calc(100%+8px)] right-0 bg-popover text-popover-foreground rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.16)] border border-border min-w-[150px] z-[200] p-1 overflow-hidden cursor-default text-left'
const dropdownItemClass =
  'flex items-center gap-2 px-4 py-[9px] text-[13px] cursor-pointer text-foreground transition-colors hover:bg-primary/10 hover:text-primary'

const NOTIF_DOT: Record<string, string> = {
  leave:   'bg-primary',
  mission: 'bg-info',
  expense: 'bg-warning',
  system:  'bg-neutral',
}

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    hr_admin:    'RH Administrateur',
    hr_director: 'RH Directeur',
    validator:   'Manager / Validateur',
    employee:    'Employé',
  }
  return map[auth.role ?? ''] ?? ''
})

const activeDropdown = ref<'user' | 'notif' | null>(null)
const searchOpen     = ref(false)
const searchQuery    = ref('')
const searchInput    = ref<HTMLInputElement | null>(null)

function toggleDropdown(name: 'user' | 'notif') {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

function goToProfile() {
  activeDropdown.value = null
  router.push(auth.isHRSpace ? { name: 'hr-profile' } : { name: 'employee-profile' })
}

async function openSearch() {
  searchOpen.value = true; await nextTick(); searchInput.value?.focus()
}
function closeSearch() { searchOpen.value = false; searchQuery.value = '' }

function handleLogout() {
  activeDropdown.value = null; auth.logout(); router.push({ name: 'login' })
}

function onDocClick()              { activeDropdown.value = null }
function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'k') { e.preventDefault(); openSearch() }
  if (e.key === 'Escape')         { closeSearch(); activeDropdown.value = null }
}

onMounted(() => { document.addEventListener('click', onDocClick); document.addEventListener('keydown', onKeydown) })
onUnmounted(() => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKeydown) })
</script>
