import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { DataSanitizer } from '../common/utils/sanitizer.util';
import { LoginRequest, RegisterRequest, AuthResponse, UserSession } from './interfaces/auth.interface';
import { UserRole, UserStatus } from '../common/interfaces/api-response.interface';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 * Uses in-memory mock data aligned with frontend db.js structure
 */
@Injectable()
export class AuthService {
  // In-memory mock users database (aligned with frontend db.js)
  private users = [
    {
      id: 'U001',
      name: 'System Administrator',
      email: 'superuser@nexcare.com',
      role: UserRole.SUPERUSER,
      status: UserStatus.ACTIVE,
      password: 'Password123'
    },
    {
      id: 'U002',
      name: 'Jane Doe (Desk)',
      email: 'admin@nexcare.com',
      role: UserRole.ADMINISTRATIVE_STAFF,
      status: UserStatus.ACTIVE,
      password: 'Password123'
    },
    {
      id: 'U003',
      name: 'Alex Martinez',
      email: 'ambulance@nexcare.com',
      role: UserRole.AMBULANCE,
      status: UserStatus.ACTIVE,
      password: 'Password123'
    },
    {
      id: 'U004',
      name: 'John Anderson',
      email: 'patient@gmail.com',
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      patientId: 'P001'
    },
    {
      id: 'U005',
      name: 'Dr. Sarah Smith',
      email: 'sarah.smith@nexcare.com',
      role: UserRole.DOCTOR,
      dept: 'Cardiology',
      status: UserStatus.ACTIVE,
      password: 'Password123'
    },
    {
      id: 'U006',
      name: 'Dr. Vikram Patel',
      email: 'vikram.patel@nexcare.com',
      role: UserRole.DOCTOR,
      dept: 'Orthopedics',
      status: UserStatus.ACTIVE,
      password: 'Password123'
    },
    {
      id: 'U007',
      name: 'Dr. Anjali Desai',
      email: 'anjali.desai@nexcare.com',
      role: UserRole.DOCTOR,
      dept: 'General Medicine',
      status: UserStatus.ON_LEAVE,
      password: 'Password123'
    },
    {
      id: 'U008',
      name: 'Nurse Emily Davis',
      email: 'emily.davis@nexcare.com',
      role: UserRole.NURSE,
      dept: 'ER',
      status: UserStatus.ACTIVE,
      password: 'Password123'
    },
    {
      id: 'U009',
      name: 'Maria Garcia',
      email: 'maria@example.com',
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      password: 'Password123',
      patientId: 'P002'
    }
  ];

  // In-memory sessions storage
  private sessions: Map<string, UserSession> = new Map();

  /**
   * Authenticate user with email, password, and role
   * @param loginRequest Login credentials
   * @returns Authentication response with user data and token
   */
  async login(loginRequest: LoginRequest) {
    try {
      // Find user by email
      const users = ArrayUtil.searchByText(this.users, loginRequest.email, ['email']);
      const user = users.length > 0 ? users[0] : null;
      
      if (!user) {
        return ResponseUtil.error('Authentication Failed: Email address not found');
      }

      // Verify password
      if (user.password !== loginRequest.password) {
        return ResponseUtil.error('Authentication Failed: Incorrect password');
      }

      // Verify role
      if (user.role !== loginRequest.role) {
        return ResponseUtil.error(
          `Access Denied: User exists but is not registered as '${loginRequest.role}'. (Registered as: ${user.role})`
        );
      }

      // Check user status
      if (user.status === UserStatus.INACTIVE) {
        return ResponseUtil.error('Account is inactive. Please contact administrator.');
      }

      // Create user session
      const session: UserSession = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        loginTime: new Date().toISOString()
      };

      // Store session (in production, use Redis or database)
      this.sessions.set(user.id, session);

      // Prepare auth response
      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        },
        token: this.generateToken(user) // Placeholder token generation
      };

      return ResponseUtil.success('Login successful', authResponse);
    } catch (error) {
      return ResponseUtil.serverError('Login failed due to server error');
    }
  }

  /**
   * Register new patient account
   * @param registerRequest Patient registration data
   * @returns Authentication response for newly registered user
   */
  async register(registerRequest: RegisterRequest) {
    try {
      // Check if email already exists
      const existingUser = ArrayUtil.searchByText(this.users, registerRequest.email, ['email']);
      if (existingUser.length > 0) {
        return ResponseUtil.error('Email already registered');
      }

      // Generate new user ID
      const newUserId = IdGenerator.generateUserId();
      const newPatientId = IdGenerator.generatePatientId();

      // Create new user
      const newUser = {
        id: newUserId,
        name: registerRequest.fullName,
        email: registerRequest.email,
        role: UserRole.PATIENT,
        status: UserStatus.ACTIVE,
        password: registerRequest.password,
        patientId: newPatientId
      };

      // Add to users array (in production, save to database)
      this.users.push(newUser);

      // Create session for new user
      const session: UserSession = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        loginTime: new Date().toISOString()
      };

      this.sessions.set(newUser.id, session);

      // Prepare auth response
      const authResponse: AuthResponse = {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status
        },
        token: this.generateToken(newUser)
      };

      return ResponseUtil.created('Patient account created successfully', authResponse);
    } catch (error) {
      return ResponseUtil.serverError('Registration failed due to server error');
    }
  }

  /**
   * Logout user and invalidate session
   * @param userId User ID to logout
   * @returns Logout response
   */
  async logout(userId: string) {
    try {
      // Remove session
      this.sessions.delete(userId);
      return ResponseUtil.success('Logout successful');
    } catch (error) {
      return ResponseUtil.serverError('Logout failed due to server error');
    }
  }

  /**
   * Get current user session
   * @param userId User ID
   * @returns User session data
   */
  async getCurrentUser(userId: string) {
    try {
      const session = this.sessions.get(userId);
      if (!session) {
        return ResponseUtil.error('Session not found');
      }
      return ResponseUtil.success('Session retrieved successfully', session);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve session');
    }
  }

  /**
   * Generate placeholder token (teammates will implement proper JWT)
   * @param user User data
   * @returns Placeholder token string
   */
  private generateToken(user: any): string {
    // Placeholder token generation - teammates will implement proper JWT
    return `token_${user.id}_${Date.now()}`;
  }

  /**
   * Validate token (placeholder for future JWT validation)
   * @param token Token string
   * @returns User session if valid
   */
  async validateToken(token: string): Promise<UserSession | null> {
    // Placeholder token validation - teammates will implement proper JWT validation
    try {
      if (token.startsWith('token_')) {
        const parts = token.split('_');
        const userId = parts[1];
        return this.sessions.get(userId) || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all active sessions (for admin monitoring)
   * @returns All active sessions
   */
  async getActiveSessions() {
    try {
      const sessions = Array.from(this.sessions.values());
      return ResponseUtil.success('Active sessions retrieved', sessions);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve active sessions');
    }
  }
}
