import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { DataSanitizer } from '../common/utils/sanitizer.util';
import { User, CreateUserRequest, UpdateUserRequest, UserStats, RMWorkload, RMSuggestion } from './interfaces/user.interface';
import { UserRole, UserStatus, VerificationStatus } from '../common/interfaces/api-response.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationEntityType } from '../notifications/interfaces/notification.interface';

/**
 * Users Service
 * Manages user accounts across all roles in the NexCare system
 * Handles CRUD operations for users with role-based access control
 */
@Injectable()
export class UsersService {
  constructor(private readonly notificationsService?: NotificationsService) {}

  // In-memory mock users database (aligned with frontend db.js)
  private readonly usersFilePath = path.join(process.cwd(), 'data', 'users.json');
  private readonly hospitalsFilePath = path.join(process.cwd(), 'data', 'hospitals.json');

  private get users(): User[] {
    try {
      const raw = fs.readFileSync(this.usersFilePath, 'utf-8');
      return JSON.parse(raw) as User[];
    } catch {
      return [];
    }
  }

  private set users(val: User[]) {
    try {
      fs.mkdirSync(path.dirname(this.usersFilePath), { recursive: true });
      fs.writeFileSync(this.usersFilePath, JSON.stringify(val, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist users to disk:', err);
    }
  }

  private get hospitals(): any[] {
    try {
      const raw = fs.readFileSync(this.hospitalsFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }


  /**
   * Get all users with optional filtering
   * @param role Optional role filter
   * @param status Optional status filter
   * @returns Paginated list of users
   */
  async findAll(role?: UserRole, status?: UserStatus) {
    try {
      let filteredUsers = [...this.users];

      // Apply role filter
      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }

      // Apply status filter
      if (status) {
        filteredUsers = filteredUsers.filter(user => user.status === status);
      }

      // Remove password from response
      const usersWithoutPassword = filteredUsers.map(({ password, ...user }) => user);

      return ResponseUtil.success('Users retrieved successfully', usersWithoutPassword);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve users');
    }
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns User data
   */
  async findById(id: string) {
    try {
      const user = ArrayUtil.findById(this.users, id);
      
      if (!user) {
        return ResponseUtil.notFound('User', id);
      }

      // Remove password from response
      const userWithoutPassword = DataSanitizer.removePassword(user);
      
      return ResponseUtil.success('User retrieved successfully', userWithoutPassword);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve user');
    }
  }

  /**
   * Automatically generate unique staff email based on name
   */
  generateStaffEmail(name: string): string {
    if (!name) return `staff${Date.now().toString().slice(-4)}@nexcare.in`;
    let clean = name.replace(/^(dr\.|dr|mr\.|mr|mrs\.|mrs|ms\.|ms)\s+/i, '').trim();
    clean = clean.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.');
    if (!clean) clean = 'staff';
    const base = clean;
    let candidate = `${base}@nexcare.in`;
    let counter = 2;
    const currentUsers = this.users;
    while (currentUsers.some(u => u.email.toLowerCase() === candidate.toLowerCase())) {
      candidate = `${base}${counter}@nexcare.in`;
      counter++;
    }
    return candidate;
  }

  /**
   * Automatically generate formatted employee ID
   */
  generateEmployeeId(role: UserRole | string, hospitalId?: string): string {
    const hId = hospitalId || 'H001';
    let prefix = 'EMP';
    if (role === UserRole.DOCTOR || role === 'doctor') prefix = 'DOC';
    else if (role === UserRole.ADMINISTRATIVE_STAFF || role === 'administrative_staff') prefix = 'ADM';
    else if (role === UserRole.AMBULANCE || role === 'ambulance') prefix = 'AMB';

    const count = this.users.filter(u => u.hospitalId === hId && u.role === role).length + 1;
    const seq = String(count).padStart(3, '0');
    return `${prefix}-${hId}-${seq}`;
  }

  /**
   * Create new user
   * @param userData User creation data
   * @returns Created user data
   */
  async create(userData: CreateUserRequest) {
    try {
      // Auto-generate email if missing
      let email = (userData.email || '').trim().toLowerCase();
      if (!email) {
        email = this.generateStaffEmail(userData.name);
      } else {
        const existingUser = this.users.find(u => u.email.toLowerCase() === email);
        if (existingUser) {
          return ResponseUtil.error('Email already exists');
        }
      }

      // Auto-generate employeeId if missing
      const employeeId = userData.employeeId || this.generateEmployeeId(userData.role, userData.hospitalId);

      // Generate new user ID using utility
      const newUserId = IdGenerator.generateUserId();

      // Default temporary password
      const tempPassword = userData.password || 'NexCare@123';
      const mustChangePassword = userData.mustChangePassword !== undefined ? userData.mustChangePassword : true;

      // Determine region ID if not provided
      let regionId = userData.regionId;
      if (!regionId) {
        if (userData.hospitalId === 'H003') regionId = 'R002';
        else regionId = 'R001';
      }

      // Create new user
      const newUser: User = {
        id: newUserId,
        name: userData.name,
        email: email,
        role: userData.role,
        status: (userData.status as UserStatus) || UserStatus.ACTIVE,
        password: tempPassword,
        mustChangePassword,
        phone: userData.phone,
        dob: userData.dob,
        gender: userData.gender,
        address: userData.address,
        employeeId: employeeId,
        dept: userData.dept,
        designation: userData.designation,
        joiningDate: userData.joiningDate || new Date().toISOString().split('T')[0],
        employmentType: userData.employmentType || 'Full-time',
        hospitalId: userData.hospitalId,
        hospitalName: userData.hospitalName,
        regionId: regionId,
        specialization: userData.specialization,
        medicalRegNumber: userData.medicalRegNumber,
        qualification: userData.qualification,
        experienceYears: userData.experienceYears,
        consultationTiming: userData.consultationTiming,
        consultationFee: userData.consultationFee,
        driverLicense: userData.driverLicense,
        assignedVehicle: userData.assignedVehicle,
        shift: userData.shift,
        responsibilities: userData.responsibilities,
        patientId: userData.patientId,
        areas: userData.areas,
        city: userData.city,
        state: userData.state,
        pincode: userData.pincode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to users array
      const currentUsers = this.users;
      currentUsers.push(newUser);
      this.users = currentUsers;

      // Emit staff registration notification
      if (this.notificationsService) {
        this.notificationsService.create({
          recipientUserId: newUser.id,
          recipientRole: newUser.role,
          hospitalId: newUser.hospitalId,
          type: NotificationType.SUCCESS,
          title: 'Account Created',
          message: `Your NexCare staff account (${newUser.employeeId || newUser.id}) has been created for ${newUser.hospitalName || newUser.hospitalId}.`,
          entityType: NotificationEntityType.STAFF,
          entityId: newUser.id,
        });
      }

      // Remove password from response using utility
      const userWithoutPassword = DataSanitizer.removePassword(newUser);

      return ResponseUtil.created('User created successfully', {
        ...userWithoutPassword,
        tempPassword: tempPassword,
        mustChangePassword: newUser.mustChangePassword
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to create user');
    }
  }

  /**
   * Update user
   * @param id User ID
   * @param updateData User update data
   * @returns Updated user data
   */
  async update(id: string, updateData: UpdateUserRequest) {
    try {
      const userIndex = ArrayUtil.findIndexById(this.users, id);
      
      if (userIndex === -1) {
        return ResponseUtil.notFound('User', id);
      }

      // Check if email is being updated and already exists (exact, case-insensitive)
      if (updateData.email) {
        const email = updateData.email.toLowerCase();
        const existingUser = this.users.find(u => u.email.toLowerCase() === email && u.id !== id);
        if (existingUser) {
          return ResponseUtil.error('Email already exists');
        }
      }

      // Update user
      const currentUsers = this.users;
      const updatedUser = ArrayUtil.updateById(currentUsers, id, {
        ...updateData,
        hospitalId: updateData.hospitalId,
        city: updateData.city,
        state: updateData.state,
        pincode: updateData.pincode,
        updatedAt: new Date().toISOString()
      });
      this.users = currentUsers;

      if (!updatedUser) {
        return ResponseUtil.notFound('User', id);
      }

      // Remove password from response using utility
      const userWithoutPassword = DataSanitizer.removePassword(updatedUser);

      return ResponseUtil.updated('User updated successfully', userWithoutPassword);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update user');
    }
  }

  /**
   * Delete user
   * @param id User ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    try {
      const user = ArrayUtil.findById(this.users, id);
      
      if (!user) {
        return ResponseUtil.notFound('User', id);
      }

      // Prevent deletion of superuser
      if (user.role === UserRole.SUPERUSER) {
        return ResponseUtil.error('Cannot delete superuser account');
      }

      // Remove user
      const currentUsers = this.users;
      ArrayUtil.removeById(currentUsers, id);
      this.users = currentUsers;

      return ResponseUtil.deleted('User');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete user');
    }
  }

  /**
   * Get user statistics
   * @returns User statistics
   */
  async getStats() {
    try {
      const stats: UserStats = {
        total: this.users.length,
        active: this.users.filter(u => u.status === UserStatus.ACTIVE).length,
        inactive: this.users.filter(u => u.status === UserStatus.INACTIVE).length,
        onLeave: this.users.filter(u => u.status === UserStatus.ON_LEAVE).length,
        byRole: {} as Record<UserRole, number>
      };

      // Count users by role
      Object.values(UserRole).forEach(role => {
        stats.byRole[role] = this.users.filter(u => u.role === role).length;
      });

      return ResponseUtil.success('User statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve user statistics');
    }
  }

  /**
   * Get active doctors, optionally filtered by department.
   * Safe subset exposed to patients for appointment booking — passwords are
   * stripped and only doctor accounts are ever returned.
   * @param dept Optional department filter
   * @returns Active doctors without passwords
   */
  async findDoctors(dept?: string) {
    try {
      let doctors = this.users.filter(
        u => u.role === UserRole.DOCTOR && u.status === UserStatus.ACTIVE,
      );
      if (dept) {
        doctors = doctors.filter(u => u.dept === dept);
      }
      const sanitized = DataSanitizer.removePasswords(doctors);
      return ResponseUtil.success('Doctors retrieved successfully', sanitized);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve doctors');
    }
  }

  /**
   * Get users by role
   * @param role User role
   * @returns Users filtered by role
   */
  async findByRole(role: UserRole) {
    try {
      const users = ArrayUtil.filterByProperty(this.users, 'role', role);
      
      // Remove password from response using utility
      const usersWithoutPassword = DataSanitizer.removePasswords(users);

      return ResponseUtil.success(`Users with role '${role}' retrieved successfully`, usersWithoutPassword);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve users by role');
    }
  }

  /**
   * Update user status
   * @param id User ID
   * @param status New status
   * @returns Updated user data
   */
  async updateStatus(id: string, status: UserStatus) {
    try {
      const user = ArrayUtil.findById(this.users, id);
      
      if (!user) {
        return ResponseUtil.notFound('User', id);
      }

      // Update status
      const currentUsers = this.users;
      const updatedUser = ArrayUtil.updateById(currentUsers, id, {
        status,
        updatedAt: new Date().toISOString()
      });
      this.users = currentUsers;

      if (!updatedUser) {
        return ResponseUtil.notFound('User', id);
      }

      // Remove password from response using utility
      const userWithoutPassword = DataSanitizer.removePassword(updatedUser);

      return ResponseUtil.updated('User status updated successfully', userWithoutPassword);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update user status');
    }
  }

  /**
   * Search users by name or email
   * @param query Search query
   * @returns Matching users
   */
  async search(query: string) {
    try {
      const matchingUsers = ArrayUtil.searchByText(this.users, query, ['name', 'email']);

      // Remove password from response using utility
      const usersWithoutPassword = DataSanitizer.removePasswords(matchingUsers);

      return ResponseUtil.success('Search results retrieved successfully', usersWithoutPassword);
    } catch (error) {
      return ResponseUtil.serverError('Failed to search users');
    }
  }

  // ── Regional manager assignment support ───────────────────────────────────
  //
  // These four read-only views back the Admin's "assign a regional officer"
  // flow. They all work off a SNAPSHOT: `this.users` and `this.hospitals` are
  // getters that re-read and re-parse JSON from disk on every access, so the
  // original implementation performed 2 file reads per officer per request
  // (suggestRMForHospital called getRMWorkload in a loop, and each call re-read
  // both files). With 3 officers that is 7 reads; with 50 it is 101. Taking one
  // snapshot per request makes it 2 reads regardless of how many officers exist.

  /** One read of each file, shared by every calculation in a single request. */
  private snapshot(): { users: User[]; hospitals: any[] } {
    return { users: this.users, hospitals: this.hospitals };
  }

  /**
   * Workload for one officer, computed against an existing snapshot.
   *
   * Level is driven by hospitals still needing a decision, not by headcount:
   * an officer with three pending registrations has more work in front of them
   * than one with ten hospitals already verified and quiet.
   */
  private workloadFor(rm: User, snap: { hospitals: any[] }): RMWorkload {
    const assigned = snap.hospitals.filter(h => h.assignedManagerId === rm.id);

    const countBy = (status: VerificationStatus) =>
      assigned.filter(h => h.verificationStatus === status).length;

    const pendingVerifications = countBy(VerificationStatus.PENDING_VERIFICATION);
    const verifiedHospitals = countBy(VerificationStatus.VERIFIED);
    const rejectedHospitals = countBy(VerificationStatus.REJECTED);
    const totalHospitals = assigned.length;

    // Pending work counts for more than a settled portfolio.
    const pressure = pendingVerifications * 3 + totalHospitals;
    let workloadLevel: 'low' | 'medium' | 'high' = 'low';
    if (pressure > 15) workloadLevel = 'high';
    else if (pressure > 8) workloadLevel = 'medium';

    return {
      regionalManagerId: rm.id,
      regionalManagerName: rm.name,
      regionalManagerEmail: rm.email,
      areas: rm.areas || [],
      totalHospitals,
      pendingVerifications,
      verifiedHospitals,
      rejectedHospitals,
      activeHospitals: verifiedHospitals,
      workloadLevel,
      lastActivity: rm.updatedAt,
    };
  }

  /**
   * Regional managers whose areas cover a city.
   * Used by the Admin when assigning an officer to a hospital.
   */
  async getRegionalManagersByCity(city: string) {
    try {
      const wanted = String(city || '').trim().toLowerCase();
      const regionalManagers = this.users.filter(
        user =>
          user.role === UserRole.REGIONAL_MANAGER &&
          // Area matching is case-insensitive: hospitals.json stores "tirupati"
          // for some rows and "Tirupati" for others, and an exact-match filter
          // silently returned nobody for the lowercase ones.
          (user.areas || []).some(area => String(area).trim().toLowerCase() === wanted),
      );

      return ResponseUtil.success(
        `Regional managers for city '${city}' retrieved successfully`,
        DataSanitizer.removePasswords(regionalManagers),
      );
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve regional managers by city');
    }
  }

  /**
   * One regional manager's current workload.
   * Returns the standard envelope like every other endpoint in the app.
   */
  async getRMWorkload(managerId: string) {
    try {
      const snap = this.snapshot();
      const rm = snap.users.find(u => u.id === managerId);
      if (!rm || rm.role !== UserRole.REGIONAL_MANAGER) {
        return ResponseUtil.notFound('Regional manager', managerId);
      }
      return ResponseUtil.success(
        'Regional manager workload retrieved successfully',
        this.workloadFor(rm, snap),
      );
    } catch (error) {
      return ResponseUtil.serverError('Failed to get regional manager workload');
    }
  }

  /**
   * Who should take a hospital in this city.
   *
   * Officers whose areas cover the city come first, then the least loaded.
   * Officers from other areas are still returned rather than hidden — a city
   * with nobody assigned to it must not produce an empty dropdown, which is
   * what made assignment impossible before areas were seeded at all.
   */
  async suggestRMForHospital(hospitalCity: string) {
    try {
      const snap = this.snapshot();
      const wanted = String(hospitalCity || '').trim().toLowerCase();
      const regionalManagers = snap.users.filter(u => u.role === UserRole.REGIONAL_MANAGER);

      const covers = (rm: User) =>
        (rm.areas || []).some(area => String(area).trim().toLowerCase() === wanted);

      const suggestions: RMSuggestion[] = regionalManagers.map(rm => {
        const workload = this.workloadFor(rm, snap);
        const cityMatch = covers(rm);

        let recommendation: string;
        let reason: string;
        if (workload.workloadLevel === 'high') {
          recommendation = 'not_recommended';
          reason = `Already carrying ${workload.totalHospitals} hospitals`;
        } else if (workload.workloadLevel === 'medium') {
          recommendation = 'acceptable';
          reason = `Moderate load — ${workload.totalHospitals} hospitals`;
        } else {
          recommendation = 'available';
          // The original text said "No current workload" regardless of the real
          // number, so an officer with two hospitals still read as idle.
          reason = workload.totalHospitals
            ? `Light load — ${workload.totalHospitals} hospital${workload.totalHospitals === 1 ? '' : 's'}`
            : 'No hospitals assigned yet';
        }
        if (workload.pendingVerifications) {
          reason += `, ${workload.pendingVerifications} awaiting review`;
        }
        reason += cityMatch
          ? `, covers ${hospitalCity}`
          : `, does not cover ${hospitalCity}`;

        return {
          regionalManagerId: rm.id,
          regionalManagerName: rm.name,
          regionalManagerEmail: rm.email,
          areas: rm.areas || [],
          currentWorkload: workload.totalHospitals,
          workloadLevel: workload.workloadLevel,
          recommendation,
          reason,
        };
      });

      // City coverage first, then the lightest load.
      suggestions.sort((a, b) => {
        const aMatch = covers({ areas: a.areas } as User);
        const bMatch = covers({ areas: b.areas } as User);
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
        return a.currentWorkload - b.currentWorkload;
      });

      return ResponseUtil.success(
        `Regional manager suggestions for '${hospitalCity}' retrieved successfully`,
        suggestions,
      );
    } catch (error) {
      return ResponseUtil.serverError('Failed to suggest a regional manager');
    }
  }

  /** Every regional manager with their workload — the Admin's overview. */
  async getAllRMWorkloads() {
    try {
      const snap = this.snapshot();
      const workloads = snap.users
        .filter(u => u.role === UserRole.REGIONAL_MANAGER)
        .map(rm => this.workloadFor(rm, snap))
        .sort((a, b) => b.totalHospitals - a.totalHospitals);

      return ResponseUtil.success(
        'Regional manager workloads retrieved successfully',
        workloads,
      );
    } catch (error) {
      return ResponseUtil.serverError('Failed to get regional manager workloads');
    }
  }
}
