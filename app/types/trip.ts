export interface Trip {
  id: string
  userId?: string
  tripName: string
  destination: string
  startDate: string
  endDate: string
  activities: string
  emergencyContact: string
  specialConcerns?: string
  safetyInfo?: string
  shareUrl?: string
  createdAt: string
  updatedAt: string
}

export interface SafetyInfo {
  weatherAlert?: string
  localEmergencyNumbers: {
    police: string
    medical: string
    parkRanger?: string
  }
  activities: ActivitySafety[]
  generalTips: string[]
  checkInSchedule: CheckIn[]
}

export interface ActivitySafety {
  activity: string
  risks: string[]
  precautions: string[]
  equipment: string[]
}

export interface CheckIn {
  time: string
  message: string
}