<template>
  <div class="login-screen">
    <div class="login-card">

      <div class="login-logo">
        <img src="/galana.webp" alt="Productive 247" class="logo-img" />
      </div>

      <h1 class="login-title">{{ t('login.title') }}</h1>
      <p class="login-subtitle">{{ t('login.subtitle') }}</p>

      <div class="field">
        <label for="userCode">{{ t('login.username') }}</label>
        <input
          id="userCode"
          v-model="userCode"
          type="text"
          placeholder="USER001"
          autocomplete="off"
        />
      </div>

      <div class="field">
        <label for="password">{{ t('login.password') }}</label>
        <div class="input-wrapper">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
          />
          <button type="button" class="eye-toggle" @click="showPassword = !showPassword" tabindex="-1">
            <i :class="showPassword ? 'ti ti-eye-off' : 'ti ti-eye'" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button class="login-btn" @click="handleLogin">
        <i class="ti ti-arrow-right" aria-hidden="true"></i>
        {{ t('login.submit') }}
      </button>

      <!-- Sélecteur de rôle temporaire — sera supprimé en production -->
      <div class="field dev-field">
        <label>
          {{ t('login.role_label') }}
          <span class="dev-badge">{{ t('login.dev_only') }}</span>
        </label>
        <div class="role-row">
          <div
            class="role-opt"
            :class="{ selected: selectedRole === 'rh' }"
            @click="selectedRole = 'rh'"
          >
            <i class="ti ti-briefcase" aria-hidden="true"></i>
            {{ t('login.role_rh') }}
          </div>
          <div
            class="role-opt"
            :class="{ selected: selectedRole === 'employee' }"
            @click="selectedRole = 'employee'"
          >
            <i class="ti ti-user" aria-hidden="true"></i>
            {{ t('login.role_employee') }}
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
import { useAuthStore } from '../stores/auth'
import type { UserRole } from '../types'

const router   = useRouter()
const auth     = useAuthStore()
const { t }    = useI18n()

const userCode     = ref('')
const password     = ref('')
const showPassword = ref(false)
const selectedRole = ref<UserRole>('rh')
const error        = ref('')

function handleLogin() {
  if (!userCode.value || !password.value) {
    error.value = t('login.error_fields')
    return
  }
  error.value = ''
  auth.login(selectedRole.value, userCode.value)
  router.push(selectedRole.value === 'rh' ? { name: 'rh' } : { name: 'employe' })
}
</script>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FAF1EF;
}

.login-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-img {
  height: 60px;
  width: auto;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #1A1A18;
  text-align: center;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 13px;
  color: #6B6B68;
  text-align: center;
  margin-bottom: 24px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1A1A18;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  border: 1px solid #E0D8D6;
  border-radius: 8px;
  font-size: 14px;
  background: #FAF1EF;
  color: var(--p247-text);
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  box-sizing: border-box;
}

.field input:focus {
  border-color: #FE5E00;
  background: #ffffff;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  padding-right: 44px;
}

.eye-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6B6B68;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 18px;
}

.eye-toggle:hover {
  color: #1A1A18;
}

.error-msg {
  font-size: 12px;
  color: var(--p247-danger);
  background: var(--p247-danger-bg);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 14px;
}

.login-btn {
  width: 100%;
  height: 48px;
  background: #FE5E00;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.login-btn i {
  font-size: 18px;
}

.login-btn:hover {
  background: #D94E00;
}

.dev-field {
  margin-top: 4px;
}

.dev-badge {
  font-size: 9px;
  background: var(--p247-warning-bg);
  color: var(--p247-warning);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
}

.role-row {
  display: flex;
  gap: 8px;
}

.role-opt {
  flex: 1;
  padding: 10px 8px;
  border: 0.5px solid var(--p247-border);
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  font-size: 12px;
  color: var(--p247-muted);
  transition: all 0.12s;
}

.role-opt i {
  display: block;
  font-size: 18px;
  margin-bottom: 4px;
}

.role-opt.selected {
  border-color: var(--p247-orange);
  background: var(--p247-orange-light);
  color: var(--p247-orange);
  font-weight: 500;
}

@media (max-width: 480px) {
  .login-screen {
    align-items: flex-start;
    padding: 16px;
  }

  .login-card {
    padding: 24px;
    width: 90%;
    margin: 16px auto;
  }
}
</style>
