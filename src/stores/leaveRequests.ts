import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, getApiErrorMessage } from '../lib/api'
import { withToast } from '../lib/withToast'
import type { LeaveRequest, LeaveRequestStatus, ValidationStep } from '../types'

// ── Backend <-> frontend mapping ────────────────────────────────
interface BackendEmployeeRef { Id: string; FullName: string; EmployeeNumber?: string }
interface BackendLeaveTypeRef { Id: string; Name: string; Color: string; WorkflowType: 'Standard' | 'Medical' }
interface BackendDecision {
  Id: string
  StepOrder: number
  Decision: 'Pending' | 'Approved' | 'Rejected' | 'Returned'
  Comment: string | null
  DecidedAt: string | null
  CreatedAt: string
  validatedByEmployee?: BackendEmployeeRef
}
interface BackendLeaveRequest {
  Id: string
  ReferenceCode: string
  EmployeeId: string
  LeaveTypeId: string
  StartDate: string
  EndDate: string
  DaysCount: string | number
  Reason: string | null
  InterimEmployeeId: string | null
  Status: string
  ApprovalPoolId: string | null
  CurrentApprovalStep: number | null
  RejectionReason: string | null
  CreatedAt: string
  ModifiedAt?: string | null
  employee?: BackendEmployeeRef
  leaveType?: BackendLeaveTypeRef
  interimEmployee?: BackendEmployeeRef
  createdByEmployee?: BackendEmployeeRef
  decisions?: BackendDecision[]
  InsufficientBalance?: boolean
}

function initialsFromFullName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

const STEP_LEVEL: Record<number, ValidationStep['level']> = { 1: 'n1', 2: 'n2', 3: 'n3', 4: 'n4' }
const DECISION_ACTION: Record<string, ValidationStep['action']> = {
  Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Returned: 'returned',
}

function mapDecision(d: BackendDecision): ValidationStep {
  const name = d.validatedByEmployee?.FullName ?? ''
  return {
    level: STEP_LEVEL[d.StepOrder] ?? 'n1',
    actorName: name,
    actorInitials: initialsFromFullName(name),
    action: DECISION_ACTION[d.Decision] ?? 'pending',
    date: d.DecidedAt ?? '',
    comment: d.Comment ?? undefined,
  }
}

function mapLeaveRequest(raw: BackendLeaveRequest): LeaveRequest {
  const employeeName = raw.employee?.FullName ?? ''
  return {
    id: raw.Id,
    referenceCode: raw.ReferenceCode,
    employeeId: raw.EmployeeId,
    employeeName,
    employeeInitials: initialsFromFullName(employeeName),
    createdById: raw.createdByEmployee?.Id,
    createdByName: raw.createdByEmployee?.FullName,
    leaveTypeId: raw.LeaveTypeId,
    leaveTypeName: raw.leaveType?.Name ?? '',
    leaveTypeColor: raw.leaveType?.Color ?? '#94A3B8',
    workflowType: raw.leaveType?.WorkflowType ?? 'Standard',
    startDate: raw.StartDate.slice(0, 10),
    endDate: raw.EndDate.slice(0, 10),
    daysCount: Number(raw.DaysCount),
    reason: raw.Reason ?? undefined,
    interimEmployeeId: raw.InterimEmployeeId ?? undefined,
    interimEmployeeName: raw.interimEmployee?.FullName,
    status: raw.Status as LeaveRequestStatus,
    approvalPoolId: raw.ApprovalPoolId ?? undefined,
    currentApprovalStep: raw.CurrentApprovalStep ?? undefined,
    rejectionReason: raw.RejectionReason ?? undefined,
    createdAt: raw.CreatedAt,
    modifiedAt: raw.ModifiedAt ?? undefined,
    validationHistory: raw.decisions ? raw.decisions.map(mapDecision) : undefined,
    insufficientBalance: raw.InsufficientBalance ?? false,
  }
}

export interface CreateLeaveRequestPayload {
  leaveTypeId: string
  startDate: string
  // 'full' | 'am' | 'pm' — voir LeaveRequest.StartPeriod (backend) et la
  // règle vendredi/week-end (reunion Dominique du 12/06, utils/calendar.ts).
  startPeriod?: 'full' | 'am' | 'pm'
  endDate: string
  endPeriod?: 'full' | 'am' | 'pm'
  reason?: string
  interimEmployeeId?: string
  employeeId?: string // uniquement si on soumet pour un autre employé (CONGE_VOIR_TOUT)
}

function toBackendCreatePayload(p: CreateLeaveRequestPayload) {
  return {
    EmployeeId: p.employeeId,
    LeaveTypeId: p.leaveTypeId,
    StartDate: p.startDate,
    StartPeriod: p.startPeriod,
    EndDate: p.endDate,
    EndPeriod: p.endPeriod,
    Reason: p.reason,
    InterimEmployeeId: p.interimEmployeeId,
  }
}

export const useLeaveRequestStore = defineStore('leaveRequests', () => {
  const mine         = ref<LeaveRequest[]>([])
  const team         = ref<LeaveRequest[]>([])
  const all          = ref<LeaveRequest[]>([])
  const pendingForMe = ref<LeaveRequest[]>([])
  const loading      = ref(false)
  const error        = ref<string | null>(null)

  async function fetchMine() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendLeaveRequest[]>('/leave-requests/mine')
      mine.value = data.map(mapLeaveRequest)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger vos demandes de congé')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTeam() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendLeaveRequest[]>('/leave-requests/team')
      team.value = data.map(mapLeaveRequest)
    } catch (err) {
      error.value = getApiErrorMessage(err, "Impossible de charger les demandes de l'équipe")
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendLeaveRequest[]>('/leave-requests')
      all.value = data.map(mapLeaveRequest)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger les demandes de congé')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPendingForMe() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<BackendLeaveRequest[]>('/leave-requests/pending-for-me')
      pendingForMe.value = data.map(mapLeaveRequest)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger les demandes à valider')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string): Promise<LeaveRequest> {
    const { data } = await api.get<BackendLeaveRequest>(`/leave-requests/${id}`)
    return mapLeaveRequest(data)
  }

  // Remplace l'entrée correspondante dans toutes les listes locales déjà
  // chargées (mine/team/all/pendingForMe) — évite un refetch complet après
  // chaque action de workflow.
  function replaceEverywhere(updated: LeaveRequest) {
    for (const list of [mine, team, all, pendingForMe]) {
      const idx = list.value.findIndex(l => l.id === updated.id)
      if (idx !== -1) list.value[idx] = updated
    }
  }
  function removeEverywhere(id: string) {
    for (const list of [mine, team, all, pendingForMe]) {
      list.value = list.value.filter(l => l.id !== id)
    }
  }
  // Une decision (approuver/refuser/retourner) retire la demande de "à
  // valider" pour l'acteur courant tout de suite — meme si elle escalade au
  // niveau superieur, ce n'est plus a lui de la traiter. Sans ça la ligne
  // restait affichee (avec un statut/des boutons perimes) jusqu'à un
  // rechargement complet de la page.
  function removeFromPending(id: string) {
    pendingForMe.value = pendingForMe.value.filter(l => l.id !== id)
  }

  async function create(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
    error.value = null
    try {
      const { data } = await api.post<BackendLeaveRequest>('/leave-requests', toBackendCreatePayload(payload))
      const mapped = mapLeaveRequest(data)
      mine.value.unshift(mapped)
      return mapped
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de créer la demande de congé')
      throw err
    }
  }

  async function submit(id: string): Promise<LeaveRequest> {
    const { data } = await api.post<BackendLeaveRequest>(`/leave-requests/${id}/submit`)
    const mapped = mapLeaveRequest(data)
    replaceEverywhere(mapped)
    return mapped
  }

  /** Crée puis soumet immédiatement — équivalent de l'ancien submitLeave() du mock. */
  async function createAndSubmit(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
    error.value = null
    return withToast('Soumission de la demande en cours…', async () => {
      let created: LeaveRequest | undefined
      try {
        created = await create(payload)
        return await submit(created.id)
      } catch (err) {
        // La soumission peut echouer apres coup (ex: preavis insuffisant,
        // solde insuffisant) — on ne laisse pas trainer le brouillon cree
        // juste avant, l'utilisateur a demande une soumission directe, pas
        // un brouillon.
        if (created) {
          await api.delete(`/leave-requests/${created.id}`).catch(() => {})
          removeEverywhere(created.id)
        }
        error.value = getApiErrorMessage(err, 'Impossible de soumettre la demande de congé')
        throw err
      }
    }, () => error.value ?? 'Impossible de soumettre la demande de congé')
  }

  async function saveDraft(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
    error.value = null
    return withToast('Enregistrement du brouillon en cours…', async () => {
      try {
        return await create(payload)
      } catch (err) {
        error.value = getApiErrorMessage(err, "Impossible d'enregistrer le brouillon")
        throw err
      }
    }, () => error.value ?? "Impossible d'enregistrer le brouillon")
  }

  async function update(id: string, patch: Partial<Omit<CreateLeaveRequestPayload, 'employeeId'>>): Promise<LeaveRequest> {
    error.value = null
    return withToast('Enregistrement en cours…', async () => {
      try {
        const body: Record<string, unknown> = {}
        if (patch.leaveTypeId !== undefined) body.LeaveTypeId = patch.leaveTypeId
        if (patch.startDate !== undefined) body.StartDate = patch.startDate
        if (patch.startPeriod !== undefined) body.StartPeriod = patch.startPeriod
        if (patch.endDate !== undefined) body.EndDate = patch.endDate
        if (patch.endPeriod !== undefined) body.EndPeriod = patch.endPeriod
        if (patch.reason !== undefined) body.Reason = patch.reason
        if (patch.interimEmployeeId !== undefined) body.InterimEmployeeId = patch.interimEmployeeId
        const { data } = await api.patch<BackendLeaveRequest>(`/leave-requests/${id}`, body)
        const mapped = mapLeaveRequest(data)
        replaceEverywhere(mapped)
        return mapped
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de mettre à jour la demande')
        throw err
      }
    }, () => error.value ?? 'Impossible de mettre à jour la demande')
  }

  async function remove(id: string) {
    error.value = null
    return withToast('Suppression en cours…', async () => {
      try {
        await api.delete(`/leave-requests/${id}`)
        removeEverywhere(id)
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de supprimer la demande')
        throw err
      }
    }, () => error.value ?? 'Impossible de supprimer la demande')
  }

  async function approve(id: string, comment?: string) {
    error.value = null
    return withToast('Validation en cours…', async () => {
      try {
        const { data } = await api.patch<BackendLeaveRequest>(`/leave-requests/${id}/approve`, { Comment: comment })
        const mapped = mapLeaveRequest(data)
        replaceEverywhere(mapped)
        removeFromPending(mapped.id)
        return mapped
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de valider cette demande')
        throw err
      }
    }, () => error.value ?? 'Impossible de valider cette demande')
  }

  async function reject(id: string, comment: string) {
    error.value = null
    return withToast('Refus en cours…', async () => {
      try {
        const { data } = await api.patch<BackendLeaveRequest>(`/leave-requests/${id}/reject`, { Comment: comment })
        const mapped = mapLeaveRequest(data)
        replaceEverywhere(mapped)
        removeFromPending(mapped.id)
        return mapped
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de refuser cette demande')
        throw err
      }
    }, () => error.value ?? 'Impossible de refuser cette demande')
  }

  async function returnLeave(id: string, comment: string) {
    error.value = null
    return withToast('Retour en cours…', async () => {
      try {
        const { data } = await api.patch<BackendLeaveRequest>(`/leave-requests/${id}/return`, { Comment: comment })
        const mapped = mapLeaveRequest(data)
        replaceEverywhere(mapped)
        removeFromPending(mapped.id)
        return mapped
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible de retourner cette demande')
        throw err
      }
    }, () => error.value ?? 'Impossible de retourner cette demande')
  }

  async function cancel(id: string) {
    error.value = null
    return withToast('Annulation en cours…', async () => {
      try {
        const { data } = await api.patch<BackendLeaveRequest>(`/leave-requests/${id}/cancel`)
        const mapped = mapLeaveRequest(data)
        replaceEverywhere(mapped)
        return mapped
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Impossible d’annuler cette demande')
        throw err
      }
    }, () => error.value ?? 'Impossible d’annuler cette demande')
  }

  async function markDone(id: string) {
    error.value = null
    try {
      const { data } = await api.patch<BackendLeaveRequest>(`/leave-requests/${id}/mark-done`)
      const mapped = mapLeaveRequest(data)
      replaceEverywhere(mapped)
      return mapped
    } catch (err) {
      error.value = getApiErrorMessage(err, "Impossible de marquer cette demande comme effectuée")
      throw err
    }
  }

  async function regularize(id: string) {
    error.value = null
    try {
      const { data } = await api.patch<BackendLeaveRequest>(`/leave-requests/${id}/regularize`)
      const mapped = mapLeaveRequest(data)
      replaceEverywhere(mapped)
      return mapped
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de régulariser cette demande')
      throw err
    }
  }

  return {
    mine, team, all, pendingForMe, loading, error,
    fetchMine, fetchTeam, fetchAll, fetchPendingForMe, fetchOne,
    create, submit, createAndSubmit, saveDraft, update, remove,
    approve, reject, returnLeave, cancel, markDone, regularize,
  }
})
