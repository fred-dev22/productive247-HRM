<template>
  <!-- ── BARRE 1 : TopBar ── -->
  <div class="topbar">
    <div class="topbar-left">
      <span class="topbar-brand">{{ t('nav.app_name') }}</span>
    </div>
    <div class="topbar-right" v-if="!searchOpen">
      <!-- Recherche -->
      <div class="icon-btn search-btn" @click="openSearch" :title="t('topbar.search_placeholder')">
        <i class="ti ti-search"></i>
        <span class="kbd-badge">Ctrl+K</span>
      </div>
      <!-- Notifications -->
      <div class="icon-btn" title="Notifications">
        <i class="ti ti-bell"></i>
        <span class="notif-badge">3</span>
      </div>
      <!-- Paramètres -->
      <div class="icon-btn" title="Paramètres">
        <i class="ti ti-settings"></i>
      </div>
      <!-- Aide -->
      <div class="icon-btn" title="Aide">
        <i class="ti ti-help-circle"></i>
      </div>
      <!-- Langue -->
      <div class="icon-btn lang-btn" @click.stop="toggleDropdown('lang')" :title="t('topbar.language')">
        <i class="ti ti-world"></i>
        <span class="lang-text">{{ locale === 'fr' ? 'FR' : 'EN' }}</span>
        <div v-if="activeDropdown === 'lang'" class="dropdown">
          <div
            class="dropdown-item"
            :class="{ 'item-active': locale === 'fr' }"
            @click.stop="switchLanguage('fr')"
          >
            <span>🇫🇷 Français</span>
            <i v-if="locale === 'fr'" class="ti ti-check"></i>
          </div>
          <div
            class="dropdown-item"
            :class="{ 'item-active': locale === 'en' }"
            @click.stop="switchLanguage('en')"
          >
            <span>🇬🇧 English</span>
            <i v-if="locale === 'en'" class="ti ti-check"></i>
          </div>
        </div>
      </div>
      <!-- Avatar -->
      <div class="icon-btn avatar-btn" @click.stop="toggleDropdown('user')" title="Mon compte">
        <div class="avatar">{{ user?.initials }}</div>
        <div v-if="activeDropdown === 'user'" class="dropdown dropdown-user">
          <div class="user-header">
            <div class="user-name">{{ user?.name }}</div>
            <div class="user-email">{{ user?.email }}</div>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item item-danger" @click.stop="handleLogout">
            <i class="ti ti-logout"></i>
            <span>{{ t('topbar.logout') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search input (replaces right side) -->
    <div v-if="searchOpen" class="search-area">
      <input
        ref="searchInput"
        class="search-field"
        type="text"
        :placeholder="t('topbar.search_placeholder')"
        v-model="searchQuery"
        @keydown.escape="closeSearch"
      />
      <div class="icon-btn" @click="closeSearch">
        <i class="ti ti-x"></i>
      </div>
    </div>
  </div>

  <!-- ── BARRE 2 : NavBar ── -->
  <div class="navbar">
    <div class="navbar-left">
      <img src="/galana.webp" class="logo-img" alt="Logo" />
      <div class="nav-divider"></div>
      <span class="company-name">{{ t('nav.company') }}</span>
    </div>

    <div class="nav-items" v-if="!isMobileMenuOpen">
      <template v-if="role === 'rh'">
        <div
          v-for="item in rhItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeNav === item.key }"
          @click="activeNav = item.key"
        >
          {{ item.label }}
          <i class="ti ti-chevron-down nav-chevron"></i>
        </div>
      </template>
      <template v-else>
        <div
          v-for="item in empItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeNav === item.key }"
          @click="activeNav = item.key"
        >
          {{ item.label }}
          <i class="ti ti-chevron-down nav-chevron"></i>
        </div>
      </template>
    </div>

    <div class="nav-context-area">
      <div class="nav-divider"></div>
      <span class="nav-context">{{ role === 'rh' ? t('nav.context_rh') : t('nav.context_employee') }}</span>
    </div>

    <!-- Hamburger (mobile only) -->
    <div class="icon-btn hamburger-btn" @click="isMobileMenuOpen = !isMobileMenuOpen">
      <i :class="isMobileMenuOpen ? 'ti ti-x' : 'ti ti-menu-2'"></i>
    </div>
  </div>

  <!-- Mobile overlay -->
  <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="isMobileMenuOpen = false"></div>

  <!-- Mobile menu -->
  <div v-if="isMobileMenuOpen" class="mobile-menu">
    <template v-if="role === 'rh'">
      <div
        v-for="item in rhItems"
        :key="item.key"
        class="nav-item-mobile"
        @click="activeNav = item.key; isMobileMenuOpen = false"
      >
        {{ item.label }}
      </div>
    </template>
    <template v-else>
      <div
        v-for="item in empItems"
        :key="item.key"
        class="nav-item-mobile"
        @click="activeNav = item.key; isMobileMenuOpen = false"
      >
        {{ item.label }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import type { AuthUser } from '../types'

const props = defineProps<{ user: AuthUser | null }>()

const router      = useRouter()
const auth        = useAuthStore()
const { t, locale } = useI18n()

const role = ref(auth.role)

// ── Nav items (computed → réactifs au changement de langue) ──
const rhItems = computed(() => [
  { key: 'admin',       label: t('nav.admin') },
  { key: 'recruitment', label: t('nav.recruitment') },
  { key: 'training',    label: t('nav.training') },
  { key: 'payroll',     label: t('nav.payroll') },
  { key: 'reports',     label: t('nav.reports') },
])
const empItems = computed(() => [
  { key: 'my_space',     label: t('nav.my_space') },
  { key: 'my_absences',  label: t('nav.my_absences') },
  { key: 'my_missions',  label: t('nav.my_missions') },
  { key: 'my_documents', label: t('nav.my_documents') },
])

const activeNav        = ref(role.value === 'rh' ? 'admin' : 'my_space')
const activeDropdown   = ref<'lang' | 'user' | null>(null)
const searchOpen       = ref(false)
const searchQuery      = ref('')
const isMobileMenuOpen = ref(false)
const searchInput      = ref<HTMLInputElement | null>(null)

function toggleDropdown(name: 'lang' | 'user') {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

function switchLanguage(lang: 'fr' | 'en') {
  locale.value = lang
  localStorage.setItem('p247-locale', lang)
  activeDropdown.value = null
}

async function openSearch() {
  searchOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

function closeSearch() {
  searchOpen.value = false
  searchQuery.value = ''
}

function handleLogout() {
  activeDropdown.value = null
  auth.logout()
  router.push({ name: 'login' })
}

function onDocClick() {
  activeDropdown.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault()
    openSearch()
  }
  if (e.key === 'Escape') {
    closeSearch()
    activeDropdown.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* ── TopBar ── */
.topbar {
  background: var(--p247-topbar-bg);
  height: 44px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.topbar-brand {
  color: var(--p247-topbar-text);
  font-weight: 600;
  font-size: 15px;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  color: #FFFFFF;
  font-size: 20px;
  transition: background 0.12s;
  user-select: none;
}
.icon-btn:hover { background: #2A2A2A; }

/* Search button avec badge Ctrl+K */
.search-btn {
  width: auto;
  padding: 0 8px;
  margin-right: 6px;
}
.kbd-badge {
  background: #2A2A2A;
  color: #CCCCCC;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #555;
  margin-left: 4px;
  white-space: nowrap;
}
.icon-btn.lang-btn,
.icon-btn.avatar-btn {
  width: auto;
  padding: 0 6px;
  gap: 4px;
}
.lang-text {
  color: #FFFFFF;
  font-size: 12px;
}

/* Notifications badge */
.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #E53E3E;
  color: white;
  font-size: 9px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

/* Avatar */
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--p247-orange);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border: 0.5px solid var(--p247-border);
  min-width: 150px;
  z-index: 200;
  padding: 4px;
}
.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--p247-text);
  transition: background 0.1s;
}
.dropdown-item:hover { background: var(--p247-bg); }
.item-active {
  color: var(--p247-orange);
  font-weight: 500;
}
.dropdown-user { min-width: 200px; }
.user-header { padding: 8px 12px; }
.user-name  { font-size: 13px; font-weight: 600; color: var(--p247-text); }
.user-email { font-size: 11px; color: var(--p247-muted); margin-top: 2px; }
.dropdown-divider { height: 1px; background: var(--p247-border); margin: 4px 0; }
.item-danger:hover { color: var(--p247-danger); }
.item-danger { gap: 8px; justify-content: flex-start; }

/* Search area */
.search-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}
.search-field {
  width: 240px;
  background: #2A2A2A;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  outline: none;
  transition: opacity 0.2s;
}
.search-field::placeholder { color: #666; }

/* ── NavBar ── */
.navbar {
  background: var(--p247-navbar-bg);
  height: 48px;
  padding: 0 20px;
  border-bottom: 1px solid var(--p247-navbar-border);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.navbar-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.logo-img {
  height: 38px;
  object-fit: contain;
  filter: brightness(1.15) contrast(1.1) saturate(1.2);
}
.nav-divider {
  width: 1px;
  height: 20px;
  background: rgba(0,0,0,0.12);
  margin: 0 14px;
  flex-shrink: 0;
}
.company-name {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A1A;
  white-space: nowrap;
}
.nav-items {
  display: flex;
  margin-left: auto;
}
.nav-item {
  height: 48px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  user-select: none;
}
.nav-item:hover { color: #1A1A1A; background: rgba(0,0,0,0.03); }
.nav-item.active {
  color: var(--p247-orange);
  border-bottom-color: var(--p247-orange);
  font-weight: 600;
}
.nav-chevron { font-size: 11px; opacity: 0.5; }

.nav-context-area {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.nav-items + .nav-context-area {
  margin-left: 0;
}
.nav-context {
  font-size: 11px;
  font-weight: 600;
  color: var(--p247-orange);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* Hamburger — hidden by default */
.hamburger-btn { display: none; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .kbd-badge    { display: none; }
  .nav-items    { display: none; }
  .nav-context  { display: none; }
  .nav-divider  { display: none; }
  .company-name { display: none; }
  .hamburger-btn { display: flex; color: #555; }
  .hamburger-btn:hover { background: var(--p247-bg); }
  .nav-context-area { margin-left: auto; }

  .mobile-menu {
    position: fixed;
    top: 92px;
    left: 0; right: 0;
    background: white;
    border-bottom: 1px solid var(--p247-border);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    z-index: 150;
    padding: 8px 0;
  }
  .nav-item-mobile {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    border-bottom: 0.5px solid var(--p247-border);
  }
  .nav-item-mobile:hover {
    background: var(--p247-bg);
    color: var(--p247-orange);
  }
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 140;
  }
}

@media (max-width: 480px) {
  .topbar  { height: 40px; }
  .navbar  { height: 44px; }
  .logo-img { height: 22px; }
}
</style>
