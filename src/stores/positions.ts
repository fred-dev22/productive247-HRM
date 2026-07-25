import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, getApiErrorMessage } from '../lib/api'
import { withToast } from '../lib/withToast'

export type OccupationStatus = 'Vacant' | 'Occupied'

export interface Position {
  id:                  string
  code:                string
  title:               string
  jobId:               string
  organizationUnitId:  string
  parentPositionId?:   string | null
  occupationStatus:    OccupationStatus
}

interface BackendPosition {
  Id: string
  Code: string
  Title: string
  JobId: string
  OrganizationUnitId: string
  ParentPositionId: string | null
  OccupationStatus: OccupationStatus
}

function mapPosition(raw: BackendPosition): Position {
  return {
    id: raw.Id,
    code: raw.Code,
    title: raw.Title,
    jobId: raw.JobId,
    organizationUnitId: raw.OrganizationUnitId,
    parentPositionId: raw.ParentPositionId,
    occupationStatus: raw.OccupationStatus,
  }
}

function toBackendPayload(payload: Partial<Position>) {
  const body: Record<string, unknown> = {}
  if (payload.code !== undefined) body.Code = payload.code
  if (payload.title !== undefined) body.Title = payload.title
  if (payload.jobId !== undefined) body.JobId = payload.jobId
  if (payload.organizationUnitId !== undefined) body.OrganizationUnitId = payload.organizationUnitId
  if (payload.parentPositionId !== undefined) body.ParentPositionId = payload.parentPositionId
  if (payload.occupationStatus !== undefined) body.OccupationStatus = payload.occupationStatus
  return body
}

export const usePositionStore = defineStore('positions', () => {
  const positions = ref<Position[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendPosition[]>('/positions')
      positions.value = data.map(mapPosition)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger les postes')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchActive() {
    // Position n'a pas de notion "actif/inactif" cote backend — la
    // disponibilite se lit via occupationStatus (Vacant/Occupied), portee
    // par fetchVacant() ci-dessous.
    return fetchAll()
  }

  async function fetchByUnit(unitId: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendPosition[]>(`/positions/by-unit/${unitId}`)
      return data.map(mapPosition)
    } catch (err) {
      error.value = getApiErrorMessage(err, "Impossible de charger les postes de cette unité")
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchVacant() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendPosition[]>('/positions/vacant')
      return data.map(mapPosition)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger les postes vacants')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createPosition(payload: Omit<Position, 'id'>) {
    error.value = null
    return withToast('Création du poste en cours…', async () => {
      try {
        const { data } = await api.post<BackendPosition>('/positions', toBackendPayload(payload))
        const mapped = mapPosition(data)
        positions.value.push(mapped)
        return mapped
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de créer le poste')
        throw err
      }
    }, () => error.value ?? 'Impossible de créer le poste')
  }

  async function updatePosition(id: string, payload: Partial<Position>) {
    error.value = null
    return withToast('Enregistrement en cours…', async () => {
      try {
        const { data } = await api.patch<BackendPosition>(`/positions/${id}`, toBackendPayload(payload))
        const mapped = mapPosition(data)
        const idx = positions.value.findIndex(p => p.id === id)
        if (idx !== -1) positions.value[idx] = mapped
        return mapped
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de mettre à jour le poste')
        throw err
      }
    }, () => error.value ?? 'Impossible de mettre à jour le poste')
  }

  async function deletePosition(id: string) {
    error.value = null
    return withToast('Suppression en cours…', async () => {
      try {
        await api.delete(`/positions/${id}`)
        positions.value = positions.value.filter(p => p.id !== id)
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de supprimer le poste')
        throw err
      }
    }, () => error.value ?? 'Impossible de supprimer le poste')
  }

  return {
    positions, loading, error,
    fetchAll, fetchActive, fetchByUnit, fetchVacant,
    createPosition, updatePosition, deletePosition,
  }
})
