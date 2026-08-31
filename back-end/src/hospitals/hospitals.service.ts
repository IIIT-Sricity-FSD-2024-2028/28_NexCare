import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Hospital, CreateHospitalDto, UpdateHospitalDto, HospitalPaymentRecord } from './interfaces/hospital.interface';
import { VerificationStatus } from '../common/interfaces/api-response.interface';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationEntityType } from '../notifications/interfaces/notification.interface';

@Injectable()
export class HospitalsService {
  constructor(private readonly notificationsService?: NotificationsService) {}

  private readonly hospitalsFilePath = path.join(process.cwd(), 'data', 'hospitals.json');

  private get hospitals(): Hospital[] {
    try {
      const raw = fs.readFileSync(this.hospitalsFilePath, 'utf-8');
      return JSON.parse(raw) as Hospital[];
    } catch {
      return [];
    }
  }

  private set hospitals(val: Hospital[]) {
    try {
      fs.mkdirSync(path.dirname(this.hospitalsFilePath), { recursive: true });
      const tmpPath = `${this.hospitalsFilePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(val, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.hospitalsFilePath);
    } catch (err) {
      console.error('Failed to persist hospitals to disk:', err);
    }
  }

  async findAll(
    status?: VerificationStatus,
    speciality?: string,
    city?: string,
    pincode?: string
  ) {
    try {
      let result = this.hospitals;
      if (status) {
        result = result.filter(h => h.verificationStatus === status);
      }
      if (speciality && speciality.trim() !== '') {
        const targetSpec = speciality.trim().toLowerCase();
        result = result.filter((h: any) => {
          const specsArray = Array.isArray(h.specialities)
            ? h.specialities
            : Array.isArray(h.specialties)
            ? h.specialties
            : null;

          if (specsArray) {
            const hasMatch = specsArray.some(
              (s: any) => typeof s === 'string' && s.trim().toLowerCase() === targetSpec
            );
            if (hasMatch) return true;
          }

          if (typeof h.speciality === 'string' && h.speciality.trim().toLowerCase() === targetSpec) {
            return true;
          }
          if (typeof h.specialty === 'string' && h.specialty.trim().toLowerCase() === targetSpec) {
            return true;
          }

          if (Array.isArray(h.doctors)) {
            const docMatch = h.doctors.some(
              (d: any) =>
                (typeof d.speciality === 'string' && d.speciality.trim().toLowerCase() === targetSpec) ||
                (typeof d.specialty === 'string' && d.specialty.trim().toLowerCase() === targetSpec) ||
                (typeof d.department === 'string' && d.department.trim().toLowerCase() === targetSpec)
            );
            if (docMatch) return true;
          }
          if (Array.isArray(h.departments)) {
            const deptMatch = h.departments.some(
              (d: any) =>
                (typeof d === 'string' && d.trim().toLowerCase() === targetSpec) ||
                (typeof d?.name === 'string' && d.name.trim().toLowerCase() === targetSpec)
            );
            if (deptMatch) return true;
          }

          return false;
        });
      }

      if (city && city.trim() !== '') {
        const targetCity = city.trim().toLowerCase();
        result = result.filter(
          h => h.city && h.city.trim().toLowerCase() === targetCity
        );
      }

      if (pincode && pincode.trim() !== '') {
        const targetPincode = pincode.trim();
        result = result.filter(
          h => h.pincode && h.pincode.trim() === targetPincode
        );
      }

      return ResponseUtil.success('Hospitals retrieved successfully', result);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve hospitals');
    }
  }

  async findById(id: string) {
    try {
      const hospital = this.hospitals.find(h => h.id === id);
      if (!hospital) {
        return ResponseUtil.notFound('Hospital', id);
      }
      return ResponseUtil.success('Hospital retrieved successfully', hospital);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve hospital');
    }
  }

  async create(data: CreateHospitalDto) {
    try {
      const validationError = this.validateRegistration(data);
      if (validationError) return ResponseUtil.validationError(validationError);

      const registrationNumber = data.registrationNumber.trim().toUpperCase();
      const existing = this.hospitals.find(
        h => h.registrationNumber.trim().toUpperCase() === registrationNumber,
      );
      if (existing) {
        return ResponseUtil.error('Hospital with this registration number already exists');
      }

      const newHospital: Hospital = {
        ...data,
        registrationNumber,
        email: data.email.trim().toLowerCase(),
        adminEmail: data.adminEmail.trim().toLowerCase(),
        id: IdGenerator.generateHospitalId(this.hospitals.map(h => h.id)),
        verificationStatus: VerificationStatus.PENDING_VERIFICATION,
        regionalReviewStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const all = this.hospitals;
      all.push(newHospital);
      this.hospitals = all;

      // Notify Super User and Regional Officer of new hospital registration
      if (this.notificationsService) {
        this.notificationsService.create({
          recipientRole: 'superuser',
          type: NotificationType.INFO,
          title: 'Hospital Registration Submitted',
          message: `${newHospital.name} submitted registration for verification (${newHospital.city || ''}, ${newHospital.state || ''}).`,
          entityType: NotificationEntityType.HOSPITAL,
          entityId: newHospital.id,
        });
        this.notificationsService.create({
          recipientRole: 'regional_manager',
          type: NotificationType.INFO,
          title: 'New Hospital Verification Pending',
          message: `${newHospital.name} in your region is pending verification review.`,
          entityType: NotificationEntityType.HOSPITAL,
          entityId: newHospital.id,
        });
      }

      return ResponseUtil.created('Hospital registered successfully', newHospital);
    } catch (error) {
      return ResponseUtil.serverError('Failed to register hospital');
    }
  }

  /** Records a regional manager's due-diligence decision; it never activates a hospital. */
  async recordRegionalReview(
    id: string,
    managerId: string,
    decision: 'cleared' | 'rejected',
    notes?: string,
  ) {
    const all = this.hospitals;
    const idx = all.findIndex(h => h.id === id);
    if (idx === -1) return ResponseUtil.notFound('Hospital', id);
    const hospital = all[idx];

    if (hospital.assignedManagerId !== managerId) {
      return ResponseUtil.forbidden('This registration is not assigned to you');
    }
    if (hospital.verificationStatus !== VerificationStatus.PENDING_VERIFICATION) {
      return ResponseUtil.error('Only pending registrations can be reviewed');
    }

    all[idx] = {
      ...hospital,
      regionalReviewStatus: decision,
      regionalReviewedAt: new Date().toISOString(),
      regionalReviewNotes: notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    this.hospitals = all;
    return ResponseUtil.updated(`Regional review ${decision}`, all[idx]);
  }

  private validateRegistration(data: CreateHospitalDto): string | null {
    const requiredText: Array<[keyof CreateHospitalDto, string]> = [
      ['name', 'Hospital name'], ['registrationNumber', 'Registration number'], ['type', 'Hospital type'],
      ['ownershipType', 'Ownership type'], ['address', 'Address'], ['city', 'City'], ['state', 'State'],
      ['pincode', 'PIN code'], ['phone', 'Official phone'], ['email', 'Official email'],
      ['adminName', 'Administrator name'], ['adminEmail', 'Administrator email'], ['adminPhone', 'Administrator phone'],
    ];
    for (const [field, label] of requiredText) {
      if (typeof data[field] !== 'string' || !data[field].trim()) return `${label} is required`;
    }
    if (!/^\d{6}$/.test(data.pincode.trim())) return 'PIN code must contain exactly 6 digits';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'Official email is invalid';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail.trim())) return 'Administrator email is invalid';
    const phone = (value: string) => /^\+?[0-9][0-9\s()-]{8,14}$/.test(value.trim());
    if (!phone(data.phone)) return 'Official phone must contain 10 to 15 digits';
    if (!/^\+?[0-9][0-9\s()-]{8,14}$/.test(data.adminPhone.trim())) return 'Administrator phone must contain 10 to 15 digits';
    if (!Number.isInteger(Number(data.totalBeds)) || Number(data.totalBeds) < 1) return 'Total beds must be at least 1';
    if (!Number.isInteger(Number(data.icuBeds)) || Number(data.icuBeds) < 0) return 'ICU beds cannot be negative';
    if (Number(data.icuBeds) > Number(data.totalBeds)) return 'ICU beds cannot exceed total beds';
    if (!Array.isArray(data.specialities) || data.specialities.length === 0) return 'At least one speciality is required';
    return null;
  }

  async update(id: string, updateData: UpdateHospitalDto) {
    try {
      const all = this.hospitals;
      const idx = all.findIndex(h => h.id === id);
      if (idx === -1) return ResponseUtil.notFound('Hospital', id);

      all[idx] = {
        ...all[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.hospitals = all;

      return ResponseUtil.updated('Hospital updated successfully', all[idx]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update hospital');
    }
  }
  async findNearby(city?: string, state?: string, pincode?: string) {
    try {
      const verified = this.hospitals.filter(
        (h) => !h.verificationStatus || h.verificationStatus === VerificationStatus.VERIFIED,
      );

      // Proximity score: same pincode (3) > same city (2) > same state (1).
      const score = (h: Hospital) => {
        let s = 0;
        if (pincode && h.pincode === pincode) s += 3;
        if (city && h.city?.toLowerCase() === city.toLowerCase()) s += 2;
        if (state && h.state?.toLowerCase() === state.toLowerCase()) s += 1;
        return s;
      };

      const hasLocation = !!(pincode || city || state);

      // When a location is supplied, actually narrow to hospitals that share
      // at least the state/city/pincode. If nothing matches locally, fall back
      // to the full verified list so the patient still sees options.
      let result = verified;
      if (hasLocation) {
        const local = verified.filter(h => score(h) > 0);
        result = local.length > 0 ? local : verified;
      }

      result.sort((a, b) => score(b) - score(a));

      return ResponseUtil.success('Nearby hospitals retrieved successfully', result);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve nearby hospitals');
    }
  }

  /**
   * Get subscription details, countdown days, and status for a hospital
   */
  async getSubscriptionDetails(hospitalId: string) {
    try {
      const hospital = this.hospitals.find(h => h.id === hospitalId);
      if (!hospital) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Default to 1 year from creation if not explicitly set
      let expiryDateStr = hospital.subscriptionExpiryDate;
      if (!expiryDateStr) {
        const created = hospital.createdAt ? new Date(hospital.createdAt) : new Date();
        const exp = new Date(created);
        exp.setFullYear(exp.getFullYear() + 1);
        expiryDateStr = exp.toISOString().split('T')[0];
      }

      const expiryDate = new Date(expiryDateStr);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'ACTIVE';
      let warningLevel = 'ok';
      let warningMessage = '';

      if (daysRemaining <= 0) {
        status = 'EXPIRED';
        warningLevel = 'expired';
        warningMessage = 'Hospital Registration Expired. Please renew immediately to restore full service access.';
      } else if (daysRemaining <= 7) {
        status = 'DUE_SOON';
        warningLevel = 'urgent_7';
        warningMessage = `URGENT: NexCare registration expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`;
      } else if (daysRemaining <= 30) {
        status = 'DUE_SOON';
        warningLevel = 'warning_30';
        warningMessage = `Hospital registration renewal is due soon (${daysRemaining} days remaining).`;
      } else if (daysRemaining <= 90) {
        status = 'ACTIVE';
        warningLevel = 'warning_90';
        warningMessage = `Your NexCare hospital registration expires in ${daysRemaining} days.`;
      }

      return ResponseUtil.success('Subscription details retrieved successfully', {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        planName: 'NexCare Annual Enterprise License',
        durationMonths: 12,
        registrationDate: hospital.createdAt ? hospital.createdAt.split('T')[0] : '2025-01-01',
        subscriptionStartDate: hospital.subscriptionStartDate || (hospital.createdAt ? hospital.createdAt.split('T')[0] : '2025-01-01'),
        subscriptionExpiryDate: expiryDateStr,
        lastPaymentDate: hospital.lastPaymentDate || hospital.createdAt || '2025-01-01',
        amountPaid: hospital.amountPaid || 50000,
        daysRemaining: Math.max(0, daysRemaining),
        status,
        warningLevel,
        warningMessage,
        transactionId: hospital.transactionId || 'TXN-NEX-INIT-001',
        paymentHistory: hospital.paymentHistory || []
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to get subscription details');
    }
  }

  /**
   * Get hospital performance metrics
   * Used by regional managers to track hospital performance
   */
  async getHospitalPerformance(hospitalId: string) {
    try {
      const hospital = this.hospitals.find(h => h.id === hospitalId);
      if (!hospital) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }

      // Calculate basic performance metrics
      const performanceMetrics = {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        bedOccupancyRate: hospital.performanceMetrics?.bedOccupancyRate || 0,
        appointmentCompletionRate: hospital.performanceMetrics?.appointmentCompletionRate || 0,
        patientSatisfactionScore: hospital.performanceMetrics?.patientSatisfactionScore || 0,
        totalBeds: hospital.totalBeds,
        icuBeds: hospital.icuBeds,
        verificationStatus: hospital.verificationStatus,
        lastUpdated: hospital.performanceMetrics?.lastUpdated || hospital.updatedAt
      };

      return ResponseUtil.success('Hospital performance retrieved successfully', performanceMetrics);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve hospital performance');
    }
  }

  /**
   * Renew hospital registration subscription for 12 months with mock payment
   */
  async renewSubscription(hospitalId: string, renewalDto: any) {
    try {
      const all = this.hospitals;
      const idx = all.findIndex(h => h.id === hospitalId);
      if (idx === -1) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }

      const hospital = all[idx];
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Determine base date: if current subscription is still active in future, extend from expiry; otherwise from now
      let baseDate = now;
      if (hospital.subscriptionExpiryDate) {
        const currentExp = new Date(hospital.subscriptionExpiryDate);
        if (currentExp > now) {
          baseDate = currentExp;
        }
      }

      // Add 12 months
      const newExpiryDate = new Date(baseDate);
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      const newExpiryStr = newExpiryDate.toISOString().split('T')[0];

      const txnId = 'TXN-NEX-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
      const amount = Number(renewalDto?.amount) || 50000;
      const paymentMethod = renewalDto?.paymentMethod || 'UPI';

      const paymentRecord: HospitalPaymentRecord = {
        id: IdGenerator.generate('PAY'),
        date: new Date().toISOString(),
        amount,
        paymentType: paymentMethod,
        transactionId: txnId,
        previousExpiry: hospital.subscriptionExpiryDate || now.toISOString().split('T')[0],
        newExpiry: newExpiryStr,
        status: 'PAID'
      };

      const updatedHistory = [paymentRecord, ...(hospital.paymentHistory || [])];

      all[idx] = {
        ...hospital,
        subscriptionStartDate: hospital.subscriptionStartDate || now.toISOString().split('T')[0],
        subscriptionExpiryDate: newExpiryStr,
        lastPaymentDate: new Date().toISOString(),
        amountPaid: (hospital.amountPaid || 0) + amount,
        paymentStatus: 'ACTIVE',
        renewalStatus: 'UP_TO_DATE',
        transactionId: txnId,
        paymentHistory: updatedHistory,
        updatedAt: new Date().toISOString()
      };

      this.hospitals = all;

      // Notify Hospital Manager and Super User of subscription renewal
      if (this.notificationsService) {
        this.notificationsService.create({
          recipientRole: 'hospital_manager',
          hospitalId: hospital.id,
          type: NotificationType.SUCCESS,
          title: 'Subscription Renewed',
          message: `Registration subscription successfully renewed for 12 months (valid until ${newExpiryStr}).`,
          entityType: NotificationEntityType.SUBSCRIPTION,
          entityId: txnId,
        });
        this.notificationsService.create({
          recipientRole: 'superuser',
          type: NotificationType.SUCCESS,
          title: 'Hospital Subscription Renewed',
          message: `${hospital.name} renewed their annual subscription (₹${amount.toLocaleString('en-IN')}).`,
          entityType: NotificationEntityType.SUBSCRIPTION,
          entityId: txnId,
        });
      }

      return ResponseUtil.success('Hospital registration renewed successfully', {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        newExpiryDate: newExpiryStr,
        previousExpiryDate: paymentRecord.previousExpiry,
        daysRemaining: Math.ceil((newExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        transactionId: txnId,
        paymentRecord,
        status: 'ACTIVE'
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to renew subscription');
    }
  }

  /**
   * Get payment history for a hospital
   */
  async getPaymentHistory(hospitalId: string) {
    try {
      const hospital = this.hospitals.find(h => h.id === hospitalId);
      if (!hospital) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }
      return ResponseUtil.success('Payment history retrieved successfully', hospital.paymentHistory || []);
    } catch (error) {
      return ResponseUtil.serverError('Failed to get payment history');
    }
  }

  /**
   * Update hospital performance metrics
   * Used to update performance data
   */
  async updatePerformanceMetrics(hospitalId: string, metrics: any) {
    try {
      const all = this.hospitals;
      const idx = all.findIndex(h => h.id === hospitalId);
      if (idx === -1) return ResponseUtil.notFound('Hospital', hospitalId);

      all[idx] = {
        ...all[idx],
        performanceMetrics: {
          ...all[idx].performanceMetrics,
          ...metrics,
          lastUpdated: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      };
      this.hospitals = all;

      return ResponseUtil.updated('Hospital performance metrics updated successfully', all[idx].performanceMetrics);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update hospital performance metrics');
    }
  }

  // ========================================================================
  // Regional Manager Analytics
  // ========================================================================

  private readonly dataDir = path.join(process.cwd(), 'data');

  private loadDataFile<T>(filename: string): T[] {
    try {
      const raw = fs.readFileSync(path.join(this.dataDir, filename), 'utf-8');
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  getHospitalsForManager(managerId: string): Hospital[] {
    return this.hospitals.filter(h => h.assignedManagerId === managerId);
  }

  private isLowStock(item: any): boolean {
    const status = String(item.status || '').toLowerCase();
    if (status.includes('low') || status.includes('out')) return true;
    return item.reorderLevel != null && item.quantity != null && item.quantity <= item.reorderLevel;
  }

  private computeHospitalSnapshot(hospital: Hospital, context: {
    beds: any[];
    inventory: any[];
    users: any[];
    feedback: any[];
    appointments: any[];
  }) {
    const hid = hospital.id;
    const totalBeds = hospital.totalBeds || 0;
    const availableBeds = hospital.availableBeds ?? context.beds.filter(
      b => b.hospitalId === hid && String(b.status || '').toLowerCase() === 'available',
    ).length;
    const occupiedBeds = totalBeds > 0 ? totalBeds - availableBeds : 0;
    const bedOccupancyRate = totalBeds > 0
      ? Math.round((occupiedBeds / totalBeds) * 100)
      : 0;

    const hospitalDoctors = context.users.filter(
      u => u.role === 'doctor' && u.hospitalId === hid,
    );
    const doctorNames = new Set(hospitalDoctors.map(d => d.name));
    const hospitalAppointments = context.appointments.filter(
      a => doctorNames.has(a.doctor) || a.hospitalId === hid,
    );
    const completedAppts = hospitalAppointments.filter(
      a => String(a.status || '').toLowerCase() === 'completed',
    ).length;
    const appointmentCompletionRate = hospitalAppointments.length > 0
      ? Math.round((completedAppts / hospitalAppointments.length) * 100)
      : (hospital.performanceMetrics?.appointmentCompletionRate ?? 0);

    const hospitalFeedback = context.feedback.filter(f => f.hospitalId === hid);
    const patientFeedback = hospitalFeedback.filter(f => f.type === 'Patient');
    const ratings = patientFeedback.map(f => f.rating).filter(r => typeof r === 'number');
    const patientSatisfactionScore = ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
      : (hospital.performanceMetrics?.patientSatisfactionScore ?? 0);

    const lowStockItems = context.inventory.filter(
      i => i.hospitalId === hid && this.isLowStock(i),
    ).length;

    const openComplaints = hospitalFeedback.filter(
      f => !['resolved', 'closed'].includes(String(f.status || '').toLowerCase()),
    ).length;

    return {
      hospitalId: hid,
      hospitalName: hospital.name,
      city: hospital.city,
      type: hospital.type,
      verificationStatus: hospital.verificationStatus,
      totalBeds,
      availableBeds,
      occupiedBeds,
      icuBeds: hospital.icuBeds,
      bedOccupancyRate,
      doctorCount: hospitalDoctors.length,
      appointmentCompletionRate,
      patientSatisfactionScore,
      lowStockItems,
      openComplaints,
      specialities: hospital.specialities || [],
      emergency24x7: hospital.emergency24x7,
      ambulanceService: hospital.ambulanceService,
      lastUpdated: hospital.updatedAt,
    };
  }

  async getRegionalOverview(managerId: string) {
    try {
      const myHospitals = this.getHospitalsForManager(managerId);
      const context = {
        beds: this.loadDataFile<any>('beds.json'),
        inventory: this.loadDataFile<any>('inventory.json'),
        users: this.loadDataFile<any>('users.json'),
        feedback: this.loadDataFile<any>('feedback.json'),
        appointments: this.loadDataFile<any>('appointments.json'),
      };

      const hospitalSummaries = myHospitals.map(h => this.computeHospitalSnapshot(h, context));
      const totalBeds = hospitalSummaries.reduce((s, h) => s + h.totalBeds, 0);
      const availableBeds = hospitalSummaries.reduce((s, h) => s + h.availableBeds, 0);
      const totalDoctors = hospitalSummaries.reduce((s, h) => s + h.doctorCount, 0);
      const lowStockItems = hospitalSummaries.reduce((s, h) => s + h.lowStockItems, 0);
      const openComplaints = hospitalSummaries.reduce((s, h) => s + h.openComplaints, 0);
      const avgOccupancy = hospitalSummaries.length > 0
        ? Math.round(hospitalSummaries.reduce((s, h) => s + h.bedOccupancyRate, 0) / hospitalSummaries.length)
        : 0;
      const avgSatisfaction = hospitalSummaries.length > 0
        ? Math.round(
          (hospitalSummaries.reduce((s, h) => s + h.patientSatisfactionScore, 0) / hospitalSummaries.length) * 10,
        ) / 10
        : 0;

      const pendingVerifications = myHospitals.filter(
        h => h.verificationStatus === VerificationStatus.PENDING_VERIFICATION,
      ).length;

      return ResponseUtil.success('Regional overview retrieved successfully', {
        summary: {
          assignedHospitals: myHospitals.length,
          verifiedHospitals: myHospitals.filter(h => h.verificationStatus === VerificationStatus.VERIFIED).length,
          pendingVerifications,
          totalBeds,
          availableBeds,
          averageOccupancy: avgOccupancy,
          totalDoctors,
          lowStockItems,
          openComplaints,
          averageSatisfaction: avgSatisfaction,
        },
        hospitals: hospitalSummaries,
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve regional overview');
    }
  }

  async getPerformanceAlerts(managerId: string) {
    try {
      const myHospitals = this.getHospitalsForManager(managerId);
      const context = {
        beds: this.loadDataFile<any>('beds.json'),
        inventory: this.loadDataFile<any>('inventory.json'),
        users: this.loadDataFile<any>('users.json'),
        feedback: this.loadDataFile<any>('feedback.json'),
        appointments: this.loadDataFile<any>('appointments.json'),
      };

      const alerts: Array<{
        id: string;
        hospitalId: string;
        hospitalName: string;
        severity: 'critical' | 'warning' | 'info';
        category: string;
        title: string;
        message: string;
        metric?: number;
        threshold?: number;
      }> = [];

      for (const hospital of myHospitals) {
        const snap = this.computeHospitalSnapshot(hospital, context);

        if (snap.bedOccupancyRate >= 90) {
          alerts.push({
            id: `alert-occ-crit-${snap.hospitalId}`,
            hospitalId: snap.hospitalId,
            hospitalName: snap.hospitalName,
            severity: 'critical',
            category: 'Capacity',
            title: 'Critical bed occupancy',
            message: `${snap.hospitalName} is at ${snap.bedOccupancyRate}% bed occupancy.`,
            metric: snap.bedOccupancyRate,
            threshold: 90,
          });
        } else if (snap.bedOccupancyRate >= 80) {
          alerts.push({
            id: `alert-occ-warn-${snap.hospitalId}`,
            hospitalId: snap.hospitalId,
            hospitalName: snap.hospitalName,
            severity: 'warning',
            category: 'Capacity',
            title: 'High bed occupancy',
            message: `${snap.hospitalName} is at ${snap.bedOccupancyRate}% bed occupancy.`,
            metric: snap.bedOccupancyRate,
            threshold: 80,
          });
        }

        if (snap.lowStockItems > 0) {
          alerts.push({
            id: `alert-stock-${snap.hospitalId}`,
            hospitalId: snap.hospitalId,
            hospitalName: snap.hospitalName,
            severity: snap.lowStockItems >= 5 ? 'critical' : 'warning',
            category: 'Inventory',
            title: 'Low stock items',
            message: `${snap.lowStockItems} inventory item(s) need restocking at ${snap.hospitalName}.`,
            metric: snap.lowStockItems,
          });
        }

        if (snap.patientSatisfactionScore > 0 && snap.patientSatisfactionScore < 3) {
          alerts.push({
            id: `alert-sat-${snap.hospitalId}`,
            hospitalId: snap.hospitalId,
            hospitalName: snap.hospitalName,
            severity: 'warning',
            category: 'Patient Experience',
            title: 'Low patient satisfaction',
            message: `Average patient rating is ${snap.patientSatisfactionScore}/5 at ${snap.hospitalName}.`,
            metric: snap.patientSatisfactionScore,
            threshold: 3,
          });
        }

        if (snap.openComplaints > 0) {
          alerts.push({
            id: `alert-complaints-${snap.hospitalId}`,
            hospitalId: snap.hospitalId,
            hospitalName: snap.hospitalName,
            severity: snap.openComplaints >= 3 ? 'critical' : 'warning',
            category: 'Complaints',
            title: 'Unresolved patient complaints',
            message: `${snap.openComplaints} open complaint(s) at ${snap.hospitalName}.`,
            metric: snap.openComplaints,
          });
        }

        if (snap.appointmentCompletionRate > 0 && snap.appointmentCompletionRate < 70) {
          alerts.push({
            id: `alert-appt-${snap.hospitalId}`,
            hospitalId: snap.hospitalId,
            hospitalName: snap.hospitalName,
            severity: 'warning',
            category: 'Operations',
            title: 'Low appointment completion rate',
            message: `Only ${snap.appointmentCompletionRate}% of appointments are completed at ${snap.hospitalName}.`,
            metric: snap.appointmentCompletionRate,
            threshold: 70,
          });
        }
      }

      const severityOrder = { critical: 0, warning: 1, info: 2 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      return ResponseUtil.success('Performance alerts retrieved successfully', {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        alerts,
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve performance alerts');
    }
  }

  async getHospitalComparison(managerId: string, hospitalIds?: string[]) {
    try {
      let myHospitals = this.getHospitalsForManager(managerId);
      if (hospitalIds && hospitalIds.length > 0) {
        const allowed = new Set(myHospitals.map(h => h.id));
        myHospitals = myHospitals.filter(h => hospitalIds.includes(h.id) && allowed.has(h.id));
      }

      const context = {
        beds: this.loadDataFile<any>('beds.json'),
        inventory: this.loadDataFile<any>('inventory.json'),
        users: this.loadDataFile<any>('users.json'),
        feedback: this.loadDataFile<any>('feedback.json'),
        appointments: this.loadDataFile<any>('appointments.json'),
      };

      const hospitals = myHospitals.map(h => this.computeHospitalSnapshot(h, context));
      const metrics = [
        'bedOccupancyRate',
        'appointmentCompletionRate',
        'patientSatisfactionScore',
        'doctorCount',
        'lowStockItems',
        'openComplaints',
        'availableBeds',
        'totalBeds',
      ] as const;

      const rankings: Record<string, { best: string | null; worst: string | null }> = {};
      for (const metric of metrics) {
        const sorted = [...hospitals].sort((a, b) => (b as any)[metric] - (a as any)[metric]);
        const higherIsBetter = !['lowStockItems', 'openComplaints', 'bedOccupancyRate'].includes(metric);
        const bestList = higherIsBetter ? sorted : [...sorted].reverse();
        rankings[metric] = {
          best: bestList[0]?.hospitalName || null,
          worst: bestList[bestList.length - 1]?.hospitalName || null,
        };
      }

      return ResponseUtil.success('Hospital comparison retrieved successfully', {
        hospitals,
        rankings,
        comparedAt: new Date().toISOString(),
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve hospital comparison');
    }
  }
}
