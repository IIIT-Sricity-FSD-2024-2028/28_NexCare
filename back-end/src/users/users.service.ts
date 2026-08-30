import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { DataSanitizer } from '../common/utils/sanitizer.util';
import { User, CreateUserRequest, UpdateUserRequest, UserStats } from './interfaces/user.interface';
import { UserRole, UserStatus } from '../common/interfaces/api-response.interface';

/**
 * Users Service
 * Manages user accounts across all roles in the NexCare system
 * Handles CRUD operations for users with role-based access control
 */
@Injectable()
export class UsersService {
  // In-memory mock users database (aligned with frontend db.js)
private readonly usersFilePath = path.join(process.cwd(), 'data', 'users.json');

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to users array
      const currentUsers = this.users;
      currentUsers.push(newUser);
      this.users = currentUsers;

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
}
