import { useJobStore } from '../../../../stores/jobs'
import { useEntityStore } from '../../../../stores/entities'
import type { ImportConfig } from '../importTypes'

export function buildPositionImportConfig(): ImportConfig {
  const jobStore = useJobStore()
  const entityStore = useEntityStore()

  return {
    title: 'Postes',
    intro: 'Importez plusieurs postes en une fois. Chaque poste est rattaché à un métier et peut avoir plusieurs sièges (capacité).',
    createEndpoint: '/positions',
    dependencies: [
      {
        label: 'Au moins un métier doit déjà exister',
        ok: () => jobStore.jobs.length > 0,
        routeTo: { path: '/hr/config/classification', query: { tab: 'job' } },
        required: true,
      },
    ],
    columns: [
      { key: 'Code', csvHeader: 'Code', label: 'Code', required: true, type: 'text', sample: 'POS-DEV1' },
      { key: 'Title', csvHeader: 'Intitulé', label: 'Intitulé', required: true, type: 'text', sample: 'Développeur junior' },
      {
        key: 'JobId', csvHeader: 'Code métier', label: 'Métier', required: true, type: 'select', sample: 'MET-DEV',
        options: () => jobStore.jobs.map(j => ({ value: j.id, label: j.title, code: j.code })),
      },
      {
        key: 'OrganizationUnitId', csvHeader: 'Code entité', label: 'Entité', required: false, type: 'select', sample: '',
        options: () => entityStore.entities.map(e => ({ value: e.id, label: e.name, code: e.code })),
      },
      { key: 'Capacity', csvHeader: 'Places', label: 'Places', required: false, type: 'number', sample: '2' },
    ],
    sampleRows: [
      { Code: 'POS-DEV1', Intitulé: 'Développeur junior', 'Code métier': 'MET-DEV', 'Code entité': '', Places: '2' },
      { Code: 'POS-COMPTA1', Intitulé: 'Comptable senior', 'Code métier': 'MET-COMPTA', 'Code entité': '', Places: '1' },
    ],
  }
}
