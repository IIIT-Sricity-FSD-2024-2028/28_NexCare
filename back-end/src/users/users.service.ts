import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { DataSanitizer } from '../common/utils/sanitizer.util';
import { User, CreateUserRequest, UpdateUserRequest, UserStats, RMWorkload, RMSuggestion } from './interfaces/user.interface';
import { UserRole, UserStatus, VerificationStatus } from '../common/interfaces/api-response.interface';

/**
 * Users Service
 * Manages user accounts across all roles in the NexCare system
 * Handles CRUD operations for users with role-based access control
 */
@Injectable()
export class UsersService {
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
   * Create new user
   * @param userData User creation data
   * @returns Created user data
   */
  async create(userData: CreateUserRequest) {
    try {
      // Check if email already exists
      const existingUser = ArrayUtil.searchByText(this.users, userData.email, ['email']);
      if (existingUser.length > 0) {
        return ResponseUtil.error('Email already exists');
      }

      // Generate new user ID using utility
      const newUserId = IdGenerator.generateUserId();

      // Create new user
      const newUser: User = {
        id: newUserId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: UserStatus.ACTIVE,
        password: userData.password,
        patientId: userData.patientId,
        dept: userData.dept,
        hospitalId: userData.hospitalId,
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

      // Remove password from response using utility
      const userWithoutPassword = DataSanitizer.removePassword(newUser);

      return ResponseUtil.created('User created successfully', userWithoutPassword);
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

      // Check if email is being updated and already exists
      if (updateData.email) {
        const allUsersWithEmail = ArrayUtil.searchByText(this.users, updateData.email, ['email']);
        const existingUser = allUsersWithEmail.find(u => u.id !== id);
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

  /**
   * Get regional managers by city
   * Used by super admin for RM assignment
   * Returns RMs assigned to the specified city
   */
  async getRegionalManagersByCity(city: string) {
    try {
      const regionalManagers = this.users.filter(user => 
        user.role === UserRole.REGIONAL_MANAGER && 
        user.city && 
        user.city.toLowerCase() === city.toLowerCase()
      );

      const rmsWithoutPassword = DataSanitizer.removePasswords(regionalManagers);

      return ResponseUtil.success(`Regional managers for city '${city}' retrieved successfully`, rmsWithoutPassword);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve regional managers by city');
    }
  }

  /**
   * Get regional manager workload
   * Used by super admin for workload balancing
   */
  async getRMWorkload(managerId: string): Promise<RMWorkload> {
    try {
      const rm = ArrayUtil.findById(this.users, managerId);
      if (!rm || rm.role !== UserRole.REGIONAL_MANAGER) {
        throw new Error('Regional manager not found');
      }

      const hospitals = this.hospitals;
      const assignedHospitals = hospitals.filter(h => h.assignedManagerId === managerId);

      const pendingVerifications = assignedHospitals.filter(h => 
        h.verificationStatus === VerificationStatus.PENDING_VERIFICATION
      ).length;

      const verifiedHospitals = assignedHospitals.filter(h => 
        h.verificationStatus === VerificationStatus.VERIFIED
      ).length;

      const rejectedHospitals = assignedHospitals.filter(h => 
        h.verificationStatus === VerificationStatus.REJECTED
      ).length;

      const activeHospitals = verifiedHospitals; // Active = verified

      // Calculate workload level
      const totalHospitals = assignedHospitals.length;
      let workloadLevel: 'low' | 'medium' | 'high' = 'low';
      if (totalHospitals > 15) workloadLevel = 'high';
      else if (totalHospitals > 8) workloadLevel = 'medium';

      const workload: RMWorkload = {
        regionalManagerId: rm.id,
        regionalManagerName: rm.name,
        regionalManagerEmail: rm.email,
        city: rm.city || 'Not assigned',
        state: rm.state,
        totalHospitals,
        pendingVerifications,
        verifiedHospitals,
        rejectedHospitals,
        activeHospitals,
        workloadLevel,
        lastActivity: rm.updatedAt
      };

      return workload;
    } catch (error) {
      throw new Error('Failed to get RM workload');
    }
  }

  /**
   * Suggest regional manager for hospital
   * Used by super admin for smart assignment
   * Suggests RM based on city match and workload
   */
  async suggestRMForHospital(hospitalCity: string): Promise<RMSuggestion[]> {
    try {
      // Get all regional managers
      const regionalManagers = this.users.filter(user => user.role === UserRole.REGIONAL_MANAGER);

      if (regionalManagers.length === 0) {
        return [];
      }

      // Calculate workload for each RM
      const suggestions: RMSuggestion[] = [];
      for (const rm of regionalManagers) {
        const workload = await this.getRMWorkload(rm.id);
        
        // Check if RM's city matches hospital city
        const cityMatch = rm.city && rm.city.toLowerCase() === hospitalCity.toLowerCase();
        
        let recommendation = 'available';
        let reason = 'No current workload';
        
        if (workload.workloadLevel === 'high') {
          recommendation = 'not_recommended';
          reason = 'High current workload';
        } else if (workload.workloadLevel === 'medium') {
          recommendation = 'acceptable';
          reason = 'Moderate workload, still available';
        }

        if (cityMatch) {
          reason += ', assigned to this city';
        } else {
          reason += ', different city assignment';
        }

        suggestions.push({
          regionalManagerId: rm.id,
          regionalManagerName: rm.name,
          regionalManagerEmail: rm.email,
          city: rm.city || 'Not assigned',
          state: rm.state,
          currentWorkload: workload.totalHospitals,
          workloadLevel: workload.workloadLevel,
          recommendation,
          reason
        });
      }

      // Sort by workload (low to high), prioritize city match
      suggestions.sort((a, b) => {
        // First sort by city match (RMs assigned to this city get priority)
        const aCityMatch = a.city.toLowerCase() === hospitalCity.toLowerCase();
        const bCityMatch = b.city.toLowerCase() === hospitalCity.toLowerCase();
        if (aCityMatch && !bCityMatch) return -1;
        if (!aCityMatch && bCityMatch) return 1;
        
        // Then sort by workload
        if (a.currentWorkload !== b.currentWorkload) {
          return a.currentWorkload - b.currentWorkload;
        }
        return 0;
      });

      return suggestions;
    } catch (error) {
      throw new Error('Failed to suggest regional manager');
    }
  }

  /**
   * Get all regional managers with their workload
   * Used by super admin for overview
   */
  async getAllRMWorkloads(): Promise<RMWorkload[]> {
    try {
      const regionalManagers = this.users.filter(user => user.role === UserRole.REGIONAL_MANAGER);
      const workloads: RMWorkload[] = [];

      for (const rm of regionalManagers) {
        try {
          const workload = await this.getRMWorkload(rm.id);
          workloads.push(workload);
        } catch (error) {
          console.error(`Failed to get workload for RM ${rm.id}:`, error);
        }
      }

      return workloads;
    } catch (error) {
      throw new Error('Failed to get all RM workloads');
    }
  }
}
