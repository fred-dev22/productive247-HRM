/**
 * Stores Pinia du module Recrutement — branchés sur le vrai backend
 * (productive247-hrm-backend, src/modules/recruitment). Les noms de stores et
 * d'actions reprennent ceux de l'ancienne version fictive pour limiter les
 * changements dans les écrans ; l'implémentation, elle, fait de vrais appels
 * API et re-mappe les réponses (PascalCase backend -> camelCase front), comme
 * les autres stores réels de l'app (voir stores/leaveTypes.ts).
 *
 * Aucun circuit de validation (décision client du 05/09) : pas d'action
 * approve/reject/submit-pour-approbation sur les offres, les besoins ou les
 * propositions d'embauche.
 */
import { defineStore } from 'pinia'
import { api, getApiErrorMessage } from '../../lib/api'
import type {
  HiringRequest, JobOffer, Application, ApplicationNote, ApplicationStatus,
  Interview, InterviewEvaluation, InterviewEvaluationTemplate, InterviewParticipant,
  TalentPoolEntry, TalentPoolEvaluation, Contract, ContractNegotiationRound, ContractTemplate,
  TrialEmployee, PublicJobOffer,
} from './types'

export * from './types'

const num = (v: unknown): number => (v == null ? 0 : Number(v))
const day = (v: unknown): string => (v ? String(v).slice(0, 10) : '')
const iso = (v: unknown): string => (v ? String(v) : '')

// ── Mappers backend -> front ───────────────────────────────────
type Row = Record<string, any>

function mapHiringRequest(r: Row): HiringRequest {
  return {
    id: r.Id,
    referenceCode: r.ReferenceCode,
    positionTitle: r.PositionTitle,
    entityName: r.EntityName,
    headcount: num(r.Headcount),
    profile: r.Profile,
    requestedByName: r.createdByEmployee?.FullName ?? '',
    requestedAt: day(r.CreatedAt),
    status: r.Status,
  }
}

function mapJobOffer(r: Row): JobOffer {
  return {
    id: r.Id,
    referenceCode: r.ReferenceCode,
    hiringRequestId: r.HiringRequestId ?? undefined,
    title: r.Title,
    entityName: r.EntityName,
    contractType: r.ContractType,
    location: r.Location,
    description: r.Description,
    status: r.Status,
    publishedAt: r.PublishedAt ? day(r.PublishedAt) : undefined,
    views: num(r.Views),
    applicationsCount: num(r._count?.applications),
    publicToken: r.PublicToken,
    evaluationTemplateId: r.InterviewEvaluationTemplateId ?? undefined,
    evaluationTemplateName: r.evaluationTemplate?.Name ?? undefined,
    recruitmentCost: r.RecruitmentCost != null ? num(r.RecruitmentCost) : undefined,
  }
}

function mapNote(r: Row): ApplicationNote {
  return { authorName: r.AuthorName, text: r.Text, date: day(r.CreatedAt) }
}

function mapApplication(r: Row): Application {
  return {
    id: r.Id,
    referenceCode: r.ReferenceCode,
    jobOfferId: r.JobOfferId ?? undefined,
    jobOfferTitle: r.JobOfferTitle ?? r.jobOffer?.Title ?? undefined,
    candidateName: r.CandidateName,
    candidateEmail: r.CandidateEmail,
    candidatePhone: r.CandidatePhone,
    source: r.Source,
    cvFileName: r.CvFileName ?? undefined,
    employeeId: r.EmployeeId ?? undefined,
    status: r.Status,
    appliedAt: day(r.AppliedAt),
    notes: (r.notes ?? []).map(mapNote),
    hasContract: !!r.contract,
  }
}

function mapParticipant(r: Row): InterviewParticipant {
  return { employeeId: r.EmployeeId ?? undefined, name: r.Name, email: r.Email ?? undefined }
}

function mapInterviewEvaluation(r: Row | null | undefined): InterviewEvaluation | undefined {
  if (!r) return undefined
  return {
    score: num(r.Score),
    comment: r.Comment,
    interviewerName: r.InterviewerName,
    templateName: r.TemplateName ?? undefined,
    criteriaScores: (r.criteriaScores ?? []).map((c: Row) => ({ label: c.Label, score: num(c.Score) })),
  }
}

function mapInterview(r: Row): Interview {
  return {
    id: r.Id,
    referenceCode: r.ReferenceCode,
    applicationId: r.ApplicationId,
    candidateName: r.application?.CandidateName ?? '',
    candidateEmail: r.application?.CandidateEmail ?? '',
    jobOfferTitle: r.application?.JobOfferTitle ?? 'Poste',
    scheduledAt: iso(r.ScheduledAt),
    mode: r.Mode,
    location: r.Location ?? undefined,
    meetingLink: r.MeetingLink ?? undefined,
    participants: (r.participants ?? []).map(mapParticipant),
    status: r.Status,
    evaluation: mapInterviewEvaluation(r.evaluation),
  }
}

function mapEvalTemplate(r: Row): InterviewEvaluationTemplate {
  return {
    id: r.Id,
    name: r.Name,
    criteria: (r.criteria ?? []).map((c: Row) => c.Label),
    jobOffersCount: num(r._count?.jobOffers),
  }
}

function mapTalentPoolEvaluation(r: Row): TalentPoolEvaluation {
  return { score: num(r.Score), comment: r.Comment, evaluatedByName: r.EvaluatedByName, date: day(r.CreatedAt) }
}

function mapTalentPoolEntry(r: Row): TalentPoolEntry {
  return {
    id: r.Id,
    referenceCode: r.ReferenceCode,
    candidateName: r.CandidateName,
    candidateEmail: r.CandidateEmail,
    candidatePhone: r.CandidatePhone,
    tags: r.Tags ? String(r.Tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    notes: r.Notes ?? '',
    sourceApplicationId: r.SourceApplicationId ?? undefined,
    addedAt: day(r.AddedAt),
    status: r.Status,
    evaluations: (r.evaluations ?? []).map(mapTalentPoolEvaluation),
  }
}

function mapContractTemplate(r: Row): ContractTemplate {
  return { id: r.Id, name: r.Name, contractType: r.ContractType, content: r.Content }
}

function mapNegotiationRound(r: Row): ContractNegotiationRound {
  return {
    roundNo: num(r.RoundNo),
    fromParty: r.FromParty,
    amount: r.Amount != null ? num(r.Amount) : undefined,
    comment: r.Comment,
    date: day(r.CreatedAt),
  }
}

function mapContract(r: Row): Contract {
  return {
    id: r.Id,
    referenceCode: r.ReferenceCode,
    applicationId: r.ApplicationId,
    candidateName: r.CandidateName,
    templateId: r.TemplateId ?? undefined,
    templateName: r.TemplateName ?? undefined,
    jobTitle: r.JobTitle,
    entityName: r.EntityName,
    startDate: day(r.StartDate),
    endDate: r.EndDate ? day(r.EndDate) : undefined,
    salary: num(r.Salary),
    status: r.Status,
    rejectionReason: r.RejectionReason ?? undefined,
    negotiationRounds: (r.negotiationRounds ?? []).map(mapNegotiationRound),
    employeeProfileCreated: !!r.EmployeeProfileCreated,
  }
}

function mapTrialEmployee(r: Row): TrialEmployee {
  const hasEval = r.EvalScore != null || r.EvalComment != null
  return {
    id: r.Id,
    referenceCode: r.ReferenceCode,
    contractId: r.ContractId,
    employeeName: r.EmployeeName,
    jobTitle: r.JobTitle,
    entityName: r.EntityName,
    startDate: day(r.StartDate),
    trialEndDate: day(r.TrialEndDate),
    status: r.Status,
    evaluation: hasEval
      ? {
          score: num(r.EvalScore),
          comment: r.EvalComment ?? '',
          evaluatedByName: r.EvalByName ?? '',
          date: day(r.EvalAt),
        }
      : undefined,
  }
}

function upsert<T extends { id: string }>(list: T[], row: T) {
  const i = list.findIndex((x) => x.id === row.id)
  if (i >= 0) list[i] = row
  else list.unshift(row)
}

// ═══════════════════════════════════════════════════════════════
// Expressions de besoin
// ═══════════════════════════════════════════════════════════════
export const useHiringRequestStore = defineStore('recruitment-hiring-requests', {
  state: () => ({ items: [] as HiringRequest[], loading: false, error: null as string | null }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/recruitment/hiring-requests')
        this.items = data.map(mapHiringRequest)
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement des expressions de besoin impossible')
      } finally {
        this.loading = false
      }
    },
    async create(payload: { positionTitle: string; entityName: string; headcount: number; profile: string }) {
      const { data } = await api.post<Row>('/recruitment/hiring-requests', {
        PositionTitle: payload.positionTitle,
        EntityName: payload.entityName,
        Headcount: payload.headcount,
        Profile: payload.profile,
      })
      upsert(this.items, mapHiringRequest(data))
      return mapHiringRequest(data)
    },
    async update(id: string, payload: Partial<{ positionTitle: string; entityName: string; headcount: number; profile: string }>) {
      const { data } = await api.patch<Row>(`/recruitment/hiring-requests/${id}`, {
        PositionTitle: payload.positionTitle,
        EntityName: payload.entityName,
        Headcount: payload.headcount,
        Profile: payload.profile,
      })
      upsert(this.items, mapHiringRequest(data))
    },
    async submit(id: string) {
      const { data } = await api.post<Row>(`/recruitment/hiring-requests/${id}/submit`)
      upsert(this.items, mapHiringRequest(data))
    },
    async close(id: string) {
      const { data } = await api.post<Row>(`/recruitment/hiring-requests/${id}/close`)
      upsert(this.items, mapHiringRequest(data))
    },
    async cancel(id: string) {
      const { data } = await api.post<Row>(`/recruitment/hiring-requests/${id}/cancel`)
      upsert(this.items, mapHiringRequest(data))
    },
    async remove(id: string) {
      await api.delete(`/recruitment/hiring-requests/${id}`)
      this.items = this.items.filter((x) => x.id !== id)
    },
  },
})

// ═══════════════════════════════════════════════════════════════
// Offres d'emploi
// ═══════════════════════════════════════════════════════════════
export const useJobOfferStore = defineStore('recruitment-job-offers', {
  state: () => ({ items: [] as JobOffer[], loading: false, error: null as string | null }),
  getters: {
    published: (state) => state.items.filter((o) => o.status === 'Published'),
  },
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/recruitment/job-offers')
        this.items = data.map(mapJobOffer)
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement des offres impossible')
      } finally {
        this.loading = false
      }
    },
    async create(payload: {
      hiringRequestId?: string; title: string; entityName: string; contractType: string;
      location: string; description: string; evaluationTemplateId?: string
    }) {
      const { data } = await api.post<Row>('/recruitment/job-offers', {
        HiringRequestId: payload.hiringRequestId,
        Title: payload.title,
        EntityName: payload.entityName,
        ContractType: payload.contractType,
        Location: payload.location,
        Description: payload.description,
        InterviewEvaluationTemplateId: payload.evaluationTemplateId,
      })
      upsert(this.items, mapJobOffer(data))
      return mapJobOffer(data)
    },
    async update(id: string, payload: Partial<{
      hiringRequestId: string | null; title: string; entityName: string; contractType: string;
      location: string; description: string; evaluationTemplateId: string | null
    }>) {
      const { data } = await api.patch<Row>(`/recruitment/job-offers/${id}`, {
        HiringRequestId: payload.hiringRequestId,
        Title: payload.title,
        EntityName: payload.entityName,
        ContractType: payload.contractType,
        Location: payload.location,
        Description: payload.description,
        InterviewEvaluationTemplateId: payload.evaluationTemplateId,
      })
      upsert(this.items, mapJobOffer(data))
    },
    async publish(id: string) {
      const { data } = await api.post<Row>(`/recruitment/job-offers/${id}/publish`)
      upsert(this.items, mapJobOffer(data))
    },
    async close(id: string, recruitmentCost?: number) {
      const { data } = await api.post<Row>(`/recruitment/job-offers/${id}/close`, { RecruitmentCost: recruitmentCost })
      upsert(this.items, mapJobOffer(data))
    },
    async remove(id: string) {
      await api.delete(`/recruitment/job-offers/${id}`)
      this.items = this.items.filter((x) => x.id !== id)
    },
    applicationsCount(id: string): number {
      return this.items.find((o) => o.id === id)?.applicationsCount ?? 0
    },
  },
})

// ═══════════════════════════════════════════════════════════════
// Candidatures
// ═══════════════════════════════════════════════════════════════
export const useApplicationStore = defineStore('recruitment-applications', {
  state: () => ({
    items: [] as Application[],
    myInternal: [] as Application[],
    // Offres publiées visibles depuis l'espace employé (US12) — version
    // allégée servie sans permission recrutement.
    openInternalOffers: [] as { id: string; referenceCode: string; title: string; entityName: string; contractType: string; location: string; description: string }[],
    loading: false,
    error: null as string | null,
  }),
  getters: {
    fromOffers: (state) => state.items.filter((a) => a.source === 'Offer' || a.source === 'Internal'),
    spontaneous: (state) => state.items.filter((a) => a.source === 'Spontaneous'),
    internal: (state) => state.items.filter((a) => a.source === 'Internal'),
  },
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/recruitment/applications')
        this.items = data.map(mapApplication)
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement des candidatures impossible')
      } finally {
        this.loading = false
      }
    },
    // Enregistrement d'une candidature cote RH (CV recu par un autre canal...).
    async create(payload: {
      jobOfferId?: string; candidateName: string; candidateEmail: string;
      candidatePhone: string; source: 'Offer' | 'Spontaneous' | 'Internal'; cvFileName?: string
    }) {
      const { data } = await api.post<Row>('/recruitment/applications', {
        JobOfferId: payload.jobOfferId,
        CandidateName: payload.candidateName,
        CandidateEmail: payload.candidateEmail,
        CandidatePhone: payload.candidatePhone,
        Source: payload.source,
        CvFileName: payload.cvFileName,
      })
      upsert(this.items, mapApplication(data))
      return mapApplication(data)
    },
    async setStatus(id: string, status: ApplicationStatus) {
      const { data } = await api.patch<Row>(`/recruitment/applications/${id}/status`, { Status: status })
      upsert(this.items, mapApplication(data))
    },
    async addNote(id: string, text: string) {
      const { data } = await api.post<Row>(`/recruitment/applications/${id}/notes`, { Text: text })
      upsert(this.items, mapApplication(data))
    },
    async addToTalentPool(id: string, tags: string[] = [], notes = '') {
      await api.post(`/recruitment/applications/${id}/talent-pool`, { Tags: tags, Notes: notes })
    },
    async remove(id: string) {
      await api.delete(`/recruitment/applications/${id}`)
      this.items = this.items.filter((x) => x.id !== id)
    },
    // ── Cote espace employe (US12) ──
    async fetchMyInternal() {
      const { data } = await api.get<Row[]>('/recruitment/my-applications')
      this.myInternal = data.map(mapApplication)
    },
    async fetchOpenInternalOffers() {
      const { data } = await api.get<Row[]>('/recruitment/my-applications/offers')
      this.openInternalOffers = data.map((o: Row) => ({
        id: o.Id,
        referenceCode: o.ReferenceCode,
        title: o.Title,
        entityName: o.EntityName,
        contractType: o.ContractType,
        location: o.Location,
        description: o.Description,
      }))
    },
    async selfApplyInternal(jobOfferId: string) {
      const { data } = await api.post<Row>('/recruitment/my-applications', { JobOfferId: jobOfferId })
      this.myInternal.unshift(mapApplication(data))
      return mapApplication(data)
    },
    async withdrawInternal(id: string) {
      await api.delete(`/recruitment/my-applications/${id}`)
      const row = this.myInternal.find((a) => a.id === id)
      if (row) row.status = 'Rejected'
    },
  },
})

// ═══════════════════════════════════════════════════════════════
// Entretiens
// ═══════════════════════════════════════════════════════════════
export const useInterviewStore = defineStore('recruitment-interviews', {
  state: () => ({
    items: [] as Interview[],
    evaluationTemplates: [] as InterviewEvaluationTemplate[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/recruitment/interviews')
        this.items = data.map(mapInterview)
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement des entretiens impossible')
      } finally {
        this.loading = false
      }
    },
    async fetchTemplates() {
      const { data } = await api.get<Row[]>('/recruitment/evaluation-templates')
      this.evaluationTemplates = data.map(mapEvalTemplate)
    },
    async schedule(payload: {
      applicationId: string; scheduledAt: string; mode: 'InPerson' | 'VideoCall';
      location?: string; meetingLink?: string; durationMinutes?: number;
      participants: InterviewParticipant[]
    }) {
      const { data } = await api.post<Row>('/recruitment/interviews', {
        ApplicationId: payload.applicationId,
        ScheduledAt: payload.scheduledAt,
        Mode: payload.mode,
        Location: payload.location,
        MeetingLink: payload.meetingLink,
        DurationMinutes: payload.durationMinutes,
        Participants: payload.participants.map((p) => ({ EmployeeId: p.employeeId, Name: p.name, Email: p.email })),
      })
      upsert(this.items, mapInterview(data))
      return mapInterview(data)
    },
    async update(id: string, payload: Partial<{
      scheduledAt: string; mode: 'InPerson' | 'VideoCall'; location: string; meetingLink: string;
      durationMinutes: number; participants: InterviewParticipant[]
    }>) {
      const { data } = await api.patch<Row>(`/recruitment/interviews/${id}`, {
        ScheduledAt: payload.scheduledAt,
        Mode: payload.mode,
        Location: payload.location,
        MeetingLink: payload.meetingLink,
        DurationMinutes: payload.durationMinutes,
        Participants: payload.participants?.map((p) => ({ EmployeeId: p.employeeId, Name: p.name, Email: p.email })),
      })
      upsert(this.items, mapInterview(data))
    },
    async markDone(id: string) {
      const { data } = await api.post<Row>(`/recruitment/interviews/${id}/done`)
      upsert(this.items, mapInterview(data))
    },
    async cancel(id: string) {
      const { data } = await api.post<Row>(`/recruitment/interviews/${id}/cancel`)
      upsert(this.items, mapInterview(data))
    },
    async evaluate(id: string, evaluation: {
      score?: number; comment: string; interviewerName?: string;
      templateId?: string; criteriaScores?: { label: string; score: number }[]
    }) {
      const { data } = await api.post<Row>(`/recruitment/interviews/${id}/evaluate`, {
        Score: evaluation.score,
        Comment: evaluation.comment,
        InterviewerName: evaluation.interviewerName,
        TemplateId: evaluation.templateId,
        CriteriaScores: evaluation.criteriaScores?.map((c) => ({ Label: c.label, Score: c.score })),
      })
      upsert(this.items, mapInterview(data))
    },
  },
})

// ═══════════════════════════════════════════════════════════════
// Grilles d'evaluation d'entretien (US15)
// ═══════════════════════════════════════════════════════════════
export const useEvalTemplateStore = defineStore('recruitment-eval-templates', {
  state: () => ({ items: [] as InterviewEvaluationTemplate[], loading: false, error: null as string | null }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/recruitment/evaluation-templates')
        this.items = data.map(mapEvalTemplate)
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement des grilles impossible')
      } finally {
        this.loading = false
      }
    },
    async create(payload: { name: string; criteria: string[] }) {
      const { data } = await api.post<Row>('/recruitment/evaluation-templates', {
        Name: payload.name,
        Criteria: payload.criteria,
      })
      upsert(this.items, mapEvalTemplate(data))
      return mapEvalTemplate(data)
    },
    async update(id: string, payload: Partial<{ name: string; criteria: string[] }>) {
      const { data } = await api.patch<Row>(`/recruitment/evaluation-templates/${id}`, {
        Name: payload.name,
        Criteria: payload.criteria,
      })
      upsert(this.items, mapEvalTemplate(data))
    },
    async remove(id: string) {
      await api.delete(`/recruitment/evaluation-templates/${id}`)
      this.items = this.items.filter((x) => x.id !== id)
    },
  },
})

// ═══════════════════════════════════════════════════════════════
// Vivier de talents
// ═══════════════════════════════════════════════════════════════
export const useTalentPoolStore = defineStore('recruitment-talent-pool', {
  state: () => ({ items: [] as TalentPoolEntry[], loading: false, error: null as string | null }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/recruitment/talent-pool')
        this.items = data.map(mapTalentPoolEntry)
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement du vivier impossible')
      } finally {
        this.loading = false
      }
    },
    async add(payload: {
      candidateName: string; candidateEmail: string; candidatePhone: string;
      tags: string[]; notes: string; sourceApplicationId?: string
    }) {
      const { data } = await api.post<Row>('/recruitment/talent-pool', {
        CandidateName: payload.candidateName,
        CandidateEmail: payload.candidateEmail,
        CandidatePhone: payload.candidatePhone,
        Tags: payload.tags,
        Notes: payload.notes,
        SourceApplicationId: payload.sourceApplicationId,
      })
      upsert(this.items, mapTalentPoolEntry(data))
    },
    async update(id: string, patch: Partial<{
      candidateName: string; candidateEmail: string; candidatePhone: string; tags: string[]; notes: string
    }>) {
      const { data } = await api.patch<Row>(`/recruitment/talent-pool/${id}`, {
        CandidateName: patch.candidateName,
        CandidateEmail: patch.candidateEmail,
        CandidatePhone: patch.candidatePhone,
        Tags: patch.tags,
        Notes: patch.notes,
      })
      upsert(this.items, mapTalentPoolEntry(data))
    },
    async remove(id: string) {
      await api.delete(`/recruitment/talent-pool/${id}`)
      this.items = this.items.filter((x) => x.id !== id)
    },
    async close(id: string) {
      const { data } = await api.post<Row>(`/recruitment/talent-pool/${id}/close`)
      upsert(this.items, mapTalentPoolEntry(data))
    },
    async reopen(id: string) {
      const { data } = await api.post<Row>(`/recruitment/talent-pool/${id}/reopen`)
      upsert(this.items, mapTalentPoolEntry(data))
    },
    async addEvaluation(id: string, evaluation: { score: number; comment: string }) {
      const { data } = await api.post<Row>(`/recruitment/talent-pool/${id}/evaluations`, {
        Score: evaluation.score,
        Comment: evaluation.comment,
      })
      upsert(this.items, mapTalentPoolEntry(data))
    },
    searchByTag(query: string) {
      const q = query.trim().toLowerCase()
      if (!q) return this.items
      return this.items.filter(
        (e) => e.tags.some((t) => t.toLowerCase().includes(q)) || e.candidateName.toLowerCase().includes(q),
      )
    },
  },
})

// ═══════════════════════════════════════════════════════════════
// Propositions d'embauche + modeles de contrat
// ═══════════════════════════════════════════════════════════════
export const useContractStore = defineStore('recruitment-contracts', {
  state: () => ({
    items: [] as Contract[],
    templates: [] as ContractTemplate[],
    eligibleApplications: [] as { id: string; referenceCode: string; candidateName: string; jobOfferTitle?: string }[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/recruitment/contracts')
        this.items = data.map(mapContract)
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement des propositions impossible')
      } finally {
        this.loading = false
      }
    },
    async fetchTemplates() {
      const { data } = await api.get<Row[]>('/recruitment/contract-templates')
      this.templates = data.map(mapContractTemplate)
    },
    async fetchEligibleApplications() {
      const { data } = await api.get<Row[]>('/recruitment/contracts/eligible-applications')
      this.eligibleApplications = data.map((r: Row) => ({
        id: r.Id,
        referenceCode: r.ReferenceCode,
        candidateName: r.CandidateName,
        jobOfferTitle: r.JobOfferTitle ?? undefined,
      }))
      return this.eligibleApplications
    },
    async createTemplate(name: string, contractType: string, content: string) {
      const { data } = await api.post<Row>('/recruitment/contract-templates', {
        Name: name, ContractType: contractType, Content: content,
      })
      this.templates.push(mapContractTemplate(data))
    },
    async updateTemplate(id: string, patch: Partial<{ name: string; contractType: string; content: string }>) {
      const { data } = await api.patch<Row>(`/recruitment/contract-templates/${id}`, {
        Name: patch.name, ContractType: patch.contractType, Content: patch.content,
      })
      const i = this.templates.findIndex((t) => t.id === id)
      if (i >= 0) this.templates[i] = mapContractTemplate(data)
    },
    async removeTemplate(id: string) {
      await api.delete(`/recruitment/contract-templates/${id}`)
      this.templates = this.templates.filter((t) => t.id !== id)
    },
    async generate(payload: {
      applicationId: string; templateId?: string; jobTitle: string; entityName: string;
      startDate: string; endDate?: string; salary: number
    }) {
      const { data } = await api.post<Row>('/recruitment/contracts', {
        ApplicationId: payload.applicationId,
        TemplateId: payload.templateId,
        JobTitle: payload.jobTitle,
        EntityName: payload.entityName,
        StartDate: payload.startDate,
        EndDate: payload.endDate,
        Salary: payload.salary,
      })
      upsert(this.items, mapContract(data))
      return mapContract(data)
    },
    async update(id: string, patch: Partial<{
      templateId: string | null; jobTitle: string; entityName: string; startDate: string; endDate: string | null; salary: number
    }>) {
      const { data } = await api.patch<Row>(`/recruitment/contracts/${id}`, {
        TemplateId: patch.templateId,
        JobTitle: patch.jobTitle,
        EntityName: patch.entityName,
        StartDate: patch.startDate,
        EndDate: patch.endDate,
        Salary: patch.salary,
      })
      upsert(this.items, mapContract(data))
    },
    async send(id: string) {
      const { data } = await api.post<Row>(`/recruitment/contracts/${id}/send`)
      upsert(this.items, mapContract(data))
    },
    async negotiate(id: string, round: { fromParty: 'HR' | 'Candidate'; amount?: number; comment: string }) {
      const { data } = await api.post<Row>(`/recruitment/contracts/${id}/negotiate`, {
        FromParty: round.fromParty, Amount: round.amount, Comment: round.comment,
      })
      upsert(this.items, mapContract(data))
    },
    async accept(id: string) {
      const { data } = await api.post<Row>(`/recruitment/contracts/${id}/accept`)
      upsert(this.items, mapContract(data))
    },
    async refuse(id: string, reason: string) {
      const { data } = await api.post<Row>(`/recruitment/contracts/${id}/refuse`, { RejectionReason: reason })
      upsert(this.items, mapContract(data))
    },
    async cancel(id: string) {
      const { data } = await api.post<Row>(`/recruitment/contracts/${id}/cancel`)
      upsert(this.items, mapContract(data))
    },
    async markEmployeeProfileCreated(id: string) {
      const { data } = await api.post<Row>(`/recruitment/contracts/${id}/employee-profile`)
      upsert(this.items, mapContract(data))
    },
  },
})

// ═══════════════════════════════════════════════════════════════
// Periodes d'essai
// ═══════════════════════════════════════════════════════════════
export const useTrialStore = defineStore('recruitment-trial', {
  state: () => ({ items: [] as TrialEmployee[], loading: false, error: null as string | null }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/recruitment/trial-employees')
        this.items = data.map(mapTrialEmployee)
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement des periodes d\'essai impossible')
      } finally {
        this.loading = false
      }
    },
    async evaluate(id: string, evaluation: { score: number; comment: string }) {
      const { data } = await api.post<Row>(`/recruitment/trial-employees/${id}/evaluate`, {
        Score: evaluation.score, Comment: evaluation.comment,
      })
      upsert(this.items, mapTrialEmployee(data))
    },
    async extend(id: string, newEndDate: string) {
      const { data } = await api.post<Row>(`/recruitment/trial-employees/${id}/extend`, { NewEndDate: newEndDate })
      upsert(this.items, mapTrialEmployee(data))
    },
    async convert(id: string) {
      const { data } = await api.post<Row>(`/recruitment/trial-employees/${id}/convert`)
      upsert(this.items, mapTrialEmployee(data))
    },
    async cancel(id: string) {
      const { data } = await api.post<Row>(`/recruitment/trial-employees/${id}/cancel`)
      upsert(this.items, mapTrialEmployee(data))
    },
  },
})

// ═══════════════════════════════════════════════════════════════
// Portail carriere public (sans connexion)
// ═══════════════════════════════════════════════════════════════
export const usePublicCareersStore = defineStore('recruitment-public-careers', {
  state: () => ({ offers: [] as PublicJobOffer[], loading: false, error: null as string | null }),
  actions: {
    async fetchPublished() {
      this.loading = true
      try {
        const { data } = await api.get<Row[]>('/public/careers')
        this.offers = data.map((o: Row) => ({
          token: o.token,
          title: o.title,
          entityName: o.entityName,
          contractType: o.contractType,
          location: o.location,
          description: o.description,
          publishedAt: o.publishedAt ? day(o.publishedAt) : undefined,
          views: num(o.views),
        }))
        this.error = null
      } catch (e) {
        this.error = getApiErrorMessage(e, 'Chargement des offres impossible')
      } finally {
        this.loading = false
      }
    },
    async fetchByToken(token: string): Promise<PublicJobOffer> {
      const { data } = await api.get<Row>(`/public/careers/${token}`)
      return {
        token: data.token,
        title: data.title,
        entityName: data.entityName,
        contractType: data.contractType,
        location: data.location,
        description: data.description,
        publishedAt: data.publishedAt ? day(data.publishedAt) : undefined,
        views: num(data.views),
      }
    },
    async apply(token: string, payload: { candidateName: string; candidateEmail: string; candidatePhone: string; cvFileName?: string }) {
      const { data } = await api.post(`/public/careers/${token}/apply`, {
        CandidateName: payload.candidateName,
        CandidateEmail: payload.candidateEmail,
        CandidatePhone: payload.candidatePhone,
        CvFileName: payload.cvFileName,
      })
      return data as { ok: boolean; referenceCode: string }
    },
    async applySpontaneous(payload: { candidateName: string; candidateEmail: string; candidatePhone: string; cvFileName?: string }) {
      const { data } = await api.post('/public/careers/spontaneous', {
        CandidateName: payload.candidateName,
        CandidateEmail: payload.candidateEmail,
        CandidatePhone: payload.candidatePhone,
        CvFileName: payload.cvFileName,
      })
      return data as { ok: boolean; referenceCode: string }
    },
  },
})
