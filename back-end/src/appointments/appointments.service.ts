import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest, AppointmentStats } from './interfaces/appointment.interface';
import { AppointmentStatus } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';
import { PatientsService } from '../patients/patients.service';

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

      // Update appointment
      const updatedIndex = appointments.findIndex(a => a.id === id);
      appointments[updatedIndex] = {
        ...appointments[updatedIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      this.saveAppointments(appointments);

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

      // Update status to completed
      appointments[appointmentIndex].status = AppointmentStatus.COMPLETED;
      appointments[appointmentIndex].updatedAt = new Date().toISOString();
      
      this.saveAppointments(appointments);

      const updatedAppointment = appointments[appointmentIndex];

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

      // Revenue from completed appointments
      const revenue = appointments
        .filter(a => a.status === AppointmentStatus.COMPLETED)
        .reduce((sum, apt) => sum + apt.fee, 0);

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
}
