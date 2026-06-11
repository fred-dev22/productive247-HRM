import { defineStore } from 'pinia'
import type { Entity, EntityStatus, ValidatorPool } from '../types'

export const useEntityStore = defineStore('entities', {
  state: () => ({
    // Une seule Direction (e1) — tout le reste est département ou service.
    entities: [

      // ── Direction (1 seule) ──
      {
        id: 'e1', code: 'DG', name: 'Direction Générale',
        type: 'direction', parentId: null,
        legalIdentifier: 'GPL-001', address: 'Port Louis, Île Maurice',
        responsibleName: 'Gary Ellis', responsibleId: 'emp-001',
        headcount: 5, status: 'approved',
        validatorPools: [], createdAt: '2024-01-15',
      },

      // ── Départements ──
      {
        id: 'e2', code: 'DRH', name: 'Direction des Ressources Humaines',
        type: 'department', parentId: 'e1',
        responsibleName: 'Sonia Boodhun', responsibleId: 'emp-002',
        headcount: 8, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Sonia Boodhun', validatorInitials: 'SB', validatorColor: '#185FA5' },
          { level: 2, validatorName: 'Gary Ellis',    validatorInitials: 'GE', validatorColor: '#006B3C' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e5', code: 'DAF', name: 'Direction Administrative et Financière',
        type: 'department', parentId: 'e1',
        responsibleName: 'Ravi Dhondoo', responsibleId: 'emp-005',
        headcount: 12, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Ravi Dhondoo', validatorInitials: 'RD', validatorColor: '#185FA5' },
          { level: 2, validatorName: 'Gary Ellis',   validatorInitials: 'GE', validatorColor: '#006B3C' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e8', code: 'DOP', name: 'Direction des Opérations',
        type: 'department', parentId: 'e1',
        responsibleName: 'Kumar Gunness', responsibleId: 'emp-008',
        headcount: 45, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Kumar Gunness', validatorInitials: 'KG', validatorColor: '#185FA5' },
          { level: 2, validatorName: 'Gary Ellis',    validatorInitials: 'GE', validatorColor: '#006B3C' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e12', code: 'DCOM', name: 'Direction Commerciale',
        type: 'department', parentId: 'e1',
        responsibleName: 'Nadia Oozeer', responsibleId: 'emp-012',
        headcount: 22, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Nadia Oozeer', validatorInitials: 'NO', validatorColor: '#993556' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e14', code: 'DTHSE', name: 'Direction Technique & HSE',
        type: 'department', parentId: 'e1',
        responsibleName: 'Patrick Boulle', responsibleId: 'emp-014',
        headcount: 14, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Patrick Boulle', validatorInitials: 'PB', validatorColor: '#185FA5' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e15', code: 'DJUR', name: 'Direction Juridique & Conformité',
        type: 'department', parentId: 'e1',
        responsibleName: 'Marie-France Leclézio', responsibleId: 'emp-015',
        headcount: 5, status: 'pending_approval',
        validatorPools: [],
        submittedAt: '2024-02-12', createdAt: '2024-02-10',
      },

      // ── Services ──
      {
        id: 'e3', code: 'SAP', name: 'Service Administration du Personnel',
        type: 'service', parentId: 'e2',
        responsibleName: 'Ravi Nundlall', responsibleId: 'emp-003',
        headcount: 4, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Ravi Nundlall', validatorInitials: 'RN', validatorColor: '#854F0B' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e4', code: 'SFD', name: 'Service Formation & Développement',
        type: 'service', parentId: 'e2',
        responsibleName: 'Priya Ramlugun', responsibleId: 'emp-004',
        headcount: 3, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Priya Ramlugun', validatorInitials: 'PR', validatorColor: '#993556' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e6', code: 'SCOMPTA', name: 'Service Comptabilité',
        type: 'service', parentId: 'e5',
        responsibleName: 'Jean-Claude Rakotomalala', responsibleId: 'emp-006',
        headcount: 6, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Jean-Claude Rakotomalala', validatorInitials: 'JR', validatorColor: '#2D7A3F' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e7', code: 'SCG', name: 'Service Contrôle de Gestion',
        type: 'service', parentId: 'e5',
        responsibleName: 'Hery Andrianaivo', responsibleId: 'emp-007',
        headcount: 4, status: 'approved',
        validatorPools: [],
        createdAt: '2024-01-15',
      },
      {
        id: 'e9', code: 'STP', name: 'Service Terminal Pétrolier',
        type: 'service', parentId: 'e8',
        responsibleName: 'Morad Cassam', responsibleId: 'emp-009',
        headcount: 18, status: 'approved',
        validatorPools: [
          { level: 1, validatorName: 'Morad Cassam', validatorInitials: 'MC', validatorColor: '#854F0B' },
        ],
        createdAt: '2024-01-15',
      },
      {
        id: 'e10', code: 'SRAF', name: 'Service Raffinerie',
        type: 'service', parentId: 'e8',
        responsibleName: 'Thierry Randriamanga', responsibleId: 'emp-010',
        headcount: 15, status: 'approved',
        validatorPools: [],
        createdAt: '2024-01-15',
      },
      {
        id: 'e11', code: 'SLOG', name: 'Service Logistique & Transport',
        type: 'service', parentId: 'e8',
        responsibleName: 'Fiona Mungroo', responsibleId: 'emp-011',
        headcount: 12, status: 'approved',
        validatorPools: [],
        createdAt: '2024-01-15',
      },
      {
        id: 'e13', code: 'SSS', name: 'Service Stations-Service',
        type: 'service', parentId: 'e12',
        responsibleName: 'Ashvin Pertab', responsibleId: 'emp-013',
        headcount: 10, status: 'approved',
        validatorPools: [],
        createdAt: '2024-01-15',
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
