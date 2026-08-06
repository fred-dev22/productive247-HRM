import { useEntityStore } from '../../../../stores/entities'
import type { ImportConfig } from '../importTypes'

const TYPE_OPTIONS = [
  { value: 'National', label: 'National' },
  { value: 'Local', label: 'Local' },
]

export function buildHolidayImportConfig(): ImportConfig {
  const entityStore = useEntityStore()

  return {
    title: 'Jours fériés',
    intro: 'Importez plusieurs jours fériés (annuels ou ponctuels) en une fois. Cochez "Récurrent" pour un jour férié qui revient chaque année (seuls le mois et le jour comptent alors) ; laissez décoché pour une date précise valable une seule fois.',
    createEndpoint: '/holidays',
    dependencies: [],
    columns: [
      { key: 'Name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: "Fête de l'indépendance" },
      { key: 'Date', csvHeader: 'Date', label: 'Date', required: true, type: 'date', sample: '2026-06-26' },
      { key: 'HolidayType', csvHeader: 'Type', label: 'Type', required: true, type: 'select', sample: 'National', options: () => TYPE_OPTIONS },
      { key: 'IsRecurring', csvHeader: 'Récurrent', label: 'Récurrent chaque année', required: false, type: 'boolean', sample: 'oui' },
      {
        key: 'OrganizationUnitId', csvHeader: 'Code entité (si Local)', label: 'Entité', required: false, type: 'select', sample: '',
        options: () => entityStore.entities.map(e => ({ value: e.id, label: e.name, code: e.code })),
      },
    ],
    sampleRows: [
      { Nom: "Fête de l'indépendance", Date: '2026-06-26', Type: 'National', 'Récurrent': 'oui', 'Code entité (si Local)': '' },
      { Nom: 'Journée portes ouvertes', Date: '2026-09-10', Type: 'Local', 'Récurrent': 'non', 'Code entité (si Local)': '' },
    ],
  }
}
