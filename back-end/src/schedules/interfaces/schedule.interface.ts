export type HospitalScheduleStatus = 'pending' | 'approved' | 'rejected';

export interface ScheduleSlot {
  department: string;
  shift: string;
  startTime: string;
  endTime: string;
}

export interface HospitalSchedule {
  id: string;
  hospitalId: string;
  hospitalName?: string;
  validFrom: string;
  validTo: string;
  slots: ScheduleSlot[];
  notes?: string;
  status: HospitalScheduleStatus;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHospitalScheduleDto {
  hospitalId: string;
  hospitalName?: string;
  validFrom: string;
  validTo: string;
  slots: ScheduleSlot[];
  notes?: string;
  submittedBy?: string;
}

export interface UpdateHospitalScheduleDto {
  status: HospitalScheduleStatus;
  approvedBy?: string;
  rejectionReason?: string;
}
