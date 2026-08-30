import * as fs from 'fs';
import * as path from 'path';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest, AppointmentStats } from './interfaces/appointment.interface';
import { AppointmentStatus, LeaveStatus, UserRole, UserStatus } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';
import { PatientsService } from '../patients/patients.service';
import { LeavesService } from '../leaves/leaves.service';
import { UsersService } from '../users/users.service';
import { SchedulesService } from '../schedules/schedules.service';
import { Leave } from '../leaves/interfaces/leave.interface';
import { BillingService } from '../billing/billing.service';

/**
 * Appointments Service
 * Manages appointment scheduling and status tracking in the NexCare system
 * Handles CRUD operations for appointments with business logic
 */
@Injectable()
export class AppointmentsService {
  constructor(
    private readonly systemService: SystemService,
    private readonly patientsService: PatientsService,
    @Inject(forwardRef(() => LeavesService))
    private readonly leavesService: LeavesService,
    private readonly usersService: UsersService,
    private readonly schedulesService: SchedulesService,
    private readonly billingService: BillingService,
  ) {}

  /** Resolve a patient's display name, falling back to a placeholder. */
  private async resolvePatientName(patientId: string): Promise<string> {
    try {
      const res: any = await this.patientsService.findById(patientId);
      if (res?.success && res.data?.fullName) return res.data.fullName;
    } catch {
      /* fall through to placeholder */
    }
    return `Patient ${patientId}`;
  }

  /** True if the given human date label refers to today (format-tolerant). */
  private isToday(dateLabel: string): boolean {
    const d = new Date(dateLabel);
    if (isNaN(d.getTime())) return false;
    return d.toDateString() === new Date().toDateString();
  }

  private readonly appointmentsFilePath = path.join(process.cwd(), 'data', 'appointments.json');

  /** Load appointments from disk */
  private loadAppointments(): Appointment[] {
    try {
      if (!fs.existsSync(this.appointmentsFilePath)) {
        const initial = this.getInitialMockData();
        this.saveAppointments(initial);
        return initial;
      }
      const raw = fs.readFileSync(this.appointmentsFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return this.getInitialMockData();
    }
  }

  /** Persist appointments to disk */
  private saveAppointments(appointments: Appointment[]): void {
    try {
      fs.mkdirSync(path.dirname(this.appointmentsFilePath), { recursive: true });
      fs.writeFileSync(this.appointmentsFilePath, JSON.stringify(appointments, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist appointments:', err);
    }
  }

  private getInitialMockData(): Appointment[] {
    return [
      {
        id: 'APT-001',
        patientId: 'P001',
        patientName: 'John Anderson',
        department: 'Cardiology',
        doctor: 'Dr. Sarah Smith',
        dateLabel: 'March 15, 2026',
        timeLabel: '10:00 AM',
        token: 'TKN-1234',
        fee: 150,
        status: AppointmentStatus.CONFIRMED,
        reason: 'Routine heart checkup',
        createdAt: '2026-03-01T00:00:00Z'
      },
      {
        id: 'APT-002',
        patientId: 'P002',
        patientName: 'Maria Garcia',
        department: 'Orthopedics',
        doctor: 'Dr. Vikram Patel',
        dateLabel: 'April 02, 2026',
        timeLabel: '02:30 PM',
        token: 'TKN-5678',
        fee: 200,
        status: AppointmentStatus.PENDING,
        reason: 'Severe knee pain - Emergency Consult',
        createdAt: '2026-03-25T00:00:00Z'
      },
      {
        id: 'APT-003',
        patientId: 'P001',
        patientName: 'John Anderson',
        department: 'General Medicine',
        doctor: 'Dr. Anjali Desai',
        dateLabel: 'March 01, 2026',
        timeLabel: '11:00 AM',
        token: 'TKN-9012',
        fee: 100,
        status: AppointmentStatus.COMPLETED,
        reason: 'Annual physical',
        createdAt: '2026-02-15T00:00:00Z'
      }
    ];
  }


  /**
   * Get all appointments with optional filtering
   * @param patientId Optional patient filter
   * @param status Optional status filter
   * @param department Optional department filter
   * @returns List of appointments
   */
  async findAll(patientId?: string, status?: AppointmentStatus, department?: string) {
    try {
      const appointments = this.loadAppointments();
      let filteredAppointments = [...appointments];

      // Apply patient filter
      if (patientId) {
        filteredAppointments = filteredAppointments.filter(apt => apt.patientId === patientId);
      }

      // Apply status filter
      if (status) {
        filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
      }

      // Apply department filter
      if (department) {
        filteredAppointments = filteredAppointments.filter(apt => apt.department === department);
      }

      return ResponseUtil.success('Appointments retrieved successfully', filteredAppointments);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve appointments');
    }
  }

  /**
   * Get appointment by ID
   * @param id Appointment ID
   * @returns Appointment data
   */
  async findById(id: string) {
    try {
      const appointments = this.loadAppointments();
      const appointment = appointments.find(a => a.id === id);
      
      if (!appointment) {
        return ResponseUtil.notFound('Appointment', id);
      }

      return ResponseUtil.success('Appointment retrieved successfully', appointment);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve appointment');
    }
  }

  /**
   * Create new appointment
   * @param appointmentData Appointment creation data
   * @returns Created appointment data
   */
  async create(appointmentData: CreateAppointmentRequest) {
    try {
      const appointments = this.loadAppointments();

      // Validate appointment date is not in the past
      const appointmentDate = new Date(appointmentData.dateLabel);
      if (isNaN(appointmentDate.getTime())) {
        return ResponseUtil.error('Invalid date format');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        return ResponseUtil.error('Cannot book appointments in the past');
      }

      // Check for duplicate appointment (same patient, same doctor, same date/time)
      const duplicate = appointments.find(apt =>
        apt.patientId === appointmentData.patientId &&
        apt.doctor === appointmentData.doctor &&
        apt.dateLabel === appointmentData.dateLabel &&
        apt.timeLabel === appointmentData.timeLabel &&
        apt.status !== AppointmentStatus.CANCELLED &&
        apt.status !== AppointmentStatus.COMPLETED
      );
      if (duplicate) {
        return ResponseUtil.error('Appointment already exists for this patient with this doctor at the same time');
      }

      // Check for time slot conflict (same doctor, same date/time)
      const timeConflict = appointments.find(apt =>
        apt.doctor === appointmentData.doctor &&
        apt.dateLabel === appointmentData.dateLabel &&
        apt.timeLabel === appointmentData.timeLabel &&
        apt.status !== AppointmentStatus.CANCELLED &&
        apt.status !== AppointmentStatus.COMPLETED
      );
      if (timeConflict) {
        return ResponseUtil.error('Time slot already booked for this doctor');
      }

      const hospitalId = (appointmentData as any).hospitalId || await this.resolveDoctorHospital(appointmentData.doctor);

      if (hospitalId && !this.schedulesService.hasPublishedSchedule(hospitalId)) {
        return ResponseUtil.error('No hospital schedule has been published yet. Wait for the hospital manager to approve the roster.');
      }
      if (
        hospitalId &&
        !this.schedulesService.isPublishedCoverage(
          hospitalId,
          appointmentData.department,
          appointmentData.dateLabel,
          appointmentData.timeLabel,
        )
      ) {
        return ResponseUtil.error('That slot is outside the published hospital schedule.');
      }

      // Check doctor availability (not on leave)
      if (appointmentData.doctor && appointmentData.doctor !== 'TBD') {
        try {
          const leavesRes: any = await this.leavesService.findAll(undefined, undefined, LeaveStatus.APPROVED);
          if (leavesRes?.success && Array.isArray(leavesRes.data)) {
            const doctorOnLeave = leavesRes.data.some((leave: any) => {
              const leaveStart = new Date(leave.startDate);
              const leaveEnd = new Date(leave.endDate);
              const aptDate = new Date(appointmentData.dateLabel);
              // Check if appointment date falls within leave period
              return (
                leave.doctorName === appointmentData.doctor &&
                aptDate >= leaveStart &&
                aptDate <= leaveEnd
              );
            });
            if (doctorOnLeave) {
              return ResponseUtil.error(`Doctor ${appointmentData.doctor} is on leave during this period`);
            }
          }
        } catch (err) {
          console.error('Error checking doctor leave status:', err);
          // Continue with booking if leave check fails (non-blocking)
        }
      }

      // Generate new appointment ID
      const newAppointmentId = IdGenerator.generateAppointmentId();

      // Generate token
      const token = IdGenerator.generateTokenId();

      // Resolve the real patient name instead of a placeholder
      const patientName = await this.resolvePatientName(appointmentData.patientId);

      // Create new appointment.
      // New bookings start as PENDING and are confirmed by staff (see confirm()).
      const newAppointment: Appointment = {
        id: newAppointmentId,
        patientId: appointmentData.patientId,
        patientName,
        department: appointmentData.department,
        doctor: appointmentData.doctor || 'TBD',
        doctorId: appointmentData.doctorId || this.resolveDoctorId(appointmentData.doctor),
        hospitalId: appointmentData.hospitalId,
        hospitalName: appointmentData.hospitalName,
        dateLabel: appointmentData.dateLabel,
        timeLabel: appointmentData.timeLabel,
        token,
        fee: appointmentData.fee || 100,
        status: AppointmentStatus.PENDING,
        reason: appointmentData.reason || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to appointments array
      appointments.push(newAppointment);
      this.saveAppointments(appointments);

      // Log activity
      this.systemService.createActivity({
        userId: newAppointment.patientId,
        action: 'Create',
        details: `New appointment scheduled for ${newAppointment.patientName} with ${newAppointment.doctor}`,
        module: 'Appointments',
        severity: 'INFO'
      });

      return ResponseUtil.created('Appointment created successfully', newAppointment);
    } catch (error) {
      console.error('Create appointment error:', error);
      return ResponseUtil.serverError('Failed to create appointment');
    }
  }

  /**
   * Update appointment
   * @param id Appointment ID
   * @param updateData Appointment update data
   * @returns Updated appointment data
   */
  async update(id: string, updateData: UpdateAppointmentRequest) {
    try {
      const appointments = this.loadAppointments();
      const appointment = appointments.find(a => a.id === id);
      
      if (!appointment) {
        return ResponseUtil.notFound('Appointment', id);
      }

      const previousStatus = appointment.status;

      // Update appointment
      const updatedIndex = appointments.findIndex(a => a.id === id);
      appointments[updatedIndex] = {
        ...appointments[updatedIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      this.saveAppointments(appointments);

      const updated = appointments[updatedIndex];
      if (
        previousStatus !== AppointmentStatus.COMPLETED &&
        updated.status === AppointmentStatus.COMPLETED
      ) {
        await this.chargeConsultation(updated);
      }

      // Log activity
      this.systemService.createActivity({
        userId: 'System',
        action: 'Update',
        details: `Appointment ${id} details updated`,
        module: 'Appointments',
        severity: 'INFO'
      });

      return ResponseUtil.updated('Appointment updated successfully', appointments[updatedIndex]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update appointment');
    }
  }

  /**
   * Delete appointment
   * @param id Appointment ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    try {
      const appointments = this.loadAppointments();
      const appointmentIndex = appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) {
        return ResponseUtil.notFound('Appointment', id);
      }

      const appointment = appointments[appointmentIndex];

      // Remove appointment
      appointments.splice(appointmentIndex, 1);
      this.saveAppointments(appointments);

      // Log activity
      this.systemService.createActivity({
        userId: appointment.patientId,
        action: 'Delete',
        details: `Appointment deleted: ${id}`,
        module: 'Appointments',
        severity: 'WARNING'
      });

      return ResponseUtil.deleted('Appointment');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete appointment');
    }
  }

  /**
   * Confirm appointment
   * @param id Appointment ID
   * @returns Updated appointment data
   */
  async confirm(id: string) {
    try {
      const appointments = this.loadAppointments();
      const appointmentIndex = appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) {
        return ResponseUtil.notFound('Appointment', id);
      }

      // Update status to confirmed
      appointments[appointmentIndex].status = AppointmentStatus.CONFIRMED;
      appointments[appointmentIndex].updatedAt = new Date().toISOString();
      
      this.saveAppointments(appointments);

      const updatedAppointment = appointments[appointmentIndex];

      // Log activity
      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Confirm',
        details: `Appointment ${id} confirmed for ${updatedAppointment.patientName}`,
        module: 'Appointments',
        severity: 'SUCCESS'
      });

      return ResponseUtil.updated('Appointment confirmed successfully', updatedAppointment);
    } catch (error) {
      return ResponseUtil.serverError('Failed to confirm appointment');
    }
  }

  /**
   * Complete appointment
   * @param id Appointment ID
   * @returns Updated appointment data
   */
  async complete(id: string) {
    try {
      const appointments = this.loadAppointments();
      const appointmentIndex = appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) {
        return ResponseUtil.notFound('Appointment', id);
      }

      const current = appointments[appointmentIndex];
      if (current.status === AppointmentStatus.COMPLETED) {
        return ResponseUtil.updated('Appointment completed successfully', current);
      }
      if (current.status === AppointmentStatus.CANCELLED) {
        return ResponseUtil.error('Cannot complete a cancelled appointment');
      }

      // Update status to completed
      appointments[appointmentIndex].status = AppointmentStatus.COMPLETED;
      appointments[appointmentIndex].updatedAt = new Date().toISOString();
      
      this.saveAppointments(appointments);

      const updatedAppointment = appointments[appointmentIndex];

      await this.chargeConsultation(updatedAppointment);

      // Log activity
      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Complete',
        details: `Appointment ${id} marked as completed for ${updatedAppointment.patientName}`,
        module: 'Appointments',
        severity: 'SUCCESS'
      });

      return ResponseUtil.updated('Appointment completed successfully', updatedAppointment);
    } catch (error) {
      return ResponseUtil.serverError('Failed to complete appointment');
    }
  }

  /**
   * Cancel appointment
   * @param id Appointment ID
   * @returns Updated appointment data
   */
  async cancel(id: string) {
    try {
      const appointments = this.loadAppointments();
      const appointmentIndex = appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) {
        return ResponseUtil.notFound('Appointment', id);
      }

      // Update status to cancelled
      appointments[appointmentIndex].status = AppointmentStatus.CANCELLED;
      appointments[appointmentIndex].updatedAt = new Date().toISOString();
      
      this.saveAppointments(appointments);

      const updatedAppointment = appointments[appointmentIndex];

      // Log activity
      this.systemService.createActivity({
        userId: updatedAppointment.patientId,
        action: 'Cancel',
        details: `Appointment ${id} cancelled`,
        module: 'Appointments',
        severity: 'WARNING'
      });

      return ResponseUtil.updated('Appointment cancelled successfully', updatedAppointment);
    } catch (error) {
      return ResponseUtil.serverError('Failed to cancel appointment');
    }
  }

  /**
   * Get appointment statistics
   * @returns Appointment statistics
   */
  async getStats() {
    try {
      const appointments = this.loadAppointments();
      const totalAppointments = appointments.length;
      const pendingAppointments = appointments.filter(a => a.status === AppointmentStatus.PENDING).length;
      const confirmedAppointments = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
      const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
      const cancelledAppointments = appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;
      
      // Today's appointments (format-tolerant date comparison)
      const todayAppointments = appointments.filter(a => this.isToday(a.dateLabel)).length;

      // By department
      const byDepartment: Record<string, number> = {};
      appointments.forEach(apt => {
        byDepartment[apt.department] = (byDepartment[apt.department] || 0) + 1;
      });

      // Revenue from completed appointments minus cancelled (refunded)
      const completedRevenue = appointments
        .filter(a => a.status === AppointmentStatus.COMPLETED)
        .reduce((sum, apt) => sum + apt.fee, 0);
      const cancelledRefunds = appointments
        .filter(a => a.status === AppointmentStatus.CANCELLED)
        .reduce((sum, apt) => sum + apt.fee, 0);
      const revenue = completedRevenue - cancelledRefunds;

      const stats: AppointmentStats = {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        today: todayAppointments,
        byDepartment,
        revenue
      };

      return ResponseUtil.success('Appointment statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve appointment statistics');
    }
  }

  /**
   * Get appointments by patient
   * @param patientId Patient ID
   * @returns Patient appointments
   */
  async findByPatient(patientId: string) {
    try {
      const appointments = this.loadAppointments();
      const patientAppointments = appointments.filter(a => a.patientId === patientId);
      
      return ResponseUtil.success(`Appointments for patient ${patientId} retrieved successfully`, patientAppointments);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient appointments');
    }
  }

  /**
   * Get appointments by department
   * @param department Department name
   * @returns Department appointments
   */
  async findByDepartment(department: string) {
    try {
      const appointments = this.loadAppointments().filter(a => a.department === department);
      
      return ResponseUtil.success(`Appointments for ${department} department retrieved successfully`, appointments);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve department appointments');
    }
  }

  /**
   * Generate appointment token
   * @returns Generated token
   */
  private generateToken(): string {
    return 'TKN-' + Math.floor(Math.random() * 90000 + 10000);
  }

  /**
   * Get today's appointments
   * @returns Today's appointments
   */
  async getTodayAppointments() {
    try {
      const todayAppointments = this.loadAppointments().filter(a => this.isToday(a.dateLabel));

      return ResponseUtil.success('Today\'s appointments retrieved successfully', todayAppointments);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve today\'s appointments');
    }
  }

  /**
   * Refer the patient to another doctor. Optionally completes this consult first
   * so both fees land on the same pending bill when each visit is completed.
   */
  async refer(id: string, body: {
    doctorId: string;
    department?: string;
    dateLabel: string;
    timeLabel: string;
    fee?: number;
    completeCurrent?: boolean;
  }) {
    try {
      const sourceRes: any = await this.findById(id);
      if (!sourceRes?.success || !sourceRes.data) return sourceRes;
      const source: Appointment = sourceRes.data;

      if (source.status === AppointmentStatus.CANCELLED) {
        return ResponseUtil.error('Cannot refer from a cancelled appointment');
      }

      const shouldComplete = body.completeCurrent !== false
        && source.status !== AppointmentStatus.COMPLETED;
      if (shouldComplete) {
        const done: any = await this.complete(id);
        if (!done?.success) return done;
      }

      const doctorsRes: any = await this.usersService.findByRole(UserRole.DOCTOR);
      const doctors = Array.isArray(doctorsRes?.data) ? doctorsRes.data : [];
      const target = doctors.find((d: any) => d.id === body.doctorId);
      if (!target) return ResponseUtil.notFound('Doctor', body.doctorId);
      if (target.id === source.doctorId || this.sameDoctor(target.name, source.doctor)) {
        return ResponseUtil.error('Choose a different doctor for the referral');
      }

      const fee = body.fee != null
        ? Number(body.fee)
        : Number(target.consultationFee) || 500;
      const department = body.department || target.dept || source.department;

      return this.create({
        patientId: source.patientId,
        department,
        doctor: target.name,
        doctorId: target.id,
        hospitalId: source.hospitalId || target.hospitalId,
        hospitalName: source.hospitalName || target.hospitalName,
        dateLabel: body.dateLabel,
        timeLabel: body.timeLabel,
        fee,
        reason: `Referral from ${source.doctor} (${source.department})`,
      });
    } catch (error) {
      console.error('Refer appointment error:', error);
      return ResponseUtil.serverError('Failed to create referral appointment');
    }
  }

  /** Doctors a colleague can refer to (same hospital when known). */
  async listReferralDoctors(excludeDoctorId?: string, hospitalId?: string, dept?: string) {
    try {
      const res: any = await this.usersService.findByRole(UserRole.DOCTOR);
      if (!res?.success) return res;
      let doctors = (res.data || []).filter((d: any) => d.status === UserStatus.ACTIVE);
      if (excludeDoctorId) doctors = doctors.filter((d: any) => d.id !== excludeDoctorId);
      if (hospitalId) {
        const atHospital = doctors.filter((d: any) => !d.hospitalId || d.hospitalId === hospitalId);
        if (atHospital.length) doctors = atHospital;
      }
      if (dept) doctors = doctors.filter((d: any) => !dept || d.dept === dept);
      return ResponseUtil.success('Referral doctors retrieved successfully', doctors.map((d: any) => ({
        id: d.id,
        name: d.name,
        dept: d.dept,
        hospitalId: d.hospitalId,
        hospitalName: d.hospitalName,
        consultationFee: Number(d.consultationFee) || 500,
      })));
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve referral doctors');
    }
  }

  private async chargeConsultation(appointment: Appointment): Promise<void> {
    try {
      const fee = Number(appointment.fee) || 0;
      if (fee <= 0) return;
      await this.billingService.appendCharge(appointment.patientId, {
        description: `Consultation — ${appointment.doctor} (${appointment.department})`,
        department: appointment.department || 'Consultation',
        amount: fee,
        date: appointment.dateLabel,
        sourceId: `consult:${appointment.id}`,
      });
    } catch (err) {
      console.error('Failed to add consultation to pending bill:', err);
    }
  }

  /**
   * After a hospital manager approves leave: mark the doctor on leave,
   * then reassign open appointments in that window to another doctor in
   * the same department, or cancel if nobody is available.
   */
  async handleDoctorLeaveApproved(leave: Leave): Promise<void> {
    try {
      if (leave.doctorId) {
        await this.usersService.updateStatus(leave.doctorId, UserStatus.ON_LEAVE);
      }

      const leaveStart = this.startOfDay(new Date(leave.startDate));
      const leaveEnd = this.startOfDay(new Date(leave.endDate));
      if (isNaN(leaveStart.getTime()) || isNaN(leaveEnd.getTime())) return;

      const doctorsRes: any = await this.usersService.findByRole(UserRole.DOCTOR);
      const doctors = Array.isArray(doctorsRes?.data) ? doctorsRes.data : [];
      const leavesRes: any = await this.leavesService.findAll(undefined, leave.hospitalId, LeaveStatus.APPROVED);
      const approvedLeaves = Array.isArray(leavesRes?.data) ? leavesRes.data : [];

      const appointments = this.loadAppointments();
      let changed = false;

      for (const apt of appointments) {
        if (apt.status === AppointmentStatus.CANCELLED || apt.status === AppointmentStatus.COMPLETED) {
          continue;
        }
        if (!this.sameDoctor(apt.doctor, leave.doctorName)) continue;

        const aptDate = this.startOfDay(new Date(apt.dateLabel));
        if (isNaN(aptDate.getTime()) || aptDate < leaveStart || aptDate > leaveEnd) continue;

        const replacement = doctors.find((doc: any) => {
          if (doc.id === leave.doctorId) return false;
          if (this.sameDoctor(doc.name, leave.doctorName)) return false;
          if (leave.hospitalId && doc.hospitalId && doc.hospitalId !== leave.hospitalId) return false;
          if (apt.department && doc.dept && doc.dept !== apt.department) return false;
          if (doc.status === UserStatus.ON_LEAVE) return false;
          const onLeave = approvedLeaves.some((l: any) => {
            if (l.doctorId !== doc.id && !this.sameDoctor(l.doctorName, doc.name)) return false;
            const s = this.startOfDay(new Date(l.startDate));
            const e = this.startOfDay(new Date(l.endDate));
            return aptDate >= s && aptDate <= e;
          });
          if (onLeave) return false;
          const slotTaken = appointments.some(
            other =>
              other.id !== apt.id &&
              other.status !== AppointmentStatus.CANCELLED &&
              other.status !== AppointmentStatus.COMPLETED &&
              this.sameDoctor(other.doctor, doc.name) &&
              other.dateLabel === apt.dateLabel &&
              other.timeLabel === apt.timeLabel,
          );
          return !slotTaken;
        });

        if (replacement) {
          apt.doctor = replacement.name;
          apt.reason = [apt.reason, `Reassigned from ${leave.doctorName} (on leave)`]
            .filter(Boolean)
            .join(' — ');
          apt.updatedAt = new Date().toISOString();
          apt.status = AppointmentStatus.PENDING;
          changed = true;
        } else {
          apt.status = AppointmentStatus.CANCELLED;
          apt.reason = [apt.reason, `Cancelled — ${leave.doctorName} on approved leave`]
            .filter(Boolean)
            .join(' — ');
          apt.updatedAt = new Date().toISOString();
          changed = true;
        }
      }

      if (changed) {
        this.saveAppointments(appointments);
        this.systemService.createActivity({
          userId: leave.approvedBy || 'hospital_manager',
          action: 'Update',
          details: `Appointments adjusted for approved leave of ${leave.doctorName} (${leave.startDate} to ${leave.endDate})`,
          module: 'Appointments',
          severity: 'INFO',
        });
      }
    } catch (err) {
      console.error('Dynamic appointment handling after leave approval failed:', err);
    }
  }

  private sameDoctor(a?: string, b?: string): boolean {
    const norm = (v?: string) =>
      String(v || '')
        .toLowerCase()
        .replace(/^dr\.?\s*/i, '')
        .trim();
    return !!norm(a) && norm(a) === norm(b);
  }

  private startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private async resolveDoctorHospital(doctorName?: string): Promise<string | undefined> {
    if (!doctorName) return undefined;
    try {
      const res: any = await this.usersService.findByRole(UserRole.DOCTOR);
      const doctors = Array.isArray(res?.data) ? res.data : [];
      const match = doctors.find((d: any) => this.sameDoctor(d.name, doctorName));
      return match?.hospitalId;
    } catch {
      return undefined;
    }
  }

  // ── Doctor views ──────────────────────────────────────────────────────────

  /**
   * Every appointment belonging to one doctor.
   *
   * Matches on `doctorId` where the booking carried one and falls back to the
   * consultant's name for rows created before the doctor portal existed — the
   * seed data is all name-only, so without the fallback a doctor's first login
   * would show an empty schedule.
   */
  async findByDoctor(doctorId: string, status?: AppointmentStatus, date?: string) {
    try {
      const doctor = this.loadUsers().find(
        (u: any) => u.id === doctorId && u.role === UserRole.DOCTOR,
      );
      if (!doctor) return ResponseUtil.notFound('Doctor', doctorId);

      const wanted = this.normaliseDoctorName(doctor.name);
      let mine = this.loadAppointments().filter((apt: any) =>
        apt.doctorId
          ? apt.doctorId === doctorId
          : this.normaliseDoctorName(apt.doctor) === wanted,
      );

      if (status) mine = mine.filter(apt => apt.status === status);
      if (date) mine = mine.filter(apt => apt.dateLabel === date);

      mine.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return ResponseUtil.success('Doctor appointments retrieved successfully', mine);
    } catch (error) {
      console.error('Doctor appointments error:', error);
      return ResponseUtil.serverError('Failed to retrieve appointments for this doctor');
    }
  }

  /** Headline numbers for the doctor dashboard. */
  async getDoctorStats(doctorId: string) {
    try {
      const res: any = await this.findByDoctor(doctorId);
      if (!res.success) return res;
      const mine: any[] = res.data || [];

      const is = (apt: any, status: AppointmentStatus) => apt.status === status;
      const today = new Date().toLocaleDateString('en-US', {
        month: 'long', day: '2-digit', year: 'numeric',
      });

      return ResponseUtil.success('Doctor appointment statistics retrieved successfully', {
        total: mine.length,
        pending: mine.filter(a => is(a, AppointmentStatus.PENDING)).length,
        confirmed: mine.filter(a => is(a, AppointmentStatus.CONFIRMED)).length,
        completed: mine.filter(a => is(a, AppointmentStatus.COMPLETED)).length,
        cancelled: mine.filter(a => is(a, AppointmentStatus.CANCELLED)).length,
        today: mine.filter(a => a.dateLabel === today).length,
        uniquePatients: new Set(mine.map(a => a.patientId)).size,
      });
    } catch {
      return ResponseUtil.serverError('Failed to compute doctor appointment statistics');
    }
  }

  /** True when the appointment is this doctor's to act on. */
  async isDoctorsOwn(doctorId: string, appointmentId: string): Promise<boolean> {
    const res: any = await this.findByDoctor(doctorId);
    return !!res.success && (res.data || []).some((a: any) => a.id === appointmentId);
  }

  /** Look up a doctor's user id from the display name the booking captured. */
  private resolveDoctorId(doctorName?: string): string | undefined {
    if (!doctorName || doctorName === 'TBD') return undefined;
    const wanted = this.normaliseDoctorName(doctorName);
    const match = this.loadUsers().find(
      (u: any) => u.role === UserRole.DOCTOR && this.normaliseDoctorName(u.name) === wanted,
    );
    return match ? match.id : undefined;
  }

  /** "Dr. Sarah Smith", "dr sarah smith" and "Sarah Smith" are one person. */
  private normaliseDoctorName(name: any): string {
    return String(name || '')
      .toLowerCase()
      .replace(/^dr\.?\s+/, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /** Read-only view of the user directory, for doctor lookups. */
  private loadUsers(): any[] {
    try {
      return JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'data', 'users.json'), 'utf-8'),
      );
    } catch {
      return [];
    }
  }
}
