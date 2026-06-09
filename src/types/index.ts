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

export type LeaveStatus =
  | 'draft' | 'pending' | 'approved' | 'rejected'
  | 'cancelled' | 'returned'
  | 'registered' | 'done' | 'regularized'

export interface ValidationStep {
  level:     'employee' | 'n1' | 'n2' | 'n3' | 'n4' | 'rh' | 'system'
  actorName:     string
  actorInitials: string
  action:    'submitted' | 'approved' | 'rejected' | 'returned' | 'pending'
  date:      string       // ISO datetime or ''
  comment?:  string
}

export type LeaveType =
  | 'Congé annuel'
  | 'Congé maladie'
  | 'Congé maternité'
  | 'Récupération'
  | 'Télétravail'
  | 'Assistance parentale'
  | 'Permission exceptionnelle'

export interface LeaveRequest {
  id:               number
  employeeName:     string
  employeeInitials: string
  avatarColor:      string
  avatarTextColor:  string
  type:             LeaveType
  startDate:        string
  endDate:          string
  workingDays:      number
  reason?:          string
  rejectionReason?: string
  returnComment?:   string
  status:           LeaveStatus
  submittedAt:      string
  validationHistory?: ValidationStep[]
}

export interface LeaveBalance {
  label: string
  pct: number
  days: number
  color: string
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
export type EntityStatus = 'draft' | 'pending_approval' | 'approved' | 'inactive'
export type EntityType   = 'direction' | 'department' | 'service'

export interface ValidatorPool {
  level:              1 | 2 | 3 | 4
  employeeId?:        string
  validatorName:      string
  validatorInitials:  string
  validatorColor:     string
}

// ── Employees ─────────────────────────────────────────────────
export type EmployeeStatus = 'active' | 'trial' | 'onleave' | 'inactive'
export type ContractType   = 'CDI' | 'CDD' | 'Stage' | 'Freelance'

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
  entityId:     string | null
  entityName?:  string
  email?:       string
  phone?:       string
  hireDate:     string
  contractType: ContractType
  status:       EmployeeStatus
  managerId?:   string
}

export interface Entity {
  id:               string
  code:             string
  name:             string
  type:             EntityType
  parentId:         string | null
  legalIdentifier?: string
  address?:         string
  phone?:           string
  email?:           string
  responsibleName?: string
  responsibleId?:   string
  headcount:        number
  status:           EntityStatus
  validatorPools:   ValidatorPool[]
  createdAt:        string
  submittedAt?:     string
  approvedAt?:      string
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

export type HolidayType = 'annual' | 'ponctual' | 'selective'

export interface Holiday {
  id:               string
  name:             string
  date:             string        // "MM-DD" si annuel, "YYYY-MM-DD" si ponctuel
  type:             HolidayType
  isRecurring:      boolean       // true = annuel, false = ponctuel
  applicableRoles?: string[]
}

export interface LeaveRule {
  type:             LeaveType
  daysPerYear:      number
  daysPerMonth?:    number
  maxCarryOver:     number
  requiresDocument: boolean
  noticeDays:       number
}

export interface CompanyCalendar {
  id:            string
  workingDays:   WorkingDays
  holidays:      Holiday[]
  leaveRules:    LeaveRule[]
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
  absenceType?:   LeaveType
  absenceStatus?: LeaveStatus
  hours?:         WorkingHours
}
