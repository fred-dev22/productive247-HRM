import { useEntityStore } from '../../../../stores/entities'
import type { ImportConfig } from '../importTypes'

const TYPE_OPTIONS = [
  { value: 'Direction', label: 'Direction' },
  { value: 'Department', label: 'Département' },
  { value: 'Service', label: 'Service' },
]
const STATUS_OPTIONS = [
  { value: 'Active', label: 'Actif' },
  { value: 'Draft', label: 'Brouillon' },
  { value: 'PendingApproval', label: 'En attente d\'approbation' },
  { value: 'Inactive', label: 'Inactif' },
]

export function buildEntityImportConfig(): ImportConfig {
  const entityStore = useEntityStore()

  return {
    title: 'Structure organisationnelle',
    intro: 'Importez plusieurs entités en une fois. Si une entité a un parent, celui-ci doit déjà exister (créé à la main ou importé dans un lot précédent) — un import en plusieurs passes est nécessaire pour une hiérarchie profonde.',
    createEndpoint: '/organization-units',
    dependencies: [],
    columns: [
      { key: 'Code', csvHeader: 'Code', label: 'Code', required: true, type: 'text', sample: 'ENT-FIN' },
      { key: 'Name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Finance' },
      { key: 'Type', csvHeader: 'Type', label: 'Type', required: true, type: 'select', sample: 'Department', options: () => TYPE_OPTIONS },
      {
        key: 'ParentId', csvHeader: 'Code entité parente', label: 'Entité parente', required: false, type: 'select', sample: '',
        options: () => entityStore.entities.map(e => ({ value: e.id, label: e.name, code: e.code })),
      },
      { key: 'Status', csvHeader: 'Statut', label: 'Statut', required: true, type: 'select', sample: 'Active', options: () => STATUS_OPTIONS },
      { key: 'LegalIdentifier', csvHeader: 'Identifiant légal', label: 'Identifiant légal', required: false, type: 'text', sample: '' },
      { key: 'Address', csvHeader: 'Adresse', label: 'Adresse', required: false, type: 'text', sample: '' },
      { key: 'Phone', csvHeader: 'Téléphone', label: 'Téléphone', required: false, type: 'text', sample: '' },
      { key: 'Email', csvHeader: 'Email', label: 'Email', required: false, type: 'text', sample: '' },
    ],
    sampleRows: [
      { Code: 'ENT-FIN', Nom: 'Finance', Type: 'Department', 'Code entité parente': '', Statut: 'Active', 'Identifiant légal': '', Adresse: '', 'Téléphone': '', Email: '' },
      { Code: 'ENT-COMPTA', Nom: 'Comptabilité', Type: 'Service', 'Code entité parente': 'ENT-FIN', Statut: 'Active', 'Identifiant légal': '', Adresse: '', 'Téléphone': '', Email: '' },
    ],
  }
}
