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

export type LeaveStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'

export type LeaveType =
  | 'Congé annuel'
  | 'Congé maladie'
  | 'Congé maternité'
  | 'Récupération'
  | 'Télétravail'
  | 'Assistance parentale'
  | 'Permission exceptionnelle'

export interface LeaveRequest {
  id: number
  employeeName: string
  employeeInitials: string
  avatarColor: string
  avatarTextColor: string
  type: LeaveType
  startDate: string
  endDate: string
  workingDays: number
  reason?: string
  rejectionReason?: string
  status: LeaveStatus
  submittedAt: string
}

export interface LeaveBalance {
  label: string
  pct: number
  days: number
  color: string
}

export type MissionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface MissionOrder {
  id: number
  employeeName: string
  employeeInitials: string
  destination: string
  purpose: string
  startDate: string
  endDate: string
  status: MissionStatus
  rejectionReason?: string
  submittedAt: string
}

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface ExpenseReport {
  id: number
  employeeName: string
  employeeInitials: string
  title: string
  totalAmount: number
  currency: string
  status: ExpenseStatus
  rejectionReason?: string
  submittedAt: string
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
