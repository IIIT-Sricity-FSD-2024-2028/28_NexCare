import { Injectable } from '@nestjs/common';
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
  private users: User[] = [
    {
      id: 'U001',
      name: 'System Administrator',
      email: 'superuser@nexcare.com',
      role: UserRole.SUPERUSER,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'U002',
      name: 'Jane Doe (Desk)',
      email: 'admin@nexcare.com',
      role: UserRole.ADMINISTRATIVE_STAFF,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'U003',
      name: 'Alex Martinez',
      email: 'ambulance@nexcare.com',
      role: UserRole.AMBULANCE,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'U004',
      name: 'John Anderson',
      email: 'patient@gmail.com',
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      patientId: 'P001',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'U005',
      name: 'Dr. Sarah Smith',
      email: 'sarah.smith@nexcare.com',
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      dept: 'Cardiology',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'U006',
      name: 'Dr. Vikram Patel',
      email: 'vikram.patel@nexcare.com',
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      dept: 'Orthopedics',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'U007',
      name: 'Dr. Anjali Desai',
      email: 'anjali.desai@nexcare.com',
      role: UserRole.DOCTOR,
      status: UserStatus.ON_LEAVE,
      password: 'Password123',
      dept: 'General Medicine',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'U008',
      name: 'Nurse Emily Davis',
      email: 'emily.davis@nexcare.com',
      role: UserRole.NURSE,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      dept: 'ER',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'U009',
      name: 'Maria Garcia',
      email: 'maria@example.com',
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      patientId: 'P002',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to users array
      this.users.push(newUser);

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
      const updatedUser = ArrayUtil.updateById(this.users, id, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

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
      ArrayUtil.removeById(this.users, id);

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
      const updatedUser = ArrayUtil.updateById(this.users, id, {
        status,
        updatedAt: new Date().toISOString()
      });

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
