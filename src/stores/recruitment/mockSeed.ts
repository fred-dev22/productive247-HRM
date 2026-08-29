/**
 * Données fictives du module Recrutement — module en design uniquement
 * (pas de backend), voir dev-recrutement-module. Un seul jeu de données
 * partagé par tous les stores de ce dossier pour que les écrans se
 * répondent entre eux (une candidature approuvée fait apparaître un
 * entretien, un contrat généré fait apparaître une période d'essai…),
 * exactement comme le ferait une vraie base au moment du branchement API.
 */
import { reactive } from 'vue'
import type {
  HiringRequest, JobOffer, Application, Interview, TalentPoolEntry,
  ContractTemplate, Contract, TrialEmployee,
} from './types'

let counter = 1000
export function nextId(prefix: string): string { return `${prefix}-${counter++}` }

export const hiringRequests = reactive<HiringRequest[]>([
  {
    id: 'hreq-1', positionTitle: 'Comptable', entityName: 'Direction Finance',
    headcount: 1, profile: 'Bac+3 en comptabilité, 2 ans d\'expérience minimum, maîtrise Excel avancé.',
    requestedByName: 'Hery Rasoanaivo', requestedAt: '2026-08-04', status: 'Approved',
  },
  {
    id: 'hreq-2', positionTitle: 'Technicien de maintenance', entityName: 'Direction Exploitation',
    headcount: 2, profile: 'BTS maintenance industrielle, disponible pour astreintes.',
    requestedByName: 'Nirina Andriamampionona', requestedAt: '2026-08-12', status: 'PendingApproval',
  },
  {
    id: 'hreq-3', positionTitle: 'Assistant RH', entityName: 'Direction des Ressources Humaines',
    headcount: 1, profile: 'Bac+2 RH minimum, bon relationnel, à l\'aise avec les outils bureautiques.',
    requestedByName: 'Christiane Tchako', requestedAt: '2026-08-15', status: 'Draft',
  },
])

export const jobOffers = reactive<JobOffer[]>([
  {
    id: 'offer-1', hiringRequestId: 'hreq-1', title: 'Comptable', entityName: 'Direction Finance',
    contractType: 'CDI', location: 'Antananarivo',
    description: 'Sous la responsabilité du Directeur Financier, vous prenez en charge la comptabilité générale et auxiliaire, les rapprochements bancaires et la préparation des situations mensuelles.',
    status: 'Published', publishedAt: '2026-08-06', views: 214,
  },
  {
    // Clôturée : le poste est pourvu (app-3, Lova Rakotomalala, retenue) —
    // illustre le "coût par recrutement" affiché sur PipelineView.vue.
    id: 'offer-2', hiringRequestId: undefined, title: 'Chauffeur poids lourd', entityName: 'Direction Exploitation',
    contractType: 'CDD', location: 'Toamasina',
    description: 'Conduite de camions-citernes sur le réseau national, respect strict des consignes de sécurité transport de matières dangereuses.',
    status: 'Closed', publishedAt: '2026-07-28', views: 356, recruitmentCost: 450000,
  },
  {
    id: 'offer-3', hiringRequestId: undefined, title: 'Responsable QHSE', entityName: 'Direction Générale',
    contractType: 'CDI', location: 'Antananarivo',
    description: 'Pilotage de la politique qualité, hygiène, sécurité et environnement sur l\'ensemble des sites Galana.',
    status: 'PendingApproval', views: 0,
  },
  {
    id: 'offer-4', hiringRequestId: undefined, title: 'Stagiaire communication', entityName: 'Direction Générale',
    contractType: 'Stage', location: 'Antananarivo',
    description: 'Appui à l\'équipe communication sur les supports internes et les réseaux sociaux, stage de 6 mois.',
    status: 'Published', publishedAt: '2026-08-15', views: 42,
  },
])

export const applications = reactive<Application[]>([
  {
    id: 'app-1', jobOfferId: 'offer-1', jobOfferTitle: 'Comptable',
    candidateName: 'Fara Ratsimbazafy', candidateEmail: 'fara.ratsimbazafy@gmail.com', candidatePhone: '034 12 345 67',
    source: 'Offer', cvFileName: 'CV_Fara_Ratsimbazafy.pdf', status: 'InterviewScheduled', appliedAt: '2026-08-08',
    notes: [{ authorName: 'Christiane Tchako', text: 'Profil solide, 3 ans chez un cabinet comptable.', date: '2026-08-09' }],
  },
  {
    id: 'app-2', jobOfferId: 'offer-1', jobOfferTitle: 'Comptable',
    candidateName: 'Tojo Randrianasolo', candidateEmail: 'tojo.randrianasolo@yahoo.fr', candidatePhone: '033 98 765 43',
    source: 'Offer', cvFileName: 'CV_Tojo_Randrianasolo.pdf', status: 'InReview', appliedAt: '2026-08-10', notes: [],
  },
  {
    id: 'app-3', jobOfferId: 'offer-2', jobOfferTitle: 'Chauffeur poids lourd',
    candidateName: 'Lova Rakotomalala', candidateEmail: 'lova.rakoto@gmail.com', candidatePhone: '032 44 556 78',
    source: 'Offer', cvFileName: 'CV_Lova_Rakotomalala.pdf', status: 'Retained', appliedAt: '2026-08-01',
    notes: [{ authorName: 'Nirina Andriamampionona', text: 'Permis EC valide, 8 ans d\'expérience transport de matières dangereuses.', date: '2026-08-03' }],
  },
  {
    id: 'app-4', jobOfferId: 'offer-2', jobOfferTitle: 'Chauffeur poids lourd',
    candidateName: 'Njaka Rabemananjara', candidateEmail: 'njaka.rabe@hotmail.com', candidatePhone: '034 22 111 09',
    source: 'Offer', cvFileName: 'CV_Njaka_Rabemananjara.pdf', status: 'Rejected', appliedAt: '2026-07-30',
    notes: [{ authorName: 'Nirina Andriamampionona', text: 'Permis EC expiré depuis 4 mois.', date: '2026-08-01' }],
  },
  {
    id: 'app-5', candidateName: 'Miora Andriantsoa', candidateEmail: 'miora.andriantsoa@gmail.com', candidatePhone: '033 77 889 90',
    source: 'Spontaneous', cvFileName: 'CV_Miora_Andriantsoa.pdf', status: 'New', appliedAt: '2026-08-14', notes: [],
  },
  {
    id: 'app-6', jobOfferId: 'offer-4', jobOfferTitle: 'Stagiaire communication',
    candidateName: 'Faniry Rasolofo', candidateEmail: 'faniry.rasolofo@gmail.com', candidatePhone: '032 65 432 10',
    // Candidature a une offre de stage = candidature "Offer" normale, pas de
    // source separee (voir types.ts).
    source: 'Offer', cvFileName: 'CV_Faniry_Rasolofo.pdf', status: 'New', appliedAt: '2026-08-16', notes: [],
  },
])

export const interviews = reactive<Interview[]>([
  {
    id: 'itw-1', applicationId: 'app-1', candidateName: 'Fara Ratsimbazafy', candidateEmail: 'fara.ratsimbazafy@gmail.com', jobOfferTitle: 'Comptable',
    scheduledAt: '2026-08-25T10:00:00', mode: 'VideoCall', meetingLink: 'https://meet.google.com/abc-defg-hij',
    // Un participant avec email (invite automatiquement au calendrier) et un
    // sans (juste affiche) : illustre les deux cas geres par le formulaire.
    participants: [{ name: 'Christiane Tchako', email: 'christiane.tchako@galana.com' }, { name: 'Hery Rasoanaivo' }],
    status: 'Scheduled',
  },
  {
    id: 'itw-2', applicationId: 'app-3', candidateName: 'Lova Rakotomalala', candidateEmail: 'lova.rakoto@gmail.com', jobOfferTitle: 'Chauffeur poids lourd',
    scheduledAt: '2026-08-05T09:00:00', mode: 'InPerson', location: 'Site Toamasina',
    participants: [{ name: 'Nirina Andriamampionona', email: 'nirina.andriamampionona@galana.com' }],
    status: 'Done', evaluation: { score: 4, comment: 'Très bonne connaissance des consignes de sécurité, disponible immédiatement.', interviewerName: 'Nirina Andriamampionona' },
  },
])

export const talentPool = reactive<TalentPoolEntry[]>([
  {
    id: 'tp-1', candidateName: 'Njaka Rabemananjara', candidateEmail: 'njaka.rabe@hotmail.com', candidatePhone: '034 22 111 09',
    tags: ['Chauffeur', 'Permis EC'], notes: 'Bon profil, à recontacter au renouvellement de son permis.',
    sourceApplicationId: 'app-4', addedAt: '2026-08-02',
  },
  {
    id: 'tp-2', candidateName: 'Bako Randriamahefa', candidateEmail: 'bako.randriamahefa@gmail.com', candidatePhone: '033 11 222 33',
    tags: ['Comptable', 'Bilingue FR/EN'], notes: 'Candidature spontanée reçue en juin, profil intéressant pour un futur poste senior.',
    addedAt: '2026-06-18',
  },
])

export const contractTemplates = reactive<ContractTemplate[]>([
  {
    id: 'tpl-1', name: 'CDI standard', contractType: 'CDI',
    content: 'Entre GALANA et {{nom_candidat}}, il est convenu un contrat à durée indéterminée pour le poste de {{poste}} au sein de {{entite}}, à compter du {{date_debut}}, moyennant une rémunération mensuelle brute de {{salaire}} Ariary.',
  },
  {
    id: 'tpl-2', name: 'CDD standard', contractType: 'CDD',
    content: 'Entre GALANA et {{nom_candidat}}, il est convenu un contrat à durée déterminée pour le poste de {{poste}} au sein de {{entite}}, à compter du {{date_debut}}, moyennant une rémunération mensuelle brute de {{salaire}} Ariary.',
  },
])

export const contracts = reactive<Contract[]>([
  {
    id: 'ctr-1', applicationId: 'app-3', candidateName: 'Lova Rakotomalala', templateId: 'tpl-2', templateName: 'CDD standard',
    jobTitle: 'Chauffeur poids lourd', entityName: 'Direction Exploitation', startDate: '2026-09-01', salary: 950000,
    status: 'AcceptedByCandidate',
  },
])

export const trialEmployees = reactive<TrialEmployee[]>([
  {
    id: 'trial-1', contractId: 'ctr-1', employeeName: 'Lova Rakotomalala', jobTitle: 'Chauffeur poids lourd',
    entityName: 'Direction Exploitation', startDate: '2026-09-01', trialEndDate: '2026-10-31', status: 'OnTrial',
  },
])
