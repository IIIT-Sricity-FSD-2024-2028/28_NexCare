import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { LoginRequest, RegisterRequest, AuthResponse, UserSession } from './interfaces/auth.interface';
import { UserRole, UserStatus } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';
import { PatientsService } from '../patients/patients.service';

/**
 * Roles that exist purely as directory records on this non-clinical platform.
 * They can be created and referenced (appointments, leave rosters, headcount) but
 * are never granted a session — NexCare has no clinical portal.
 */
const NON_LOGIN_ROLES: UserRole[] = [UserRole.DOCTOR, UserRole.NURSE];

/**
 * Authentication Service
 * Handles user authentication, registration, and session management.
 *
 * Key improvements over the placeholder:
 *  - Users are loaded from / saved to data/users.json → survive backend restarts.
 *  - Tokens are real HMAC-SHA256 signed JWTs (no external library needed).
 *  - JWT secret comes from process.env.JWT_SECRET (set in .env).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly systemService: SystemService,
    private readonly patientsService: PatientsService,
  ) {}

  // ── Paths ────────────────────────────────────────────────────────────────
  private readonly usersFilePath = path.join(process.cwd(), 'data', 'users.json');

  // ── JWT configuration ────────────────────────────────────────────────────
  private readonly jwtSecret: string =
    process.env.JWT_SECRET || 'nexcare_jwt_secret_key_2024_evaluation';
  private readonly jwtExpiresInSeconds: number = 24 * 60 * 60; // 24 hours

  // ── In-memory sessions (intentionally ephemeral) ─────────────────────────
  private sessions: Map<string, UserSession> = new Map();

  // ─────────────────────────────────────────────────────────────────────────
  // File-backed user store
  // ─────────────────────────────────────────────────────────────────────────

  /** Load users from disk (falls back to empty array on error) */
  private loadUsers(): any[] {
    try {
      const raw = fs.readFileSync(this.usersFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /** Persist the full users array to disk */
  private saveUsers(users: any[]): void {
    try {
      fs.mkdirSync(path.dirname(this.usersFilePath), { recursive: true });
      fs.writeFileSync(this.usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist users to disk:', err);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JWT helpers (HMAC-SHA256, no external library)
  // ─────────────────────────────────────────────────────────────────────────

  // ── Password hashing (scrypt, no external library) ───────────────────────
  // Stored format: "scrypt$<saltHex>$<hashHex>". Legacy plaintext passwords in
  // seed data are still accepted and transparently upgraded on next login.

  private hashPassword(plain: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
  }

  /** True if `stored` is a hashed password (vs legacy plaintext). */
  private isHashed(stored: string): boolean {
    return typeof stored === 'string' && stored.startsWith('scrypt$');
  }

  /** Verify a plaintext password against a stored hash OR legacy plaintext. */
  private verifyPassword(plain: string, stored: string): boolean {
    if (!this.isHashed(stored)) {
      return stored === plain; // legacy plaintext
    }
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) return false;
    const computed = crypto.scryptSync(plain, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return computed.length === expected.length && crypto.timingSafeEqual(computed, expected);
  }

  private b64url(input: string | Buffer): string {
    const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /** Generate a signed JWT containing the user's id, role, and email */
  private generateToken(user: any): string {
    const header = this.b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const payload = this.b64url(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        patientId: user.patientId || null,
        hospitalId: user.hospitalId || null,
        iat: now,
        exp: now + this.jwtExpiresInSeconds,
      }),
    );
    const signature = this.b64url(
      crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${payload}`)
        .digest(),
    );
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Verify a JWT token.
   * Returns the decoded payload if valid, or null if expired / tampered.
   */
  verifyToken(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, payload, signature] = parts;
      const expectedSig = this.b64url(
        crypto
          .createHmac('sha256', this.jwtSecret)
          .update(`${header}.${payload}`)
          .digest(),
      );

      // Constant-time comparison to prevent timing attacks
      if (
        signature.length !== expectedSig.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
      ) {
        return null;
      }

      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));

      // Check expiry
      if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
        return null; // Token expired
      }

      return decoded;
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Auth operations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Authenticate a user with email, password, and role.
   */
  async login(loginRequest: LoginRequest) {
    try {
      const users = this.loadUsers();
      const userIndex = users.findIndex(
        (u) => u.email.toLowerCase() === loginRequest.email.toLowerCase(),
      );
      const user = userIndex >= 0 ? users[userIndex] : null;

      if (!user) {
        return ResponseUtil.error('Authentication Failed: Email address not found');
      }

      if (!this.verifyPassword(loginRequest.password, user.password)) {
        return ResponseUtil.error('Authentication Failed: Incorrect password');
      }

      // Transparently upgrade legacy plaintext passwords to a hash on login.
      if (!this.isHashed(user.password)) {
        users[userIndex].password = this.hashPassword(loginRequest.password);
        this.saveUsers(users);
      }

      if (user.role !== loginRequest.role) {
        return ResponseUtil.error(
          `Access Denied: Account is registered as '${user.role}', not '${loginRequest.role}'`,
        );
      }

      // NexCare is a non-clinical platform. Clinical roles exist only as directory
      // records so appointments and rosters can reference them — they have no portal
      // and are never issued a session.
      if (NON_LOGIN_ROLES.includes(user.role)) {
        return ResponseUtil.error(
          `Access Denied: '${user.role}' is a directory record, not a NexCare login account.`,
        );
      }

      if (user.status === UserStatus.INACTIVE) {
        return ResponseUtil.error('Account is inactive. Please contact the administrator.');
      }

      // Build and store session
      const session: UserSession = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        loginTime: new Date().toISOString(),
        patientId: user.patientId || null,
        hospitalId: user.hospitalId || null,
      };
      this.sessions.set(user.id, session);

      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          patientId: user.patientId || null,
          hospitalId: user.hospitalId || null,
        },
        token: this.generateToken(user),
      };

      // Log activity
      this.systemService.createActivity({
        userId: user.id,
        action: 'Login',
        details: `User ${user.name} logged in successfully as ${user.role}`,
        module: 'Authentication',
        severity: 'INFO'
      });

      return ResponseUtil.success('Login successful', authResponse);
    } catch (error) {
      console.error('Login error:', error);
      return ResponseUtil.serverError('Login failed due to a server error');
    }
  }

  /**
   * Register a new patient account and persist to disk.
   */
  async register(registerRequest: RegisterRequest) {
    try {
      const users = this.loadUsers();

      const existing = users.find(
        (u) => u.email.toLowerCase() === registerRequest.email.toLowerCase(),
      );
      if (existing) {
        return ResponseUtil.error('Email is already registered');
      }

      const newUserId = IdGenerator.generateUserId();
      const newPatientId = IdGenerator.generatePatientId();

      const newUser = {
        id: newUserId,
        name: registerRequest.fullName,
        email: registerRequest.email,
        role: UserRole.PATIENT,
        status: UserStatus.ACTIVE,
        password: this.hashPassword(registerRequest.password),
        patientId: newPatientId,
      };

      users.push(newUser);
      this.saveUsers(users); // ← persists to data/users.json

      // Create patient record in PatientsService
      await this.patientsService.create({
        fullName: registerRequest.fullName,
        email: registerRequest.email,
        phone: registerRequest.phone || '',
        bloodGroup: 'Unknown',
        age: 0
      });

      const session: UserSession = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        loginTime: new Date().toISOString(),
        patientId: newUser.patientId,
      };
      this.sessions.set(newUser.id, session);

      const authResponse: AuthResponse = {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          patientId: newUser.patientId,
        },
        token: this.generateToken(newUser),
      };

      // Log activity
      this.systemService.createActivity({
        userId: newUser.id,
        action: 'Register',
        details: `New patient account registered: ${newUser.name} (${newUser.email})`,
        module: 'Authentication',
        severity: 'INFO'
      });

      return ResponseUtil.created('Patient account created successfully', authResponse);
    } catch (error) {
      console.error('Registration error:', error);
      return ResponseUtil.serverError('Registration failed due to a server error');
    }
  }

  /**
   * Register a new staff account (administrative_staff, ambulance).
   * Unlike patient registration, the role is supplied by the applicant and the
   * account is scoped to a hospital. No patient record is created.
   */
  async registerStaff(data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    hospitalId: string;
    dept?: string;
  }) {
    try {
      const users = this.loadUsers();

      const existing = users.find(
        (u) => u.email.toLowerCase() === data.email.toLowerCase(),
      );
      if (existing) {
        return ResponseUtil.error('Email is already registered');
      }

      const newUser = {
        id: IdGenerator.generateUserId(),
        name: data.fullName,
        email: data.email,
        role: data.role,
        status: UserStatus.ACTIVE,
        password: this.hashPassword(data.password),
        phone: data.phone,
        hospitalId: data.hospitalId,
        dept: data.dept,
      };

      users.push(newUser);
      this.saveUsers(users);

      const session: UserSession = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        loginTime: new Date().toISOString(),
        hospitalId: newUser.hospitalId,
      };
      this.sessions.set(newUser.id, session);

      const authResponse: AuthResponse = {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          hospitalId: newUser.hospitalId,
        },
        token: this.generateToken(newUser),
      };

      this.systemService.createActivity({
        userId: newUser.id,
        action: 'Register',
        details: `New staff account registered: ${newUser.name} (${newUser.role}) at ${newUser.hospitalId}`,
        module: 'Authentication',
        severity: 'INFO',
      });

      return ResponseUtil.created('Staff account created successfully', authResponse);
    } catch (error) {
      console.error('Staff registration error:', error);
      return ResponseUtil.serverError('Staff registration failed due to a server error');
    }
  }

  /**
   * Logout — removes the in-memory session (token becomes orphaned and
   * will be rejected by the guard on expiry).
   */
  async logout(userId: string) {
    try {
      this.sessions.delete(userId);
      
      // Log activity
      this.systemService.createActivity({
        userId: userId,
        action: 'Logout',
        details: `User logged out`,
        module: 'Authentication',
        severity: 'INFO'
      });

      return ResponseUtil.success('Logout successful');
    } catch (error) {
      return ResponseUtil.serverError('Logout failed due to a server error');
    }
  }

  /**
   * Get the current in-memory session for a user.
   */
  async getCurrentUser(userId: string) {
    try {
      const session = this.sessions.get(userId);
      if (!session) {
        return ResponseUtil.error('Session not found — please log in again');
      }
      return ResponseUtil.success('Session retrieved successfully', session);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve session');
    }
  }

  /**
   * Get all active in-memory sessions (superuser only).
   */
  async getActiveSessions() {
    try {
      const sessions = Array.from(this.sessions.values());
      return ResponseUtil.success('Active sessions retrieved', sessions);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve active sessions');
    }
  }

  /**
   * Change password for a user identified by email.
   * Validates current password and enforces minimum length for new password.
   */
  async changePassword(data: { currentPassword: string; newPassword: string; userId?: string }) {
    try {
      if (!data.userId) {
        return ResponseUtil.unauthorized('You must be logged in to change your password');
      }

      if (!data.currentPassword || !data.newPassword) {
        return ResponseUtil.error('Both current and new password are required');
      }

      if (data.newPassword.length < 6) {
        return ResponseUtil.error('New password must be at least 6 characters long');
      }

      if (data.currentPassword === data.newPassword) {
        return ResponseUtil.error('New password must be different from current password');
      }

      const users = this.loadUsers();

      // Only ever operate on the authenticated user's own record.
      const userIndex = users.findIndex(u => u.id === data.userId);
      const user = userIndex >= 0 ? users[userIndex] : null;

      if (!user) {
        return ResponseUtil.error('User account not found');
      }

      if (!this.verifyPassword(data.currentPassword, user.password)) {
        return ResponseUtil.error('Current password is incorrect');
      }

      // Update password (stored hashed)
      users[userIndex].password = this.hashPassword(data.newPassword);
      this.saveUsers(users);

      // Log activity
      this.systemService.createActivity({
        userId: user.id,
        action: 'PasswordChange',
        details: `Password changed for user ${user.name}`,
        module: 'Authentication',
        severity: 'INFO'
      });

      return ResponseUtil.success('Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      return ResponseUtil.serverError('Failed to change password');
    }
  }
}
