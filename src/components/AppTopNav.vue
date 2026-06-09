<template>
  <!-- ── BARRE 1 : TopBar ── -->
  <div class="topbar">
    <div class="topbar-left">
      <span class="topbar-brand">{{ t('nav.app_name') }}</span>
    </div>
    <div class="topbar-right" v-if="!searchOpen">
      <div class="icon-btn search-btn" @click="openSearch" :title="t('topbar.search_placeholder')">
        <i class="ti ti-search"></i>
        <span class="kbd-badge">Ctrl+K</span>
      </div>
      <div class="icon-btn notif-btn" :title="t('topbar.notifications')" @click.stop="toggleDropdown('notif')">
        <i class="ti ti-bell"></i>
        <span v-if="notifStore.unreadCount > 0" class="notif-badge">{{ notifStore.unreadCount }}</span>
        <div v-if="activeDropdown === 'notif'" class="dropdown notif-dropdown" @click.stop>
          <div class="notif-header">
            <span class="notif-title">Notifications</span>
            <button v-if="notifStore.unreadCount > 0" class="notif-mark-all" @click="notifStore.markAllAsRead()">
              Tout marquer lu
            </button>
          </div>
          <div class="notif-list">
            <div
              v-for="n in notifStore.notifications"
              :key="n.id"
              class="notif-item"
              :class="{ 'notif-unread': !n.read }"
              @click="notifStore.markAsRead(n.id)"
            >
              <span class="notif-dot" :class="`notif-dot--${n.type}`"></span>
              <div class="notif-body">
                <div class="notif-item-title">{{ n.title }}</div>
                <div class="notif-item-msg">{{ n.message }}</div>
                <div class="notif-item-date">{{ n.date }}</div>
              </div>
            </div>
            <div v-if="notifStore.notifications.length === 0" class="notif-empty">
              Aucune notification
            </div>
          </div>
        </div>
      </div>
      <div class="icon-btn" :title="t('topbar.settings')">
        <i class="ti ti-settings"></i>
      </div>
      <div class="icon-btn" :title="t('topbar.help')">
        <i class="ti ti-help-circle"></i>
      </div>
      <!-- Langue -->
      <div class="icon-btn lang-btn" @click.stop="toggleDropdown('lang')" :title="t('topbar.language')">
        <i class="ti ti-world"></i>
        <span class="lang-text">{{ locale === 'fr' ? 'FR' : 'EN' }}</span>
        <div v-if="activeDropdown === 'lang'" class="dropdown">
          <div class="dropdown-item" :class="{ 'item-active': locale === 'fr' }" @click.stop="switchLanguage('fr')">
            <span>🇫🇷 Français</span><i v-if="locale === 'fr'" class="ti ti-check"></i>
          </div>
          <div class="dropdown-item" :class="{ 'item-active': locale === 'en' }" @click.stop="switchLanguage('en')">
            <span>🇬🇧 English</span><i v-if="locale === 'en'" class="ti ti-check"></i>
          </div>
        </div>
      </div>
      <!-- Avatar -->
      <div class="icon-btn avatar-btn" @click.stop="toggleDropdown('user')">
        <div class="avatar">{{ user?.initials }}</div>
        <div v-if="activeDropdown === 'user'" class="dropdown dropdown-user">
          <div class="user-header">
            <div class="user-name">{{ user?.name }}</div>
            <div class="user-email">{{ user?.email }}</div>
            <div class="user-role-chip">{{ roleLabel }}</div>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item item-danger" @click.stop="handleLogout">
            <i class="ti ti-logout"></i><span>{{ t('topbar.logout') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div v-if="searchOpen" class="search-area">
      <input ref="searchInput" class="search-field" type="text"
        :placeholder="t('topbar.search_placeholder')" v-model="searchQuery"
        @keydown.escape="closeSearch" />
      <div class="icon-btn" @click="closeSearch"><i class="ti ti-x"></i></div>
    </div>
  </div>

  <!-- ── BARRE 2 : NavBar ── -->
  <div class="navbar">
    <div class="navbar-left">
      <img src="/galana.webp" class="logo-img" alt="Logo" />
      <div class="nav-divider"></div>
      <span class="company-name">{{ t('nav.company') }}</span>
    </div>

    <!-- Items HR -->
    <div class="nav-items" v-if="auth.isHRSide && !isMobileMenuOpen">
      <div
        v-for="item in hrNavItems"
        :key="item.key"
        class="nav-item"
        :class="{ active: navStore.activeModule === item.key }"
        @click="handleHRNav(item.key)"
      >{{ item.label }}</div>
    </div>

    <!-- Items Employé / Validateur -->
    <div class="nav-items" v-if="auth.isEmployeeSide && !isMobileMenuOpen">
      <template v-for="item in empNavItems" :key="item.key">
        <router-link
          v-if="item.to"
          :to="item.to"
          class="nav-item"
          active-class="active"
        >
          {{ item.label }}
          <span v-if="item.badge && item.badge > 0" class="nav-badge">{{ item.badge }}</span>
        </router-link>
        <div v-else class="nav-item nav-item-disabled">{{ item.label }}</div>
      </template>
    </div>

    <div class="nav-context-area">
      <div class="nav-divider"></div>
      <span class="nav-context">{{ contextLabel }}</span>
    </div>

    <div class="icon-btn hamburger-btn" @click="isMobileMenuOpen = !isMobileMenuOpen">
      <i :class="isMobileMenuOpen ? 'ti ti-x' : 'ti ti-menu-2'"></i>
    </div>
  </div>

  <!-- Mobile overlay + menu -->
  <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="isMobileMenuOpen = false"></div>
  <div v-if="isMobileMenuOpen" class="mobile-menu">
    <template v-if="auth.isHRSide">
      <div v-for="item in hrNavItems" :key="item.key"
        class="nav-item-mobile" @click="handleHRNav(item.key); isMobileMenuOpen = false">
        {{ item.label }}
      </div>
    </template>
    <template v-else>
      <template v-for="item in empNavItems" :key="item.key">
        <router-link v-if="item.to" :to="item.to" class="nav-item-mobile" @click="isMobileMenuOpen = false">
          {{ item.label }}
        </router-link>
        <div v-else class="nav-item-mobile nav-item-disabled">{{ item.label }}</div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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

// ── HR nav items ──────────────────────────────────────────────
const hrNavItems = computed(() => [
  { key: 'administration', label: t('nav.admin') },
  { key: 'recrutement',    label: t('nav.recruitment') },
  { key: 'formation',      label: t('nav.training') },
  { key: 'paie',           label: t('nav.payroll') },
  { key: 'rapports',       label: t('nav.reports') },
])

function handleHRNav(key: string) {
  navStore.setModule(key)
  // Navigate to default page for this module
  const defaults: Record<string, string> = {
    administration: 'rh',
    recrutement:    'rh-recrutement',
    formation:      'rh-formation',
    paie:           'rh-paie',
    rapports:       'rh-rapports',
  }
  if (defaults[key]) router.push({ name: defaults[key] })
}

// ── Employee/Validator nav items ──────────────────────────────
const pendingCount = computed(() => absenceStore.pendingLeaves.length)

const empNavItems = computed(() => [
  { key: 'mon-espace', label: t('nav.my_space'), to: { name: 'employe' } },
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
const activeDropdown   = ref<'lang' | 'user' | 'notif' | null>(null)
const searchOpen       = ref(false)
const searchQuery      = ref('')
const isMobileMenuOpen = ref(false)
const searchInput      = ref<HTMLInputElement | null>(null)

function toggleDropdown(name: 'lang' | 'user' | 'notif') {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

function switchLanguage(lang: 'fr' | 'en') {
  locale.value = lang
  localStorage.setItem('p247-locale', lang)
  activeDropdown.value = null
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

<style scoped>
.topbar {
  background: var(--p247-topbar-bg); height: 44px; padding: 0 20px;
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.topbar-brand { color: var(--p247-topbar-text); font-weight: 600; font-size: 15px; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.icon-btn {
  width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; position: relative; flex-shrink: 0;
  color: #FFF; font-size: 20px; transition: background .12s; user-select: none;
}
.icon-btn:hover { background: rgba(255,255,255,0.08); }
.search-btn { width: auto; padding: 0 8px; margin-right: 6px; }
.kbd-badge  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); margin-left: 4px; }
.icon-btn.lang-btn, .icon-btn.avatar-btn { width: auto; padding: 0 6px; gap: 4px; }
.lang-text { color: #FFF; font-size: 12px; }
.notif-badge { position: absolute; top: -4px; right: -4px; background: var(--color-accent); color: white; font-size: 9px; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.notif-btn { position: relative; }
.notif-dropdown { min-width: 300px; max-width: 340px; padding: 0; overflow: hidden; }
.notif-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 8px; border-bottom: 0.5px solid var(--p247-border); }
.notif-title { font-size: 12px; font-weight: 700; color: var(--color-text); }
.notif-mark-all { background: none; border: none; font-size: 11px; color: var(--p247-orange); cursor: pointer; padding: 0; }
.notif-list { max-height: 320px; overflow-y: auto; }
.notif-item { display: flex; gap: 10px; padding: 10px 14px; border-bottom: 0.5px solid var(--p247-border); cursor: pointer; transition: background .1s; }
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--p247-bg); }
.notif-unread { background: var(--color-primary-light); }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.notif-dot--leave   { background: var(--color-primary); }
.notif-dot--mission { background: var(--color-info); }
.notif-dot--expense { background: var(--color-warning); }
.notif-dot--system  { background: var(--color-neutral); }
.notif-body { flex: 1; min-width: 0; }
.notif-item-title { font-size: 12px; font-weight: 600; color: var(--color-text); }
.notif-item-msg   { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-item-date  { font-size: 10px; color: var(--color-text-muted); margin-top: 3px; }
.notif-empty { padding: 20px; text-align: center; font-size: 12px; color: var(--color-text-muted); }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--p247-orange); color: white; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: white; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15); border: 0.5px solid var(--p247-border); min-width: 150px; z-index: 200; padding: 4px; }
.dropdown-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; font-size: 13px; border-radius: 6px; cursor: pointer; color: var(--p247-text); transition: background .1s; }
.dropdown-item:hover { background: var(--p247-bg); }
.item-active { color: var(--p247-orange); font-weight: 500; }
.dropdown-user { min-width: 220px; }
.user-header  { padding: 8px 12px; }
.user-name    { font-size: 13px; font-weight: 600; }
.user-email   { font-size: 11px; color: var(--p247-muted); margin-top: 2px; }
.user-role-chip { display: inline-block; margin-top: 5px; background: var(--p247-orange-light); color: var(--p247-orange); font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.dropdown-divider { height: 1px; background: var(--p247-border); margin: 4px 0; }
.item-danger:hover { color: var(--p247-danger); }
.item-danger { gap: 8px; justify-content: flex-start; }
.search-area  { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; }
.search-field { width: 240px; background: rgba(255,255,255,0.08); color: white; border: none; border-radius: 6px; padding: 6px 12px; font-size: 13px; outline: none; }
.search-field::placeholder { color: #666; }

/* NavBar */
.navbar { background: var(--p247-navbar-bg); height: 48px; padding: 0 20px; border-bottom: 1px solid var(--p247-navbar-border); box-shadow: 0 1px 3px rgba(0,0,0,.04); display: flex; align-items: center; flex-shrink: 0; }
.navbar-left { display: flex; align-items: center; flex-shrink: 0; }
.logo-img    { height: 28px; object-fit: contain; }
.nav-divider { width: 1px; height: 20px; background: rgba(0,0,0,.12); margin: 0 14px; flex-shrink: 0; }
.company-name { font-size: 15px; font-weight: 700; color: var(--color-text); letter-spacing: 0.05em; white-space: nowrap; }
.nav-items { display: flex; margin-left: auto; }
.nav-item {
  height: 48px; padding: 0 14px; display: flex; align-items: center; gap: 4px;
  font-size: 14px; font-weight: 500; color: var(--color-text-muted);
  border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap;
  transition: all .15s; user-select: none; text-decoration: none;
}
.nav-item:hover { color: var(--color-text); background: rgba(0,0,0,.03); }
.nav-item.active, .router-link-active.nav-item { color: var(--p247-orange); border-bottom-color: var(--p247-orange); font-weight: 600; }
.nav-item-disabled { opacity: 0.4; cursor: not-allowed; }
.nav-badge { background: var(--p247-orange); color: white; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 10px; }
.nav-context-area { display: flex; align-items: center; margin-left: auto; }
.nav-items + .nav-context-area { margin-left: 0; }
.nav-context { font-size: 11px; font-weight: 600; color: var(--p247-orange); letter-spacing: .04em; white-space: nowrap; }
.hamburger-btn { display: none; }

@media (max-width: 768px) {
  .kbd-badge, .nav-items, .nav-context, .nav-divider, .company-name { display: none; }
  .hamburger-btn { display: flex; color: var(--color-text-muted); }
  .hamburger-btn:hover { background: var(--p247-bg); }
  .nav-context-area { margin-left: auto; }
  .mobile-menu { position: fixed; top: 92px; left: 0; right: 0; background: white; border-bottom: 1px solid var(--p247-border); box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 150; padding: 8px 0; }
  .nav-item-mobile { display: flex; align-items: center; padding: 12px 20px; font-size: 14px; font-weight: 500; color: #333; cursor: pointer; border-bottom: 0.5px solid var(--p247-border); text-decoration: none; }
  .nav-item-mobile:hover { background: var(--p247-bg); color: var(--p247-orange); }
  .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.3); z-index: 140; }
}
@media (max-width: 480px) {
  .topbar { height: 40px; }
  .navbar { height: 44px; }
  .logo-img { height: 22px; }
}
</style>
