import type { ImportConfig } from '../importTypes'

const WORKFLOW_OPTIONS = [
  { value: 'Standard', label: 'Standard (avec validation)' },
  { value: 'Medical', label: 'Médical (déclaration a posteriori)' },
]

export function buildLeaveTypeImportConfig(): ImportConfig {
  return {
    title: "Types d'absence",
    intro: "Importez plusieurs types de congé/absence en une fois. La couleur est un code hexadécimal (ex: #006B3C), utilisée pour l'afficher dans le calendrier.",
    createEndpoint: '/leave-types',
    dependencies: [],
    columns: [
      { key: 'Code', csvHeader: 'Code', label: 'Code', required: true, type: 'text', sample: 'ANNUAL' },
      { key: 'Name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Congé annuel' },
      { key: 'WorkflowType', csvHeader: 'Workflow', label: 'Workflow', required: true, type: 'select', sample: 'Standard (avec validation)', options: () => WORKFLOW_OPTIONS },
      { key: 'DaysPerYear', csvHeader: 'Jours par an', label: 'Jours/an', required: true, type: 'number', sample: '30' },
      { key: 'MonthlyAccrual', csvHeader: 'Acquisition mensuelle', label: 'Mensuel', required: false, type: 'boolean', sample: 'oui' },
      { key: 'DocumentRequired', csvHeader: 'Justificatif requis', label: 'Justificatif', required: false, type: 'boolean', sample: 'non' },
      { key: 'MinNoticeDays', csvHeader: 'Préavis minimum (jours)', label: 'Préavis', required: false, type: 'number', sample: '7' },
      { key: 'Color', csvHeader: 'Couleur', label: 'Couleur', required: true, type: 'text', sample: '#006B3C' },
    ],
    sampleRows: [
      { Code: 'ANNUAL', Nom: 'Congé annuel', Workflow: 'Standard (avec validation)', 'Jours par an': '30', 'Acquisition mensuelle': 'oui', 'Justificatif requis': 'non', 'Préavis minimum (jours)': '7', Couleur: '#006B3C' },
      { Code: 'SICK', Nom: 'Congé maladie', Workflow: 'Médical (déclaration a posteriori)', 'Jours par an': '15', 'Acquisition mensuelle': 'non', 'Justificatif requis': 'oui', 'Préavis minimum (jours)': '0', Couleur: '#C8102E' },
    ],
  }
}
