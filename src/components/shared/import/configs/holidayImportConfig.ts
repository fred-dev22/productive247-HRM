import type { ImportConfig } from '../importTypes'

export function buildHolidayImportConfig(): ImportConfig {
  return {
    title: 'Jours fériés',
    intro: 'Importez plusieurs jours fériés (annuels ou ponctuels) en une fois. Cochez "Récurrent" pour un jour férié qui revient chaque année (seuls le mois et le jour comptent alors) ; laissez décoché pour une date précise valable une seule fois.',
    createEndpoint: '/holidays',
    dependencies: [],
    columns: [
      { key: 'Name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: "Fête de l'indépendance" },
      { key: 'Date', csvHeader: 'Date', label: 'Date', required: true, type: 'date', sample: '2026-06-26' },
      { key: 'IsRecurring', csvHeader: 'Récurrent', label: 'Récurrent chaque année', required: false, type: 'boolean', sample: 'oui' },
    ],
    sampleRows: [
      { Nom: "Fête de l'indépendance", Date: '2026-06-26', 'Récurrent': 'oui' },
      { Nom: 'Journée portes ouvertes', Date: '2026-09-10', 'Récurrent': 'non' },
    ],
    // L'import ne propose pas de limiter un jour férié à une entité (voir
    // Plan de tests #08) — tous les jours fériés importés sont valables pour
    // toute l'entreprise. HolidayType (colonne requise côté backend) est donc
    // toujours 'National' ; le champ n'est pas une saisie utilisateur (voir
    // holiday.service.ts).
    transformPayload: (_row, payload) => ({
      ...payload,
      HolidayType: 'National',
    }),
  }
}
