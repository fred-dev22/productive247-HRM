<template>
  <!-- ── BARRE 2 : NavBar (blanche) ── -->
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, Menu } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'
import { useAbsenceStore } from '../stores/absences'

const router       = useRouter()
const auth         = useAuthStore()
const navStore     = useNavigationStore()
const absenceStore = useAbsenceStore()
const { t }        = useI18n()

const navDividerClass = 'w-px h-5 bg-black/10 mx-3.5 shrink-0'
const navItemClass =
  'h-12 px-3.5 flex items-center gap-1 text-sm font-medium text-muted-foreground border-b-2 border-transparent cursor-pointer whitespace-nowrap transition-all select-none no-underline hover:text-foreground hover:bg-black/[0.03]'
const navItemActiveClass = 'text-primary border-primary font-semibold'
const mobileItemClass =
  'flex items-center px-5 py-3 text-sm font-medium text-foreground/80 cursor-pointer border-b border-border last:border-0 no-underline hover:bg-background hover:text-primary'

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

interface NavItem { key: string; label: string; to?: { name: string }; badge?: number }

const pendingCount = computed(() => absenceStore.pendingLeaves.length)

const empNavItems = computed<NavItem[]>(() => [
  { key: 'my-space', label: t('nav.my_space'), to: { name: 'employee-dashboard' }, badge: pendingCount.value },
])

const contextLabel = computed(() => {
  if (auth.isHRDirector) return 'DIRECTEUR RH · GALANA'
  if (auth.isHRAdmin)    return t('nav.context_rh')
  if (auth.isValidator)  return 'MANAGER · GALANA'
  return t('nav.context_employee')
})

const isMobileMenuOpen = ref(false)
</script>
