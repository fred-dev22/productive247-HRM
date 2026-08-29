/**
 * Types du module Recrutement — écrans construits sur données fictives
 * (voir mockSeed.ts), en attendant le backend. Les statuts suivent le même
 * vocabulaire que les autres domaines (LeaveRequest, MissionOrder…) pour que
 * StatusPill les affiche sans configuration supplémentaire là où c'est
 * pertinent (Draft/PendingApproval/Approved/Rejected/Returned/Cancelled).
 */

export type WorkflowStatus =
  | 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Returned' | 'Cancelled'

export interface HiringRequest {
  id: string
  positionTitle: string
  entityName: string
  headcount: number
  profile: string
  requestedByName: string
  requestedAt: string
  status: WorkflowStatus
  rejectionReason?: string
}

export type JobOfferStatus = WorkflowStatus | 'Published' | 'Closed'

export interface JobOffer {
  id: string
  hiringRequestId?: string
  title: string
  entityName: string
  contractType: string
  location: string
  description: string
  status: JobOfferStatus
  publishedAt?: string
  views: number
  rejectionReason?: string
}

// Un stage est une offre d'emploi comme une autre (JobOffer.contractType =
// 'Stage') : pas de source "Internship" separee, une candidature a une offre
// de stage est une candidature "Offer" normale (decision du 25/08).
export type ApplicationSource = 'Offer' | 'Spontaneous'
export type ApplicationStatus = 'New' | 'InReview' | 'InterviewScheduled' | 'Retained' | 'Rejected'

export interface ApplicationNote {
  authorName: string
  text: string
  date: string
}

export interface Application {
  id: string
  jobOfferId?: string
  jobOfferTitle?: string
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  source: ApplicationSource
  cvFileName: string
  status: ApplicationStatus
  appliedAt: string
  notes: ApplicationNote[]
}

export type InterviewStatus = 'Scheduled' | 'Done' | 'Cancelled'
export type InterviewMode = 'InPerson' | 'VideoCall'

export interface InterviewEvaluation {
  score: number
  comment: string
  interviewerName: string
}

export interface InterviewParticipant {
  name: string
  // Optionnel : renseigne par le recruteur (format "Nom <email>" dans le
  // champ Participants) pour que ce participant soit ajoute comme invite
  // sur les boutons "Ajouter a mon calendrier" (voir calendarLinks.ts). Sans
  // email on ne peut pas l'inviter automatiquement, il reste juste affiche.
  email?: string
}

export interface Interview {
  id: string
  applicationId: string
  candidateName: string
  // Toujours connu (recopie d'Application.candidateEmail a la creation) :
  // le candidat est systematiquement invite au calendrier de son entretien.
  candidateEmail: string
  jobOfferTitle: string
  scheduledAt: string
  mode: InterviewMode
  // L'un ou l'autre selon mode, jamais les deux (voir InterviewsView.vue) :
  // location pour un entretien en presentiel, meetingLink pour une visio.
  location?: string
  meetingLink?: string
  participants: InterviewParticipant[]
  status: InterviewStatus
  evaluation?: InterviewEvaluation
}

export interface TalentPoolEntry {
  id: string
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  tags: string[]
  notes: string
  sourceApplicationId?: string
  addedAt: string
}

export interface ContractTemplate {
  id: string
  name: string
  contractType: string
  content: string
}

export type ContractStatus =
  | 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Returned'
  | 'SentToCandidate' | 'AcceptedByCandidate' | 'RefusedByCandidate' | 'Cancelled'

export interface Contract {
  id: string
  applicationId: string
  candidateName: string
  templateId: string
  templateName: string
  jobTitle: string
  entityName: string
  startDate: string
  salary: number
  status: ContractStatus
  rejectionReason?: string
}

export type TrialStatus = 'OnTrial' | 'Extended' | 'Converted' | 'Cancelled'

export interface TrialEvaluation {
  score: number
  comment: string
  evaluatedByName: string
  date: string
}

export interface TrialEmployee {
  id: string
  contractId: string
  employeeName: string
  jobTitle: string
  entityName: string
  startDate: string
  trialEndDate: string
  status: TrialStatus
  evaluation?: TrialEvaluation
}
