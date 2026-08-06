import { useEntityStore } from '../../../../stores/entities'
import type { ImportConfig } from '../importTypes'

export function buildHolidayImportConfig(): ImportConfig {
  const entityStore = useEntityStore()

  return {
    title: 'Jours fériés',
    intro: 'Importez plusieurs jours fériés (annuels ou ponctuels) en une fois. Cochez "Récurrent" pour un jour férié qui revient chaque année (seuls le mois et le jour comptent alors) ; laissez décoché pour une date précise valable une seule fois. Laissez "Entité" vide pour un jour férié valable pour toute l\'entreprise ; renseignez-la pour le limiter à une entité précise.',
    createEndpoint: '/holidays',
    dependencies: [],
    columns: [
      { key: 'Name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: "Fête de l'indépendance" },
      { key: 'Date', csvHeader: 'Date', label: 'Date', required: true, type: 'date', sample: '2026-06-26' },
      { key: 'IsRecurring', csvHeader: 'Récurrent', label: 'Récurrent chaque année', required: false, type: 'boolean', sample: 'oui' },
      {
        key: 'OrganizationUnitId', csvHeader: 'Code entité (optionnel)', label: 'Entité', required: false, type: 'select', sample: '',
        options: () => entityStore.entities.map(e => ({ value: e.id, label: e.name, code: e.code })),
      },
    ],
    sampleRows: [
      { Nom: "Fête de l'indépendance", Date: '2026-06-26', 'Récurrent': 'oui', 'Code entité (optionnel)': '' },
      { Nom: 'Journée portes ouvertes', Date: '2026-09-10', 'Récurrent': 'non', 'Code entité (optionnel)': 'DG' },
    ],
    // HolidayType (colonne requise côté backend) n'est plus une saisie
    // utilisateur — l'ancien champ "Type" (National/Local) ne pilotait rien
    // fonctionnellement, seule la présence de OrganizationUnitId détermine
    // la portée d'un jour férié (voir holiday.service.ts). Dérivé ici pour
    // rester transparent pour l'utilisateur.
    transformPayload: (row, payload) => ({
      ...payload,
      HolidayType: row.values.OrganizationUnitId ? 'Local' : 'National',
    }),
  }
}
