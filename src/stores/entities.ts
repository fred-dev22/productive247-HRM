import { defineStore } from 'pinia'
import { api } from '../lib/api'
import { useEmployeeStore } from './employees'
import type { Entity, EntityType, EntityStatus, ValidatorPool } from '../types'

// ── Backend <-> frontend mapping ────────────────────────────────
// The API returns OrganizationUnit rows in PascalCase (Prisma model field
// names). Only the fields below are real backend columns; headcount,
// responsibleName, legalIdentifier and validatorPools have no backend
// counterpart yet (see types/index.ts) and are enriched/defaulted here.
interface BackendOrganizationUnit {
  Id: string
  Code: string
  Name: string
  Type: EntityType
  ParentId: string | null
  ManagerId: string | null
  Address: string | null
  Phone: string | null
  Email: string | null
  Status: EntityStatus
  CreatedBy: string
  CreatedAt: string
  ModifiedBy: string | null
  ModifiedAt: string | null
  children?: BackendOrganizationUnit[]
}

function mapEntity(raw: BackendOrganizationUnit): Entity {
  const employees = useEmployeeStore().getByEntityId(raw.Id)
  const manager = raw.ManagerId ? useEmployeeStore().getById(raw.ManagerId) : undefined

  return {
    id:         raw.Id,
    code:       raw.Code,
    name:       raw.Name,
    type:       raw.Type,
    parentId:   raw.ParentId,
    managerId:  raw.ManagerId,
    address:    raw.Address ?? undefined,
    phone:      raw.Phone ?? undefined,
    email:      raw.Email ?? undefined,
    status:     raw.Status,
    createdBy:  raw.CreatedBy,
    createdAt:  raw.CreatedAt,
    modifiedBy: raw.ModifiedBy,
    modifiedAt: raw.ModifiedAt,
    legalIdentifier: undefined,
    responsibleName: manager?.name,
    headcount:       employees.length,
    validatorPools:  [],
    children: raw.children ? raw.children.map(mapEntity) : undefined,
  }
}

// Only these fields are accepted by the backend create/update DTOs — every
// other Entity property (headcount, responsibleName, legalIdentifier,
// validatorPools, children...) is UI-only and must never be sent, otherwise
// the API's forbidNonWhitelisted validation rejects the whole request.
function toBackendPayload(payload: Partial<Entity>) {
  const body: Record<string, unknown> = {}
  if (payload.code !== undefined) body.Code = payload.code
  if (payload.name !== undefined) body.Name = payload.name
  if (payload.type !== undefined) body.Type = payload.type
  if (payload.parentId !== undefined) body.ParentId = payload.parentId
  if (payload.managerId !== undefined) body.ManagerId = payload.managerId
  if (payload.address !== undefined) body.Address = payload.address
  if (payload.phone !== undefined) body.Phone = payload.phone
  if (payload.email !== undefined) body.Email = payload.email
  if (payload.status !== undefined) body.Status = payload.status
  return body
}

export const useEntityStore = defineStore('entities', {
  state: () => ({
    entities: [] as Entity[],
    loading:  false,
    error:    null as string | null,
  }),

  getters: {
    rootEntities:     (state): Entity[] => state.entities.filter(e => e.parentId === null),
    getChildren:      (state) => (parentId: string): Entity[] =>
                        state.entities.filter(e => e.parentId === parentId),
    getEntityById:    (state) => (id: string): Entity | undefined =>
                        state.entities.find(e => e.id === id),
    pendingEntities:  (state): Entity[] => state.entities.filter(e => e.status === 'PendingApproval'),
    approvedEntities: (state): Entity[] => state.entities.filter(e => e.status === 'Active'),
    totalHeadcount:   (state): number   => state.entities.reduce((s, e) => s + e.headcount, 0),

    // Client-side tree built from the already-loaded flat list — reactive,
    // no extra request. Use the fetchTree() action instead when you need
    // the freshest hierarchy without relying on `entities` being populated.
    buildTree(): Entity[] {
      const buildNode = (entity: Entity): Entity => {
        const children = (this.entities as Entity[])
          .filter(e => e.parentId === entity.id)
          .map(child => buildNode(child))
        return { ...entity, children: children.length > 0 ? children : undefined }
      }
      return (this.rootEntities as Entity[]).map(e => buildNode(e))
    },
  },

  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get<BackendOrganizationUnit[]>('/organization-units')
        this.entities = data.map(mapEntity)
      } catch (err) {
        this.error = "Impossible de charger les unités organisationnelles"
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchTree(): Promise<Entity[]> {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get<BackendOrganizationUnit[]>('/organization-units/tree')
        return data.map(mapEntity)
      } catch (err) {
        this.error = "Impossible de charger l'arborescence"
        throw err
      } finally {
        this.loading = false
      }
    },

    async createEntity(payload: Omit<Entity, 'id' | 'status' | 'createdBy' | 'createdAt' | 'headcount' | 'validatorPools'> & { status?: EntityStatus }) {
      this.error = null
      try {
        const body = toBackendPayload({ ...payload, status: payload.status ?? 'Draft' })
        const { data } = await api.post<BackendOrganizationUnit>('/organization-units', body)
        const entity = mapEntity(data)
        this.entities.push(entity)
        return entity
      } catch (err) {
        this.error = "Impossible de créer l'unité organisationnelle"
        throw err
      }
    },

    async updateEntity(id: string, payload: Partial<Entity>) {
      this.error = null
      try {
        const body = toBackendPayload(payload)
        const { data } = await api.patch<BackendOrganizationUnit>(`/organization-units/${id}`, body)
        const entity = mapEntity(data)
        const idx = this.entities.findIndex(e => e.id === id)
        if (idx !== -1) this.entities[idx] = entity
        return entity
      } catch (err) {
        this.error = "Impossible de mettre à jour l'unité organisationnelle"
        throw err
      }
    },

    async submitEntity(id: string) {
      this.error = null
      try {
        const { data } = await api.post<BackendOrganizationUnit>(`/organization-units/${id}/submit`)
        const idx = this.entities.findIndex(e => e.id === id)
        if (idx !== -1) this.entities[idx] = mapEntity(data)
      } catch (err) {
        this.error = 'Impossible de soumettre cette unité pour approbation'
        throw err
      }
    },

    async approveEntity(id: string) {
      this.error = null
      try {
        const { data } = await api.post<BackendOrganizationUnit>(`/organization-units/${id}/approve`)
        const idx = this.entities.findIndex(e => e.id === id)
        if (idx !== -1) this.entities[idx] = mapEntity(data)
      } catch (err) {
        this.error = 'Impossible d\'approuver cette unité'
        throw err
      }
    },

    async rejectEntity(id: string) {
      this.error = null
      try {
        const { data } = await api.post<BackendOrganizationUnit>(`/organization-units/${id}/reject`)
        const idx = this.entities.findIndex(e => e.id === id)
        if (idx !== -1) this.entities[idx] = mapEntity(data)
      } catch (err) {
        this.error = 'Impossible de rejeter cette unité'
        throw err
      }
    },

    async deactivateEntity(id: string) {
      await this.updateEntity(id, { status: 'Inactive' })
    },

    // ApprovalPool is not wired to the backend yet (out of scope for this
    // pass) — validatorPools stays a local-only, non-persisted UI concept.
    addValidatorPool(entityId: string, pool: ValidatorPool) {
      const e = this.entities.find(x => x.id === entityId)
      if (!e) return
      const existing = e.validatorPools.findIndex(p => p.level === pool.level)
      if (existing !== -1) e.validatorPools[existing] = pool
      else e.validatorPools.push(pool)
    },

    removeValidatorPool(entityId: string, level: number) {
      const e = this.entities.find(x => x.id === entityId)
      if (e) e.validatorPools = e.validatorPools.filter(p => p.level !== level)
    },
  },
})
