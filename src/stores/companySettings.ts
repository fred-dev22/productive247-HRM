import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, getApiErrorMessage } from '../lib/api'
import { withToast } from '../lib/withToast'

export interface CompanySettings {
  id: string
  companyName: string
  currency: string
  timezone: string
  dayCountingRule: 'WorkingDays' | 'CalendarDays'
  defaultMonthlyAccrualRate: number
  defaultCarryOverCap: number
  leaveAccrualRunDay: number | null
  lastLeaveAccrualRunAt: string | null
  isOnboarded: boolean
}

interface BackendCompanySettings {
  Id: string
  CompanyName: string
  Currency: string
  Timezone: string
  DayCountingRule: 'WorkingDays' | 'CalendarDays'
  DefaultMonthlyAccrualRate: string | number
  DefaultCarryOverCap: number
  LeaveAccrualRunDay: number | null
  LastLeaveAccrualRunAt: string | null
  IsOnboarded: boolean
}

function mapSettings(raw: BackendCompanySettings): CompanySettings {
  return {
    id: raw.Id,
    companyName: raw.CompanyName,
    currency: raw.Currency,
    timezone: raw.Timezone,
    dayCountingRule: raw.DayCountingRule,
    defaultMonthlyAccrualRate: Number(raw.DefaultMonthlyAccrualRate),
    defaultCarryOverCap: raw.DefaultCarryOverCap,
    leaveAccrualRunDay: raw.LeaveAccrualRunDay,
    lastLeaveAccrualRunAt: raw.LastLeaveAccrualRunAt,
    isOnboarded: raw.IsOnboarded,
  }
}

export const useCompanySettingsStore = defineStore('companySettings', () => {
  const settings = ref<CompanySettings | null>(null)
  // null = pas encore vérifié, true/false = statut connu — le routeur attend
  // cet état avant de décider s'il affiche l'onboarding.
  const isOnboarded = ref<boolean | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSettings() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendCompanySettings>('/company-settings')
      settings.value = mapSettings(data)
      isOnboarded.value = data.IsOnboarded
      return settings.value
    } catch (err) {
      // 404 = paramètres jamais initialisés = onboarding jamais complété.
      isOnboarded.value = false
      settings.value = null
      error.value = getApiErrorMessage(err, "Impossible de charger les paramètres de l'entreprise")
      throw err
    } finally {
      loading.value = false
    }
  }

  async function completeOnboarding(payload: { companyName: string; currency: string; timezone: string }) {
    error.value = null
    try {
      const { data } = await api.post<BackendCompanySettings>('/company-settings/complete-onboarding', {
        CompanyName: payload.companyName,
        Currency: payload.currency,
        Timezone: payload.timezone,
      })
      settings.value = mapSettings(data)
      isOnboarded.value = true
      return settings.value
    } catch (err) {
      error.value = getApiErrorMessage(err, "Impossible de finaliser la configuration initiale")
      throw err
    }
  }

  async function update(payload: Partial<{
    companyName: string; currency: string; timezone: string
    dayCountingRule: 'WorkingDays' | 'CalendarDays'
    defaultMonthlyAccrualRate: number; defaultCarryOverCap: number
    leaveAccrualRunDay: number | null
  }>) {
    error.value = null
    return withToast('Enregistrement en cours…', async () => {
      try {
        const body: Record<string, unknown> = {}
        if (payload.companyName !== undefined) body.CompanyName = payload.companyName
        if (payload.currency !== undefined) body.Currency = payload.currency
        if (payload.timezone !== undefined) body.Timezone = payload.timezone
        if (payload.dayCountingRule !== undefined) body.DayCountingRule = payload.dayCountingRule
        if (payload.defaultMonthlyAccrualRate !== undefined) body.DefaultMonthlyAccrualRate = payload.defaultMonthlyAccrualRate
        if (payload.defaultCarryOverCap !== undefined) body.DefaultCarryOverCap = payload.defaultCarryOverCap
        if (payload.leaveAccrualRunDay !== undefined) body.LeaveAccrualRunDay = payload.leaveAccrualRunDay
        const { data } = await api.patch<BackendCompanySettings>('/company-settings', body)
        settings.value = mapSettings(data)
        return settings.value
      } catch (err) {
        error.value = getApiErrorMessage(err, "Impossible de mettre à jour les paramètres de l'entreprise")
        throw err
      }
    }, () => error.value ?? "Impossible de mettre à jour les paramètres de l'entreprise")
  }

  return { settings, isOnboarded, loading, error, fetchSettings, completeOnboarding, update }
})
