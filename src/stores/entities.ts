import { defineStore } from 'pinia'
import type { Entity, EntityStatus, ValidatorPool } from '../types'

export const useEntityStore = defineStore('entities', {
  state: () => ({
    // Seule la Direction Générale existe au départ.
    // Les autres entités sont créées par le RH pendant l'onboarding
    // ou depuis la page Entités.
    entities: [
      {
        id: 'e1', code: 'DG', name: 'Direction Générale',
        type: 'direction' as const, parentId: null,
        legalIdentifier: '', address: '',
        responsibleName: '', responsibleId: '',
        headcount: 0, status: 'approved' as const,
        validatorPools: [], createdAt: new Date().toISOString(),
      },
    ] as Entity[],
  }),

  getters: {
    rootEntities:     (state): Entity[] => state.entities.filter(e => e.parentId === null),
    getChildren:      (state) => (parentId: string): Entity[] =>
                        state.entities.filter(e => e.parentId === parentId),
    getEntityById:    (state) => (id: string): Entity | undefined =>
                        state.entities.find(e => e.id === id),
    pendingEntities:  (state): Entity[] => state.entities.filter(e => e.status === 'pending_approval'),
    approvedEntities: (state): Entity[] => state.entities.filter(e => e.status === 'approved'),
    totalHeadcount:   (state): number   => state.entities.reduce((s, e) => s + e.headcount, 0),

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
    createEntity(payload: Omit<Entity, 'id' | 'status' | 'createdAt'>) {
      this.entities.push({
        ...payload,
        id:             `e${Date.now()}`,
        status:         'draft',
        createdAt:      new Date().toISOString().slice(0, 10),
        validatorPools: payload.validatorPools ?? [],
      })
    },

    submitEntity(id: string) {
      const e = this.entities.find(x => x.id === id)
      if (e) { e.status = 'pending_approval'; e.submittedAt = new Date().toISOString().slice(0, 10) }
    },

    approveEntity(id: string) {
      const e = this.entities.find(x => x.id === id)
      if (e) { e.status = 'approved'; e.approvedAt = new Date().toISOString().slice(0, 10) }
    },

    rejectEntity(id: string) {
      const e = this.entities.find(x => x.id === id)
      if (e) e.status = 'draft'
    },

    updateEntity(id: string, payload: Partial<Entity>) {
      const idx = this.entities.findIndex(x => x.id === id)
      if (idx !== -1) this.entities[idx] = { ...this.entities[idx]!, ...payload } as Entity
    },

    deactivateEntity(id: string) {
      const e = this.entities.find(x => x.id === id)
      if (e) e.status = 'inactive'
    },

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
