/**
 * Types du module Recrutement — brancHés sur le vrai backend
 * (productive247-hrm-backend, src/modules/recruitment). Les statuts sont
 * volontairement courts : aucun circuit de validation (décision client du
 * 05/09), une offre passe de Draft à Published (une seule fois) puis Closed,
 * "c'est le RH et c'est entre eux".
 *
 * Les libellés d'entité (`entityName`, `positionTitle`) restent du texte
 * libre : le module vise aussi des postes/candidats externes et les écrans
 * n'affichent qu'un intitulé.
 */

// ── Expression de besoin ───────────────────────────────────────
export type HiringRequestStatus = 'Draft' | 'Open' | 'Closed' | 'Cancelled'

export interface HiringRequest {
  id: string
  referenceCode: string
  positionTitle: string
  entityName: string
  headcount: number
  profile: string
  requestedByName: string
  requestedAt: string
  status: HiringRequestStatus
}

// ── Offre d'emploi ─────────────────────────────────────────────
export type JobOfferStatus = 'Draft' | 'Published' | 'Closed'

export interface JobOffer {
  id: string
  referenceCode: string
  hiringRequestId?: string
  title: string
  entityName: string
  contractType: string
  location: string
  description: string
  status: JobOfferStatus
  publishedAt?: string
  views: number
  applicationsCount: number
  // Jeton opaque du lien partageable du portail carrière.
  publicToken: string
  // Grille d'évaluation d'entretien rattachée (US15).
  evaluationTemplateId?: string
  evaluationTemplateName?: string
  // Renseigné à la clôture — coût total de la campagne (MGA).
  recruitmentCost?: number
}

// ── Candidatures ───────────────────────────────────────────────
export type ApplicationSource = 'Offer' | 'Spontaneous' | 'Internal'
export type ApplicationStatus = 'New' | 'InReview' | 'InterviewScheduled' | 'Retained' | 'Rejected'

export interface ApplicationNote {
  authorName: string
  text: string
  date: string
}

export interface Application {
  id: string
  referenceCode: string
  jobOfferId?: string
  jobOfferTitle?: string
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  source: ApplicationSource
  cvFileName?: string
  // Renseigné pour une candidature interne (source 'Internal') — vrai compte employé.
  employeeId?: string
  status: ApplicationStatus
  appliedAt: string
  notes: ApplicationNote[]
  // Présent si un contrat / une proposition d'embauche a déjà été généré.
  hasContract?: boolean
}

// ── Entretiens ─────────────────────────────────────────────────
export type InterviewStatus = 'Scheduled' | 'Done' | 'Cancelled'
export type InterviewMode = 'InPerson' | 'VideoCall'

export interface InterviewEvaluationTemplate {
  id: string
  name: string
  criteria: string[]
  // Nombre d'offres qui utilisent cette grille (empêche la suppression).
  jobOffersCount?: number
}

export interface InterviewCriterionScore {
  label: string
  score: number
}

export interface InterviewEvaluation {
  score: number
  comment: string
  interviewerName: string
  templateName?: string
  criteriaScores?: InterviewCriterionScore[]
}

export interface InterviewParticipant {
  employeeId?: string
  name: string
  email?: string
}

export interface Interview {
  id: string
  referenceCode: string
  applicationId: string
  candidateName: string
  candidateEmail: string
  jobOfferTitle: string
  scheduledAt: string
  mode: InterviewMode
  location?: string
  meetingLink?: string
  participants: InterviewParticipant[]
  status: InterviewStatus
  evaluation?: InterviewEvaluation
}

// ── Vivier de talents ──────────────────────────────────────────
export type TalentPoolStatus = 'Open' | 'Closed'

export interface TalentPoolEvaluation {
  score: number
  comment: string
  evaluatedByName: string
  date: string
}

export interface TalentPoolEntry {
  id: string
  referenceCode: string
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  tags: string[]
  notes: string
  sourceApplicationId?: string
  addedAt: string
  status: TalentPoolStatus
  evaluations: TalentPoolEvaluation[]
}

// ── Modèles + propositions d'embauche ──────────────────────────
export interface ContractTemplate {
  id: string
  name: string
  contractType: string
  content: string
}

// Proposition d'embauche post-entretien (workflow RH : proposition ->
// négociation -> confirmation). Aucun circuit de validation interne.
export type ContractStatus =
  | 'Draft' | 'Sent' | 'Negotiating' | 'Accepted' | 'Refused' | 'Cancelled'

export interface ContractNegotiationRound {
  roundNo: number
  fromParty: 'HR' | 'Candidate'
  amount?: number
  comment: string
  date: string
}

export interface Contract {
  id: string
  referenceCode: string
  applicationId: string
  candidateName: string
  templateId?: string
  templateName?: string
  jobTitle: string
  entityName: string
  startDate: string
  endDate?: string
  salary: number
  status: ContractStatus
  rejectionReason?: string
  negotiationRounds: ContractNegotiationRound[]
  // Simulation uniquement (voir BACKLOG "Conversion candidat -> employé").
  employeeProfileCreated?: boolean
}

// ── Périodes d'essai ───────────────────────────────────────────
export type TrialStatus = 'OnTrial' | 'Extended' | 'Converted' | 'Cancelled'

export interface TrialEvaluation {
  score: number
  comment: string
  evaluatedByName: string
  date: string
}

export interface TrialEmployee {
  id: string
  referenceCode: string
  contractId: string
  employeeName: string
  jobTitle: string
  entityName: string
  startDate: string
  trialEndDate: string
  status: TrialStatus
  evaluation?: TrialEvaluation
}

// ── Portail carrière public ────────────────────────────────────
export interface PublicJobOffer {
  token: string
  title: string
  entityName: string
  contractType: string
  location: string
  description: string
  publishedAt?: string
  views: number
}
