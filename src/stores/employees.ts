import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, getApiErrorMessage } from '../lib/api'
import { withToast } from '../lib/withToast'
import { useEntityStore } from './entities'
import { usePositionStore } from './positions'
import type { Employee, ContractType, EmployeeStatus, UserRole } from '../types'

const PALETTE = [
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#C0DD97', text: '#3B6D11' },
  { bg: '#F4C0D1', text: '#72243E' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#AFA9EC', text: '#3C3489' },
  { bg: '#B8E8D8', text: '#1A6B4B' },
  { bg: '#FAD9B0', text: '#7A3B09' },
]

function p(i: number) { return PALETTE[i % PALETTE.length]! }

const CONTRACT_TYPE_TO_BACKEND: Record<ContractType, string> = {
  CDI: 'Permanent', CDD: 'FixedTerm', Stage: 'Internship', Freelance: 'Freelance',
}
const CONTRACT_TYPE_FROM_BACKEND: Record<string, ContractType> = {
  Permanent: 'CDI', FixedTerm: 'CDD', Internship: 'Stage', Freelance: 'Freelance',
}
const STATUS_TO_BACKEND: Record<EmployeeStatus, string> = {
  active: 'Active', trial: 'OnTrial', onleave: 'OnLeave', inactive: 'Inactive',
}
const STATUS_FROM_BACKEND: Record<string, EmployeeStatus> = {
  Active: 'active', OnTrial: 'trial', OnLeave: 'onleave', Inactive: 'inactive',
}

// ── Backend <-> frontend mapping ────────────────────────────────
// Employee n'a pas de colonne JobTitle libre (seulement PositionId, une FK
// vers le module Position), pas de ManagerId propre (dérivé du responsable
// de l'OrganizationUnit de rattachement), et pas de Role (porté par un
// compte User séparé, Employee.UserId — le rôle applicatif fin, à ce jour
// non branché ici, voir types/index.ts). hasAccount en revanche reflète
// désormais la vraie colonne backend Employee.UserId.
interface BackendEmployee {
  Id: string
  EmployeeNumber: string
  FirstName: string
  LastName: string
  FullName: string
  Gender: string
  BirthDate: string
  BirthPlace: string | null
  MaritalStatus: string
  IdType: string
  IdNumber: string | null
  MobilePhone: string | null
  WorkPhone: string | null
  Email: string
  ContractType: string
  HireDate: string
  TerminationDate: string | null
  PositionId: string | null
  OrganizationUnitId: string
  UserId: string | null
  Status: string
}

function mapEmployee(raw: BackendEmployee, paletteIndex: number): Employee {
  const position = raw.PositionId
    ? usePositionStore().positions.find(p => p.id === raw.PositionId)
    : undefined
  const entity = useEntityStore().getEntityById(raw.OrganizationUnitId)
  const c = p(paletteIndex)

  return {
    id:           raw.Id,
    code:         raw.EmployeeNumber,
    firstName:    raw.FirstName,
    lastName:     raw.LastName,
    name:         raw.FullName,
    initials:     (raw.FirstName.charAt(0) + raw.LastName.charAt(0)).toUpperCase(),
    avatarBg:     c.bg,
    avatarText:   c.text,
    role:         'employee',
    jobTitle:     position?.title ?? '',
    positionId:   raw.PositionId ?? undefined,
    entityId:     raw.OrganizationUnitId,
    entityName:   entity?.name,
    email:        raw.Email,
    phone:        raw.MobilePhone ?? raw.WorkPhone ?? undefined,
    hireDate:     raw.HireDate,
    contractType: CONTRACT_TYPE_FROM_BACKEND[raw.ContractType] ?? 'CDI',
    status:       STATUS_FROM_BACKEND[raw.Status] ?? 'active',
    managerId:    entity?.managerId ?? undefined,
    gender:        raw.Gender === 'F' ? 'F' : 'M',
    birthDate:     raw.BirthDate,
    birthPlace:    raw.BirthPlace ?? undefined,
    maritalStatus: (raw.MaritalStatus as Employee['maritalStatus']) ?? 'Single',
    idType:        (raw.IdType as Employee['idType']) ?? 'NationalId',
    idNumber:      raw.IdNumber ?? undefined,
    hasAccount:   raw.UserId != null,
  }
}

function toBackendPayload(payload: Partial<Employee>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (payload.code !== undefined) body.EmployeeNumber = payload.code
  if (payload.firstName !== undefined) body.FirstName = payload.firstName
  if (payload.lastName !== undefined) body.LastName = payload.lastName
  if (payload.gender !== undefined) body.Gender = payload.gender
  if (payload.birthDate !== undefined) body.BirthDate = payload.birthDate
  if (payload.birthPlace !== undefined) body.BirthPlace = payload.birthPlace || undefined
  if (payload.maritalStatus !== undefined) body.MaritalStatus = payload.maritalStatus
  if (payload.idType !== undefined) body.IdType = payload.idType
  if (payload.idNumber !== undefined) body.IdNumber = payload.idNumber || undefined
  if (payload.phone !== undefined) body.MobilePhone = payload.phone || undefined
  if (payload.email !== undefined) body.Email = payload.email
  if (payload.contractType !== undefined) body.ContractType = CONTRACT_TYPE_TO_BACKEND[payload.contractType]
  if (payload.hireDate !== undefined) body.HireDate = payload.hireDate
  if (payload.positionId !== undefined) body.PositionId = payload.positionId || null
  if (payload.entityId !== undefined) body.OrganizationUnitId = payload.entityId
  if (payload.status !== undefined) body.Status = STATUS_TO_BACKEND[payload.status]
  return body
}

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref<Employee[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  const activeEmployees   = computed(() => employees.value.filter(e => e.status === 'active'))
  const trialEmployees    = computed(() => employees.value.filter(e => e.status === 'trial'))
  const validatorEmployees = computed(() => employees.value.filter(e => e.role === 'validator' || e.role === 'hr_admin' || e.role === 'hr_director'))

  const nextCode = computed(() => {
    const max = employees.value.reduce((m, e) => {
      const n = parseInt(e.code.replace('EMP', '')) || 0
      return n > m ? n : m
    }, 0)
    return `EMP${String(max + 1).padStart(3, '0')}`
  })

  function getById(id: string): Employee | undefined {
    return employees.value.find(e => e.id === id)
  }

  function getByEntityId(entityId: string): Employee[] {
    return employees.value.filter(e => e.entityId === entityId)
  }

  // mapEmployee lit usePositionStore() de façon synchrone (jobTitle) —
  // s'assurer qu'elle est chargée avant. Ne PAS faire l'équivalent pour
  // useEntityStore() ici : entities.ts.fetchAll() dépend déjà de ce store
  // (pour headcount/responsibleName) et attendrait en retour — un aller-retour
  // circulaire qui bloquerait les deux si les deux stores démarrent vides
  // (voir consumer views : elles chargent l'entityStore avant d'appeler ceci
  // quand l'affichage du nom d'entité importe, ex. EmployeeListView.vue).
  async function ensurePositionsLoaded() {
    const posStore = usePositionStore()
    if (posStore.positions.length === 0) await posStore.fetchAll()
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      await ensurePositionsLoaded()
      const { data } = await api.get<BackendEmployee[]>('/employees')
      employees.value = data.map(mapEmployee)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger les employés')
      throw err
    } finally {
      loading.value = false
    }
  }

  // "Mon équipe" — les employés des unités que le demandeur dirige, cote
  // EMPLOYE_VOIR_EQUIPE plutot que EMPLOYE_VOIR_TOUT (voir /employees/team
  // cote backend).
  async function fetchTeam() {
    loading.value = true
    error.value = null
    try {
      await ensurePositionsLoaded()
      const { data } = await api.get<BackendEmployee[]>('/employees/team')
      employees.value = data.map(mapEmployee)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Impossible de charger votre équipe')
      throw err
    } finally {
      loading.value = false
    }
  }

  // GET /employees/:id — accessible sans EMPLOYE_VOIR_TOUT/EQUIPE tant que
  // c'est son propre dossier (voir employee.controller.ts findOne). Utilisé
  // pour la fiche "Mon profil", pas de raison d'exiger fetchAll ici.
  async function fetchOne(id: string) {
    error.value = null
    try {
      await ensurePositionsLoaded()
      const { data } = await api.get<BackendEmployee>(`/employees/${id}`)
      const idx = employees.value.findIndex(e => e.id === id)
      const mapped = mapEmployee(data, idx !== -1 ? idx : employees.value.length)
      if (idx !== -1) employees.value[idx] = mapped
      else employees.value.push(mapped)
      return mapped
    } catch (err) {
      error.value = getApiErrorMessage(err, "Impossible de charger cette fiche employé")
      throw err
    }
  }

  async function createEmployee(payload: Omit<Employee, 'id' | 'code' | 'name' | 'initials' | 'avatarBg' | 'avatarText'> & { code?: string }) {
    error.value = null
    return withToast("Création de l'employé en cours…", async () => {
      try {
        const body = toBackendPayload({ ...payload, code: payload.code ?? nextCode.value })
        const { data } = await api.post<BackendEmployee>('/employees', body)
        const mapped = mapEmployee(data, employees.value.length)
        // role n'a pas de colonne backend — on conserve le choix fait dans le
        // formulaire pour la session en cours (voir mapEmployee). hasAccount
        // en revanche vient de mapEmployee (Employee.UserId, réel) : jamais
        // fixé ici, seulement via markHasAccount() après un vrai POST /users.
        const withMock: Employee = { ...mapped, role: payload.role }
        employees.value.push(withMock)
        return withMock
      } catch (err) {
        error.value = getApiErrorMessage(err, "Impossible de créer l'employé")
        throw err
      }
    }, () => error.value ?? "Impossible de créer l'employé")
  }

  async function updateEmployee(id: string, payload: Partial<Employee>) {
    error.value = null
    return withToast('Enregistrement en cours…', async () => {
      try {
        const { data } = await api.patch<BackendEmployee>(`/employees/${id}`, toBackendPayload(payload))
        const idx = employees.value.findIndex(e => e.id === id)
        const paletteIndex = idx !== -1 ? idx : employees.value.length
        const mapped = mapEmployee(data, paletteIndex)
        const existing = idx !== -1 ? employees.value[idx] : undefined
        const withMock: Employee = { ...mapped, role: payload.role ?? existing?.role ?? mapped.role }
        if (idx !== -1) employees.value[idx] = withMock
        return withMock
      } catch (err) {
        error.value = getApiErrorMessage(err, "Impossible de mettre à jour l'employé")
        throw err
      }
    }, () => error.value ?? "Impossible de mettre à jour l'employé")
  }

  // DELETE /employees/:id — soft delete côté backend (Status=Inactive,
  // libère le poste) : on reflète juste le même changement localement plutôt
  // que de retirer l'employé du tableau, il reste consultable (historique).
  async function deactivateEmployee(id: string) {
    error.value = null
    return withToast("Désactivation en cours…", async () => {
      try {
        const { data } = await api.delete<BackendEmployee>(`/employees/${id}`)
        const idx = employees.value.findIndex(e => e.id === id)
        if (idx !== -1) {
          const mapped = mapEmployee(data, idx)
          employees.value[idx] = { ...mapped, role: employees.value[idx]!.role }
        }
      } catch (err) {
        error.value = getApiErrorMessage(err, "Impossible de désactiver l'employé")
        throw err
      }
    }, () => error.value ?? "Impossible de désactiver l'employé")
  }

  // Mise à jour locale après la création réussie d'un compte utilisateur
  // (POST /users, voir stores/users.ts) — évite un re-fetch, la source de
  // vérité (Employee.UserId) vient d'être posée côté backend à l'instant.
  function markHasAccount(employeeId: string) {
    const idx = employees.value.findIndex(e => e.id === employeeId)
    if (idx !== -1) employees.value[idx] = { ...employees.value[idx]!, hasAccount: true }
  }

  return {
    employees, loading, error,
    activeEmployees, trialEmployees, validatorEmployees, nextCode,
    getById, getByEntityId, fetchAll, fetchTeam, fetchOne, createEmployee, updateEmployee, deactivateEmployee, markHasAccount,
  }
})
