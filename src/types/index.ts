export type UserRole =
  | 'employee'      // employé simple — espace perso uniquement
  | 'validator'     // manager/validateur N+x — espace perso + à valider
  | 'hr_admin'      // HR Administrator — accès admin complet
  | 'hr_director'   // HR Director — accès admin + approbations direction

export interface AuthUser {
  id:              string
  name:            string
  initials:        string
  role:            UserRole
  email:           string
  entityId?:       string
  entityName?:     string
  validatorLevel?: 1 | 2 | 3 | 4
}

// Statut de LeaveRequest — reprend tel quel l'enum backend (voir
// productive247-hrm-backend schema.prisma LeaveRequest.Status), meme
// convention que EntityStatus (pas de mapping vers des cles minuscules).
// InApprovalN1..N4 : etape courante dans le pool de validation (WorkflowType
// Standard). Registered/Done/Regularized : reserves a WorkflowType Medical
// (declaration directe, sans pool — voir LeaveTypeConfig.workflowType).
export type LeaveRequestStatus =
  | 'Draft' | 'Pending'
  | 'InApprovalN1' | 'InApprovalN2' | 'InApprovalN3' | 'InApprovalN4'
  | 'Approved' | 'Rejected' | 'Returned' | 'Cancelled'
  | 'Registered' | 'Done' | 'Regularized'

export interface ValidationStep {
  level:     'employee' | 'n1' | 'n2' | 'n3' | 'n4' | 'rh' | 'system'
  actorName:     string
  actorInitials: string
  action:    'submitted' | 'approved' | 'rejected' | 'returned' | 'pending'
  date:      string       // ISO datetime or ''
  comment?:  string
}

export interface LeaveRequest {
  id:                   string
  referenceCode:        string
  employeeId:           string
  employeeName:         string
  employeeInitials:     string
  leaveTypeId:          string
  leaveTypeName:        string
  leaveTypeColor:       string
  workflowType:         'Standard' | 'Medical'
  startDate:            string
  endDate:              string
  daysCount:            number
  reason?:              string
  interimEmployeeId?:   string
  interimEmployeeName?: string
  status:               LeaveRequestStatus
  approvalPoolId?:      string
  currentApprovalStep?: number
  rejectionReason?:     string
  createdAt:            string
  modifiedAt?:          string | null
  validationHistory?:   ValidationStep[]
}

export interface LeaveBalance {
  leaveTypeId:   string
  leaveTypeName: string
  leaveTypeCode: string
  color:         string
  daysPerYear:   number
  balance:       number
}

export type MissionStatus =
  | 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled'

export type TransportMode =
  | 'personal_car' | 'company_car' | 'public_transport' | 'plane' | 'other'

export type EmployeeCategory = 'cat_a' | 'cat_b' | 'cat_c' | 'cat_d'

export interface MissionAllowance {
  category:       EmployeeCategory
  hotelPerDay:    number
  transportFlat:  number
  mealPerDay:     number
  currency:       string
}

export interface PerdiemRate {
  id:          string
  category:    string
  ratePerDay:  number
  currency:    string
  description: string
}

export interface MissionOrder {
  id:                  string
  code:                string
  employeeId:          string
  employeeName:        string
  employeeInitials:    string
  employeeCategory:    EmployeeCategory
  destination:         string
  purpose:             string
  departureDate:       string
  returnDate:          string
  transportMode:       TransportMode
  transportModeReturn: TransportMode
  description?:        string
  numberOfDays:        number
  hotelAllowance:      number
  transportAllowance:  number
  mealAllowance:       number
  totalMission:        number
  advanceRequested:    number
  status:              MissionStatus
  validationHistory:   ValidationStep[]
  createdAt:           string
  submittedAt?:        string
}

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export type ExpenseCategory =
  | 'transport' | 'hebergement' | 'repas' | 'carburant'
  | 'fournitures' | 'communication' | 'representation' | 'autre'

export interface ExpenseLine {
  id:          string
  date:        string
  category:    ExpenseCategory
  description: string
  amount:      number
  currency:    string
  receipt:     boolean
}

export interface ExpenseReport {
  id:               string
  code:             string
  employeeId:       string
  employeeName:     string
  employeeInitials: string
  title:            string
  missionId?:       string
  lines:            ExpenseLine[]
  totalAmount:      number
  currency:         string
  status:           ExpenseStatus
  rejectionReason?: string
  submittedAt?:     string
  createdAt:        string
  validationHistory: ValidationStep[]
}

export type RemoteStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface RemoteWorkRequest {
  id: number
  employeeName: string
  employeeInitials: string
  startDate: string
  endDate: string
  reason: string
  status: RemoteStatus
  rejectionReason?: string
  submittedAt: string
}

// ── Entities ─────────────────────────────────────────────────
// Values match the backend OrganizationUnit.Status / .Type columns exactly
// (Prisma emulates enums as plain strings — see productive247-hrm-backend).
export type EntityStatus = 'Draft' | 'PendingApproval' | 'Active' | 'Inactive'
export type EntityType   = 'Direction' | 'Department' | 'Service'


// ── Employees ─────────────────────────────────────────────────
export type EmployeeStatus  = 'active' | 'trial' | 'onleave' | 'inactive'
export type ContractType    = 'CDI' | 'CDD' | 'Stage' | 'Freelance'
export type Gender          = 'M' | 'F'
export type MaritalStatus   = 'Single' | 'Married' | 'Divorced' | 'Widowed'
export type IdDocumentType  = 'NationalId' | 'Passport' | 'ResidencePermit'

export interface Employee {
  id:           string
  code:         string
  firstName:    string
  lastName:     string
  name:         string
  initials:     string
  avatarBg:     string
  avatarText:   string
  role:         UserRole
  jobTitle:     string
  // FK vers la fiche Position réelle (module Position, branché au backend) —
  // jobTitle ci-dessus est dérivé de positionTitle pour l'affichage, pas
  // stocké tel quel côté backend (Employee n'a pas de colonne libre pour ça).
  positionId?:  string
  entityId:     string | null
  entityName?:  string
  email?:       string
  phone?:       string
  hireDate:     string
  contractType: ContractType
  status:       EmployeeStatus
  // Dérivé du responsable de l'entité de rattachement (OrganizationUnit.ManagerId)
  // — Employee n'a pas de colonne ManagerId propre côté backend, voir
  // stores/employees.ts:mapEmployee.
  managerId?:   string
  gender:          Gender
  birthDate:       string
  birthPlace?:     string
  maritalStatus:   MaritalStatus
  idType:          IdDocumentType
  idNumber?:       string
  // A un compte système (peut se connecter) — seul un employé avec un compte
  // peut être choisi comme validateur. Mock local pour l'instant (dérivé du
  // rôle à la création) ; le vrai backend le porte via Employee.UserId — la
  // création du compte utilisateur (identifiants, rôle RBAC) est un chantier
  // séparé, non couvert par ce domaine.
  hasAccount:   boolean
}

export interface Entity {
  id:          string
  code:        string
  name:        string
  type:        EntityType
  parentId:    string | null
  managerId:   string | null
  address?:    string
  phone?:      string
  email?:      string
  status:      EntityStatus
  createdBy:   string
  createdAt:   string
  modifiedBy?: string | null
  modifiedAt?: string | null
  legalIdentifier?: string
  // Not part of the backend OrganizationUnit response — enriched client-side
  // by the store (manager lookup / employee count). Pools de validation
  // (ApprovalPool) vivent dans leur propre store, voir stores/approvalPools.ts.
  responsibleName?: string
  headcount:        number
  children?:        Entity[]
}

// ── Calendar ──────────────────────────────────────────────────
export interface WorkingHours {
  start:      string // "08:00"
  end:        string // "17:30"
  breakStart: string // "12:00"
  breakEnd:   string // "14:00"
}

export interface WorkingDayConfig {
  enabled:      boolean
  start:        string  // "08:00"
  end:          string  // "17:30"
  breakEnabled: boolean
  breakStart:   string  // "12:00"
  breakEnd:     string  // "14:00"
}

export interface WorkingDays {
  monday:    WorkingDayConfig
  tuesday:   WorkingDayConfig
  wednesday: WorkingDayConfig
  thursday:  WorkingDayConfig
  friday:    WorkingDayConfig
  saturday:  WorkingDayConfig
  sunday:    WorkingDayConfig
}

// HolidayScope matches backend Holiday.HolidayType (National = toute
// l'entreprise, Local = restreint a une OrganizationUnit). Ne pas confondre
// avec la recurrence annuelle, portee par isRecurring.
export type HolidayScope = 'National' | 'Local'

export interface Holiday {
  id:                  string
  name:                string
  date:                string        // "YYYY-MM-DD" — pour un ferie recurrent, seuls mois/jour comptent
  isRecurring:         boolean       // true = annuel, false = ponctuel
  holidayType:         HolidayScope
  organizationUnitId?: string | null // requis si holidayType = 'Local'
}

export interface CompanyCalendar {
  id:            string
  workingDays:   WorkingDays
  holidays:      Holiday[]
  perdiemRates?: PerdiemRate[]
  updatedAt:     string
  updatedBy:     string
}

export interface EmployeeSchedule {
  employeeId:           string
  inheritsFromCompany:  boolean
  customWorkingDays?:   WorkingDays
  customWorkingHours?:  WorkingHours
  scheduleNotes?:       string
}

export interface DayPlanning {
  date:           string       // YYYY-MM-DD
  isWorkingDay:   boolean
  isHoliday:      boolean
  holidayName?:   string
  isAbsence:      boolean
  absenceType?:   string
  absenceStatus?: LeaveRequestStatus
  hours?:         WorkingHours
}
