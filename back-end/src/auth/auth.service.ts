import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { LoginRequest, RegisterRequest, AuthResponse, UserSession } from './interfaces/auth.interface';
import { UserRole, UserStatus } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';

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
  constructor(private readonly systemService: SystemService) {}

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

      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));

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
      const user = users.find(
        (u) => u.email.toLowerCase() === loginRequest.email.toLowerCase(),
      );

      if (!user) {
        return ResponseUtil.error('Authentication Failed: Email address not found');
      }

      if (user.password !== loginRequest.password) {
        return ResponseUtil.error('Authentication Failed: Incorrect password');
      }

      if (user.role !== loginRequest.role) {
        return ResponseUtil.error(
          `Access Denied: Account is registered as '${user.role}', not '${loginRequest.role}'`,
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
      };
      this.sessions.set(user.id, session);

      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
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
        password: registerRequest.password,
        patientId: newPatientId,
      };

      users.push(newUser);
      this.saveUsers(users); // ← persists to data/users.json

      const session: UserSession = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        loginTime: new Date().toISOString(),
      };
      this.sessions.set(newUser.id, session);

      const authResponse: AuthResponse = {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
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
}
