// Tipos centralizados para Assistência Social
export interface SocialAttendance {
  id: string
  citizenId?: string
  familyId?: string
  serviceUnitId: string
  attendanceType: AttendanceType
  date: string
  time: string
  duration: number
  attendedBy: string
  description: string
  servicesProvided: string[]
  referrals: string[]
  followUpRequired: boolean
  followUpDate?: string
  status: AttendanceStatus
  priority: AttendancePriority
  citizen?: { id: string; name: string; cpf: string }
  family?: { id: string; responsibleName: string; registrationNumber: string }
  serviceUnit?: { id: string; name: string; type: string }
  createdAt: string
  updatedAt: string
}

export type AttendanceType =
  | 'INFORMATION'
  | 'REGISTRATION'
  | 'FOLLOW_UP'
  | 'COMPLAINT'
  | 'BENEFIT_REQUEST'
  | 'EMERGENCY'
  | 'OTHER'

export type AttendanceStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'IN_PROGRESS'

export type AttendancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface CreateSocialAttendanceData {
  citizenId?: string
  familyId?: string
  serviceUnitId: string
  attendanceType: AttendanceType
  date: string
  time: string
  duration: number
  attendedBy: string
  description: string
  servicesProvided: string[]
  referrals: string[]
  followUpRequired: boolean
  followUpDate?: string
  priority: AttendancePriority
}

export interface UpdateSocialAttendanceData extends Partial<CreateSocialAttendanceData> {
  status?: AttendanceStatus
}

export interface AttendanceFilters {
  citizenId?: string
  familyId?: string
  serviceUnitId?: string
  attendanceType?: AttendanceType
  status?: AttendanceStatus
  priority?: AttendancePriority
  attendedBy?: string
  dateFrom?: string
  dateTo?: string
}

// Estatísticas profissionais para Assistência Social
export interface SocialAttendanceStats {
  total: number
  pending: number
  completed: number
  inProgress: number
  cancelled: number
  urgent: number
  byType: AttendanceStatsByType[]
  byPriority: AttendanceStatsByPriority[]
  byMonth: MonthlyAttendanceStats[]
  averageDuration: number
  completionRate: number
  responseTime: {
    average: number
    urgent: number
  }
}

export interface AttendanceStatsByType {
  type: AttendanceType
  count: number
  percentage: number
}

export interface AttendanceStatsByPriority {
  priority: AttendancePriority
  count: number
  percentage: number
}

export interface MonthlyAttendanceStats {
  month: string
  year: number
  total: number
  completed: number
  pending: number
  urgent: number
}

export interface ServiceUnit {
  id: string
  name: string
  type: string
  address: string
  phone: string
  email: string
  manager: string
  capacity: number
  activeAttendances: number
}