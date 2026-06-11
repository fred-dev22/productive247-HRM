<template>
  <div class="min-h-screen flex items-center justify-center bg-primary/10 max-[480px]:items-start max-[480px]:p-4">
    <div class="bg-card rounded-xl p-10 w-full max-w-[420px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] max-[480px]:p-6 max-[480px]:w-[90%] max-[480px]:my-4">

      <div class="flex justify-center mb-4">
        <img src="/galana.webp" alt="Productive 247" class="h-14 w-auto" />
      </div>

      <h1 class="text-[22px] font-bold text-foreground text-center mb-2">{{ t('login.title') }}</h1>
      <p class="text-[13px] text-muted-foreground text-center mb-6">{{ t('login.subtitle') }}</p>

      <div class="mb-4">
        <label for="userCode" :class="labelClass">{{ t('login.username') }}</label>
        <input
          id="userCode"
          v-model="userCode"
          type="text"
          placeholder="USER001"
          autocomplete="off"
          :class="inputClass"
        />
      </div>

      <div class="mb-4">
        <label for="password" :class="labelClass">{{ t('login.password') }}</label>
        <div class="relative">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            :class="[inputClass, 'pr-11']"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-muted-foreground flex items-center hover:text-foreground"
            @click="showPassword = !showPassword"
            tabindex="-1"
          >
            <EyeOff v-if="showPassword" class="w-[18px] h-[18px]" />
            <Eye v-else class="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <p v-if="error" class="text-xs text-danger bg-danger-bg px-3 py-2 rounded-md mb-3.5">{{ error }}</p>

      <button
        class="login-btn w-full h-12 bg-primary text-primary-foreground rounded-lg text-sm font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2 mb-5 hover:bg-primary/90"
        @click="handleLogin"
      >
        <ArrowRight class="w-[18px] h-[18px]" />
        {{ t('login.submit') }}
      </button>

      <!-- Sélecteur de rôle temporaire — sera supprimé en production -->
      <div class="mt-1">
        <label :class="[labelClass, 'mb-1.5']">
          {{ t('login.role_label') }}
          <span class="text-[9px] bg-warning-bg text-warning px-1.5 py-0.5 rounded ml-1.5">{{ t('login.dev_only') }}</span>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="role in ROLES" :key="role.value"
            :class="[roleOptClass, selectedRole === role.value && roleOptSelected]"
            @click="selectedRole = role.value"
          >
            <component :is="role.icon" class="w-[18px] h-[18px] mx-auto mb-1" />
            <div class="text-xs font-semibold mt-1">{{ role.label }}</div>
            <div class="text-[10px] mt-0.5 leading-[1.3]" :class="selectedRole === role.value ? 'text-primary/80' : 'text-muted-foreground'">{{ role.sub }}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff, ArrowRight, User, UserCheck, Briefcase, Crown } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import type { UserRole } from '../types'

const router   = useRouter()
const auth     = useAuthStore()
const { t }    = useI18n()

const userCode     = ref('')
const password     = ref('')
const showPassword = ref(false)
const selectedRole = ref<UserRole>('hr_admin')
const error        = ref('')

// ── Classes du design system ─────────────────────────────────
const labelClass = 'block text-[13px] font-medium text-foreground mb-1.5'
const inputClass = 'w-full h-12 px-3 border border-border rounded-lg text-sm bg-primary/10 text-foreground outline-none transition-colors focus:border-primary focus:bg-card'
const roleOptClass = 'p-2.5 border border-border rounded-md text-center cursor-pointer text-xs text-muted-foreground transition-colors'
const roleOptSelected = '!border-primary bg-primary/10 !text-primary font-medium'

const ROLES = [
  { value: 'employee' as UserRole,    icon: User,       label: 'Employé(e)',          sub: 'Espace personnel uniquement' },
  { value: 'validator' as UserRole,   icon: UserCheck,  label: 'Manager / Validateur', sub: 'Espace perso + validation équipe' },
  { value: 'hr_admin' as UserRole,    icon: Briefcase,  label: 'RH / Manager',         sub: 'Accès administration complet' },
  { value: 'hr_director' as UserRole, icon: Crown,      label: 'RH Directeur',         sub: 'Accès complet + approbations direction' },
]

function handleLogin() {
  if (!userCode.value || !password.value) {
    error.value = t('login.error_fields')
    return
  }
  error.value = ''
  auth.login(selectedRole.value, userCode.value)
  router.push(auth.isHRSide ? { name: 'hr-dashboard' } : { name: 'employee-dashboard' })
}
</script>
