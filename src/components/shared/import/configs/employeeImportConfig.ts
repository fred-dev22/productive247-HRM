import { useEntityStore } from '../../../../stores/entities'
import { usePositionStore } from '../../../../stores/positions'
import { useEmployeeCategoryStore } from '../../../../stores/employeeCategories'
import { api } from '../../../../lib/api'
import { generatePassword } from '../../../../lib/password'
import type { ImportConfig } from '../importTypes'

const GENDER_OPTIONS = [
  { value: 'M', label: 'Homme' },
  { value: 'F', label: 'Femme' },
]
const MARITAL_OPTIONS = [
  { value: 'Single', label: 'Célibataire' },
  { value: 'Married', label: 'Marié(e)' },
  { value: 'Divorced', label: 'Divorcé(e)' },
  { value: 'Widowed', label: 'Veuf/Veuve' },
]
const ID_TYPE_OPTIONS = [
  { value: 'NationalId', label: 'CIN' },
  { value: 'Passport', label: 'Passeport' },
  { value: 'ResidencePermit', label: 'Carte de séjour' },
]
const CONTRACT_OPTIONS = [
  { value: 'Permanent', label: 'CDI' },
  { value: 'FixedTerm', label: 'CDD' },
  { value: 'Internship', label: 'Stage' },
  { value: 'Freelance', label: 'Freelance' },
]
const STATUS_OPTIONS = [
  { value: 'Active', label: 'Actif' },
  { value: 'OnTrial', label: "Période d'essai" },
  { value: 'OnLeave', label: 'En congé' },
  { value: 'Inactive', label: 'Désactivé' },
]

export function buildEmployeeImportConfig(): ImportConfig {
  const entityStore = useEntityStore()
  const positionStore = usePositionStore()
  const categoryStore = useEmployeeCategoryStore()

  return {
    title: 'Employés',
    intro: 'Importez plusieurs employés en une fois. Chaque employé doit être rattaché à une entité déjà existante. Le poste et la catégorie sont facultatifs mais doivent aussi déjà exister si vous les renseignez.',
    createEndpoint: '/employees',
    dependencies: [
      {
        label: 'Au moins une entité doit déjà exister (obligatoire pour rattacher un employé)',
        ok: () => entityStore.entities.length > 0,
        routeTo: { name: 'hr-entities' },
        required: true,
      },
      {
        label: 'Des postes existent (facultatif, mais nécessaire si vous voulez affecter un poste)',
        ok: () => positionStore.positions.length > 0,
        routeTo: { path: '/hr/config/classification', query: { tab: 'position' } },
        required: false,
      },
      {
        label: 'Des catégories existent (facultatif, mais nécessaire si vous voulez affecter une catégorie)',
        ok: () => categoryStore.categories.length > 0,
        routeTo: { path: '/hr/config/classification', query: { tab: 'category' } },
        required: false,
      },
    ],
    columns: [
      { key: 'FirstName', csvHeader: 'Prénom', label: 'Prénom', required: true, type: 'text', sample: 'Jean' },
      { key: 'LastName', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Rakoto' },
      { key: 'Gender', csvHeader: 'Genre', label: 'Genre', required: true, type: 'select', sample: 'Homme', options: () => GENDER_OPTIONS },
      { key: 'BirthDate', csvHeader: 'Date de naissance', label: 'Naissance', required: true, type: 'date', sample: '1990-05-12' },
      { key: 'MaritalStatus', csvHeader: 'Situation matrimoniale', label: 'Situation', required: true, type: 'select', sample: 'Célibataire', options: () => MARITAL_OPTIONS },
      { key: 'IdType', csvHeader: 'Type de pièce', label: 'Type pièce', required: true, type: 'select', sample: 'CIN', options: () => ID_TYPE_OPTIONS },
      { key: 'IdNumber', csvHeader: 'Numéro de pièce', label: 'N° pièce', required: false, type: 'text', sample: '' },
      { key: 'Email', csvHeader: 'Email', label: 'Email', required: true, type: 'text', sample: 'jean.rakoto@galana.com' },
      { key: 'MobilePhone', csvHeader: 'Téléphone mobile', label: 'Mobile', required: false, type: 'text', sample: '' },
      { key: 'ContractType', csvHeader: 'Type de contrat', label: 'Contrat', required: true, type: 'select', sample: 'CDI', options: () => CONTRACT_OPTIONS },
      { key: 'HireDate', csvHeader: "Date d'embauche", label: 'Embauche', required: true, type: 'date', sample: '2024-01-15' },
      {
        key: 'OrganizationUnitId', csvHeader: 'Code entité', label: 'Entité', required: true, type: 'select', sample: '',
        options: () => entityStore.entities.map(e => ({ value: e.id, label: e.name, code: e.code })),
      },
      {
        key: 'PositionId', csvHeader: 'Code poste', label: 'Poste', required: false, type: 'select', sample: '',
        options: () => positionStore.positions.map(p => ({ value: p.id, label: p.title, code: p.code })),
      },
      {
        key: 'EmployeeCategoryId', csvHeader: 'Code catégorie', label: 'Catégorie', required: false, type: 'select', sample: '',
        options: () => categoryStore.categories.map(c => ({ value: c.id, label: c.name, code: c.code })),
      },
      { key: 'Status', csvHeader: 'Statut', label: 'Statut', required: true, type: 'select', sample: 'Actif', options: () => STATUS_OPTIONS },
      { key: 'IsExpatriate', csvHeader: 'Expatrié', label: 'Expatrié', required: false, type: 'boolean', sample: '' },
    ],
    extraColumns: [
      { key: 'createAccount', csvHeader: 'Créer un compte', label: 'Créer un compte', required: false, type: 'boolean', sample: '' },
    ],
    sampleRows: [
      {
        Prénom: 'Jean', Nom: 'Rakoto', Genre: 'Homme', 'Date de naissance': '1990-05-12', 'Situation matrimoniale': 'Célibataire',
        'Type de pièce': 'CIN', 'Numéro de pièce': '', Email: 'jean.rakoto@galana.com', 'Téléphone mobile': '',
        'Type de contrat': 'CDI', "Date d'embauche": '2024-01-15', 'Code entité': 'DG', 'Code poste': '', 'Code catégorie': '', Statut: 'Actif', 'Expatrié': 'non',
      },
      {
        Prénom: 'Marie', Nom: 'Andria', Genre: 'Femme', 'Date de naissance': '1988-11-03', 'Situation matrimoniale': "Marié(e)",
        'Type de pièce': 'CIN', 'Numéro de pièce': '', Email: 'marie.andria@galana.com', 'Téléphone mobile': '',
        'Type de contrat': 'CDI', "Date d'embauche": '2023-06-01', 'Code entité': 'DG', 'Code poste': '', 'Code catégorie': '', Statut: 'Actif', 'Expatrié': 'oui',
      },
    ],
    // "Créer un compte" a besoin d'une catégorie (elle determine les
    // permissions du compte, voir onRowCreated) — sans ça, le compte est
    // silencieusement ignoré côté onRowCreated. Signalé ici pour que
    // l'utilisateur le voie avant de lancer l'import plutôt qu'après coup.
    rowValidation(row) {
      if (row.extra.createAccount && !row.values.EmployeeCategoryId) {
        return 'Catégorie requise pour créer un compte utilisateur'
      }
      return undefined
    },
    // Ne cree un compte utilisateur que pour les lignes cochees "Créer un
    // compte" — mot de passe temporaire genere, meme flux que
    // CreateUserAccountDialog.vue (email de bienvenue envoye par le
    // backend). Appel API direct (pas via stores/users.ts) pour eviter un
    // toast par ligne importee.
    async onRowCreated(created, extra) {
      if (!extra.createAccount) return
      const email = created.Email as string | undefined
      const categoryId = created.EmployeeCategoryId as string | undefined
      if (!categoryId) throw new Error('Compte non créé : catégorie manquante')
      if (!email) throw new Error('Compte non créé : email manquant')
      await api.post('/users', {
        Username: email,
        Email: email,
        Password: generatePassword(),
        EmployeeId: created.Id,
        EmployeeCategoryId: categoryId,
        IsActive: true,
        MustChangePassword: true,
      })
    },
  }
}
