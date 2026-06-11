<template>
  <!-- ── BARRE 1 : TopBar ── -->
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

          <!-- Langue avec sous-menu -->
          <div :class="[dropdownItemClass, 'justify-between']" @click.stop="langOpen = !langOpen">
            <div class="flex items-center gap-2">
              <Globe class="w-4 h-4" /><span>{{ t('topbar.language') }}</span>
            </div>
            <span class="text-[11px] font-bold text-muted-foreground bg-background border border-border rounded px-1.5 py-px">
              {{ locale === 'fr' ? 'FR' : 'EN' }}
            </span>
          </div>
          <div v-if="langOpen" class="bg-background border-y border-border">
            <div
              :class="[submenuItemClass, locale === 'fr' && 'text-primary font-semibold']"
              @click.stop="switchLanguage('fr')"
            >
              <span>🇫🇷 Français</span><Check v-if="locale === 'fr'" class="w-3.5 h-3.5 text-primary" />
            </div>
            <div
              :class="[submenuItemClass, locale === 'en' && 'text-primary font-semibold']"
              @click.stop="switchLanguage('en')"
            >
              <span>🇬🇧 English</span><Check v-if="locale === 'en'" class="w-3.5 h-3.5 text-primary" />
            </div>
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

  <!-- ── BARRE 2 : NavBar ── -->
  <div class="bg-nav h-12 px-5 border-b border-black/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center shrink-0">
    <div class="flex items-center shrink-0">
      <img src="/galana.webp" class="h-7 object-contain" alt="Logo" />
      <div :class="[navDividerClass, 'hidden md:block']"></div>
      <span class="hidden md:block text-[15px] font-bold text-foreground tracking-[0.05em] whitespace-nowrap">{{ t('nav.company') }}</span>
    </div>

    <!-- Items HR -->
    <div class="ml-auto hidden md:flex" v-if="auth.isHRSide && !isMobileMenuOpen">
      <div
        v-for="item in hrNavItems"
        :key="item.key"
        :class="[navItemClass, navStore.activeModule === item.key && navItemActiveClass]"
        @click="handleHRNav(item.key)"
      >{{ item.label }}</div>
    </div>

    <!-- Items Employé / Validateur -->
    <div class="ml-auto hidden md:flex" v-if="auth.isEmployeeSide && !isMobileMenuOpen">
      <template v-for="item in empNavItems" :key="item.key">
        <router-link
          v-if="item.to"
          :to="item.to"
          :class="navItemClass"
          :active-class="navItemActiveClass"
        >
          {{ item.label }}
          <span v-if="item.badge && item.badge > 0" class="bg-primary text-white text-[9px] font-bold px-[5px] py-px rounded-full">{{ item.badge }}</span>
        </router-link>
        <div v-else :class="[navItemClass, 'opacity-40 cursor-not-allowed']">{{ item.label }}</div>
      </template>
    </div>

    <div class="flex items-center ml-auto md:ml-0">
      <div :class="[navDividerClass, 'hidden md:block']"></div>
      <span class="hidden md:block text-[11px] font-semibold text-primary tracking-[0.04em] whitespace-nowrap">{{ contextLabel }}</span>
    </div>

    <button
      class="w-8 h-8 rounded-md items-center justify-center cursor-pointer text-muted-foreground transition-colors hover:bg-background flex md:hidden ml-2"
      @click="isMobileMenuOpen = !isMobileMenuOpen"
    >
      <X v-if="isMobileMenuOpen" class="w-5 h-5" />
      <Menu v-else class="w-5 h-5" />
    </button>
  </div>

  <!-- Mobile overlay + menu -->
  <div v-if="isMobileMenuOpen" class="fixed inset-0 bg-black/30 z-[140] md:hidden" @click="isMobileMenuOpen = false"></div>
  <div v-if="isMobileMenuOpen" class="fixed top-[92px] inset-x-0 bg-white border-b border-border shadow-lg z-[150] py-2 md:hidden">
    <template v-if="auth.isHRSide">
      <div v-for="item in hrNavItems" :key="item.key"
        :class="mobileItemClass" @click="handleHRNav(item.key); isMobileMenuOpen = false">
        {{ item.label }}
      </div>
    </template>
    <template v-else>
      <template v-for="item in empNavItems" :key="item.key">
        <router-link v-if="item.to" :to="item.to" :class="mobileItemClass" @click="isMobileMenuOpen = false">
          {{ item.label }}
        </router-link>
        <div v-else :class="[mobileItemClass, 'opacity-40 cursor-not-allowed']">{{ item.label }}</div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Search, Bell, Settings, HelpCircle, CircleUser, Globe, Check, LogOut, X, Menu,
} from 'lucide-vue-next'
import UserAvatar               from './ui/UserAvatar.vue'
import { useAuthStore }          from '../stores/auth'
import { useNavigationStore }    from '../stores/navigation'
import { useAbsenceStore }       from '../stores/absences'
import { useNotificationStore }  from '../stores/notifications'
import type { AuthUser } from '../types'

defineProps<{ user: AuthUser | null }>()

const router       = useRouter()
const auth         = useAuthStore()
const navStore     = useNavigationStore()
const absenceStore = useAbsenceStore()
const notifStore   = useNotificationStore()
const { t, locale } = useI18n()

// ── Classes partagées (design system) ─────────────────────────
const iconBtnClass =
  'w-8 h-8 rounded-md flex items-center justify-center cursor-pointer relative shrink-0 text-white transition-colors hover:bg-white/10 select-none'
const dropdownClass =
  'absolute top-[calc(100%+8px)] right-0 bg-popover text-popover-foreground rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.16)] border border-border min-w-[150px] z-[200] p-1 overflow-hidden cursor-default text-left'
const dropdownItemClass =
  'flex items-center gap-2 px-4 py-[9px] text-[13px] cursor-pointer text-foreground transition-colors hover:bg-primary/10 hover:text-primary'
const submenuItemClass =
  'flex items-center justify-between px-6 py-[7px] text-xs cursor-pointer text-foreground transition-colors hover:bg-primary/10 hover:text-primary'
const navDividerClass = 'w-px h-5 bg-black/10 mx-3.5 shrink-0'
const navItemClass =
  'h-12 px-3.5 flex items-center gap-1 text-sm font-medium text-muted-foreground border-b-2 border-transparent cursor-pointer whitespace-nowrap transition-all select-none no-underline hover:text-foreground hover:bg-black/[0.03]'
const navItemActiveClass = 'text-primary border-primary font-semibold'
const mobileItemClass =
  'flex items-center px-5 py-3 text-sm font-medium text-foreground/80 cursor-pointer border-b border-border last:border-0 no-underline hover:bg-background hover:text-primary'

const NOTIF_DOT: Record<string, string> = {
  leave:   'bg-primary',
  mission: 'bg-info',
  expense: 'bg-warning',
  system:  'bg-neutral',
}

// ── HR nav items ──────────────────────────────────────────────
const hrNavItems = computed(() => [
  { key: 'administration', label: t('nav.admin') },
  { key: 'recruitment',    label: t('nav.recruitment') },
  { key: 'training',       label: t('nav.training') },
  { key: 'payroll',        label: t('nav.payroll') },
  { key: 'reports',        label: t('nav.reports') },
])

function handleHRNav(key: string) {
  navStore.setModule(key)
  const defaults: Record<string, string> = {
    administration: 'hr-dashboard',
    recruitment:    'hr-recruitment',
    training:       'hr-training',
    payroll:        'hr-payroll',
    reports:        'hr-reports',
  }
  if (defaults[key]) router.push({ name: defaults[key] })
}

// ── Employee/Validator nav items ──────────────────────────────
interface NavItem { key: string; label: string; to?: { name: string }; badge?: number }

const pendingCount = computed(() => absenceStore.pendingLeaves.length)

const empNavItems = computed<NavItem[]>(() => [
  { key: 'my-space', label: t('nav.my_space'), to: { name: 'employee-dashboard' } },
])

// ── Context text ──────────────────────────────────────────────
const roleLabel = computed(() => {
  const map: Record<string, string> = {
    hr_admin:    'RH Administrateur',
    hr_director: 'RH Directeur',
    validator:   'Manager / Validateur',
    employee:    'Employé',
  }
  return map[auth.role ?? ''] ?? ''
})

const contextLabel = computed(() => {
  if (auth.isHRDirector) return 'DIRECTEUR RH · GALANA'
  if (auth.isHRAdmin)    return t('nav.context_rh')
  if (auth.isValidator)  return 'MANAGER · GALANA'
  return t('nav.context_employee')
})

// ── Dropdowns / Search ────────────────────────────────────────
const activeDropdown   = ref<'user' | 'notif' | null>(null)
const langOpen         = ref(false)
const searchOpen       = ref(false)
const searchQuery      = ref('')
const isMobileMenuOpen = ref(false)
const searchInput      = ref<HTMLInputElement | null>(null)

function toggleDropdown(name: 'user' | 'notif') {
  if (activeDropdown.value === name) {
    activeDropdown.value = null
    langOpen.value = false
  } else {
    activeDropdown.value = name
    langOpen.value = false
  }
}

function switchLanguage(lang: 'fr' | 'en') {
  locale.value = lang
  localStorage.setItem('p247-locale', lang)
  langOpen.value = false
}

function goToProfile() {
  activeDropdown.value = null
  router.push(auth.isHRSide ? { name: 'hr-profile' } : { name: 'employee-profile' })
}

async function openSearch() {
  searchOpen.value = true; await nextTick(); searchInput.value?.focus()
}
function closeSearch() { searchOpen.value = false; searchQuery.value = '' }

function handleLogout() {
  activeDropdown.value = null; auth.logout(); router.push({ name: 'login' })
}

function onDocClick()              { activeDropdown.value = null; langOpen.value = false }
function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'k') { e.preventDefault(); openSearch() }
  if (e.key === 'Escape')         { closeSearch(); activeDropdown.value = null }
}

onMounted(() => { document.addEventListener('click', onDocClick); document.addEventListener('keydown', onKeydown) })
onUnmounted(() => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKeydown) })
</script>
