export type UserRole = 'rh' | 'employee'

export interface AuthUser {
  name: string
  initials: string
  role: UserRole
  email: string
}

export type LeaveStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'

export type LeaveType =
  | 'Congé annuel'
  | 'Congé maladie'
  | 'Congé maternité'
  | 'Récupération'
  | 'Télétravail'

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
