"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const system_service_1 = require("../system/system.service");
const patients_service_1 = require("../patients/patients.service");
const NON_LOGIN_ROLES = [api_response_interface_1.UserRole.DOCTOR, api_response_interface_1.UserRole.NURSE];
let AuthService = class AuthService {
    constructor(systemService, patientsService) {
        this.systemService = systemService;
        this.patientsService = patientsService;
        this.usersFilePath = path.join(process.cwd(), 'data', 'users.json');
        this.jwtSecret = process.env.JWT_SECRET || 'nexcare_jwt_secret_key_2024_evaluation';
        this.jwtExpiresInSeconds = 24 * 60 * 60;
        this.sessions = new Map();
    }
    loadUsers() {
        try {
            const raw = fs.readFileSync(this.usersFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    saveUsers(users) {
        try {
            fs.mkdirSync(path.dirname(this.usersFilePath), { recursive: true });
            fs.writeFileSync(this.usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist users to disk:', err);
        }
    }
    hashPassword(plain) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
        return `scrypt$${salt}$${hash}`;
    }
    isHashed(stored) {
        return typeof stored === 'string' && stored.startsWith('scrypt$');
    }
    verifyPassword(plain, stored) {
        if (!this.isHashed(stored)) {
            return stored === plain;
        }
        const [, salt, hash] = stored.split('$');
        if (!salt || !hash)
            return false;
        const computed = crypto.scryptSync(plain, salt, 64);
        const expected = Buffer.from(hash, 'hex');
        return computed.length === expected.length && crypto.timingSafeEqual(computed, expected);
    }
    b64url(input) {
        const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
        return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    generateToken(user) {
        const header = this.b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const now = Math.floor(Date.now() / 1000);
        const payload = this.b64url(JSON.stringify({
            sub: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            patientId: user.patientId || null,
            hospitalId: user.hospitalId || null,
            iat: now,
            exp: now + this.jwtExpiresInSeconds,
        }));
        const signature = this.b64url(crypto
            .createHmac('sha256', this.jwtSecret)
            .update(`${header}.${payload}`)
            .digest());
        return `${header}.${payload}.${signature}`;
    }
    verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3)
                return null;
            const [header, payload, signature] = parts;
            const expectedSig = this.b64url(crypto
                .createHmac('sha256', this.jwtSecret)
                .update(`${header}.${payload}`)
                .digest());
            if (signature.length !== expectedSig.length ||
                !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
                return null;
            }
            const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
            if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
                return null;
            }
            return decoded;
        }
        catch {
            return null;
        }
    }
    async login(loginRequest) {
        try {
            const users = this.loadUsers();
            const userIndex = users.findIndex((u) => u.email.toLowerCase() === loginRequest.email.toLowerCase());
            const user = userIndex >= 0 ? users[userIndex] : null;
            if (!user) {
                return response_util_1.ResponseUtil.error('Authentication Failed: Email address not found');
            }
            if (!this.verifyPassword(loginRequest.password, user.password)) {
                return response_util_1.ResponseUtil.error('Authentication Failed: Incorrect password');
            }
            if (!this.isHashed(user.password)) {
                users[userIndex].password = this.hashPassword(loginRequest.password);
                this.saveUsers(users);
            }
            if (user.role !== loginRequest.role) {
                return response_util_1.ResponseUtil.error(`Access Denied: Account is registered as '${user.role}', not '${loginRequest.role}'`);
            }
            if (NON_LOGIN_ROLES.includes(user.role)) {
                return response_util_1.ResponseUtil.error(`Access Denied: '${user.role}' is a directory record, not a NexCare login account.`);
            }
            if (user.status === api_response_interface_1.UserStatus.INACTIVE) {
                return response_util_1.ResponseUtil.error('Account is inactive. Please contact the administrator.');
            }
            const session = {
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
            const authResponse = {
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
            this.systemService.createActivity({
                userId: user.id,
                action: 'Login',
                details: `User ${user.name} logged in successfully as ${user.role}`,
                module: 'Authentication',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.success('Login successful', authResponse);
        }
        catch (error) {
            console.error('Login error:', error);
            return response_util_1.ResponseUtil.serverError('Login failed due to a server error');
        }
    }
    async register(registerRequest) {
        try {
            const users = this.loadUsers();
            const existing = users.find((u) => u.email.toLowerCase() === registerRequest.email.toLowerCase());
            if (existing) {
                return response_util_1.ResponseUtil.error('Email is already registered');
            }
            const newUserId = id_generator_util_1.IdGenerator.generateUserId();
            const newPatientId = id_generator_util_1.IdGenerator.generatePatientId();
            const newUser = {
                id: newUserId,
                name: registerRequest.fullName,
                email: registerRequest.email,
                role: api_response_interface_1.UserRole.PATIENT,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: this.hashPassword(registerRequest.password),
                patientId: newPatientId,
            };
            users.push(newUser);
            this.saveUsers(users);
            await this.patientsService.create({
                fullName: registerRequest.fullName,
                email: registerRequest.email,
                phone: registerRequest.phone || '',
                bloodGroup: 'Unknown',
                age: 0
            });
            const session = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
                loginTime: new Date().toISOString(),
                patientId: newUser.patientId,
            };
            this.sessions.set(newUser.id, session);
            const authResponse = {
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
            this.systemService.createActivity({
                userId: newUser.id,
                action: 'Register',
                details: `New patient account registered: ${newUser.name} (${newUser.email})`,
                module: 'Authentication',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.created('Patient account created successfully', authResponse);
        }
        catch (error) {
            console.error('Registration error:', error);
            return response_util_1.ResponseUtil.serverError('Registration failed due to a server error');
        }
    }
    async registerStaff(data) {
        try {
            const users = this.loadUsers();
            const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
            if (existing) {
                return response_util_1.ResponseUtil.error('Email is already registered');
            }
            const newUser = {
                id: id_generator_util_1.IdGenerator.generateUserId(),
                name: data.fullName,
                email: data.email,
                role: data.role,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: this.hashPassword(data.password),
                phone: data.phone,
                hospitalId: data.hospitalId,
                dept: data.dept,
            };
            users.push(newUser);
            this.saveUsers(users);
            const session = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
                loginTime: new Date().toISOString(),
                hospitalId: newUser.hospitalId,
            };
            this.sessions.set(newUser.id, session);
            const authResponse = {
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
            return response_util_1.ResponseUtil.created('Staff account created successfully', authResponse);
        }
        catch (error) {
            console.error('Staff registration error:', error);
            return response_util_1.ResponseUtil.serverError('Staff registration failed due to a server error');
        }
    }
    async logout(userId) {
        try {
            this.sessions.delete(userId);
            this.systemService.createActivity({
                userId: userId,
                action: 'Logout',
                details: `User logged out`,
                module: 'Authentication',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.success('Logout successful');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Logout failed due to a server error');
        }
    }
    async getCurrentUser(userId) {
        try {
            const session = this.sessions.get(userId);
            if (!session) {
                return response_util_1.ResponseUtil.error('Session not found — please log in again');
            }
            return response_util_1.ResponseUtil.success('Session retrieved successfully', session);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve session');
        }
    }
    async getActiveSessions() {
        try {
            const sessions = Array.from(this.sessions.values());
            return response_util_1.ResponseUtil.success('Active sessions retrieved', sessions);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve active sessions');
        }
    }
    async changePassword(data) {
        try {
            if (!data.userId) {
                return response_util_1.ResponseUtil.unauthorized('You must be logged in to change your password');
            }
            if (!data.currentPassword || !data.newPassword) {
                return response_util_1.ResponseUtil.error('Both current and new password are required');
            }
            if (data.newPassword.length < 6) {
                return response_util_1.ResponseUtil.error('New password must be at least 6 characters long');
            }
            if (data.currentPassword === data.newPassword) {
                return response_util_1.ResponseUtil.error('New password must be different from current password');
            }
            const users = this.loadUsers();
            const userIndex = users.findIndex(u => u.id === data.userId);
            const user = userIndex >= 0 ? users[userIndex] : null;
            if (!user) {
                return response_util_1.ResponseUtil.error('User account not found');
            }
            if (!this.verifyPassword(data.currentPassword, user.password)) {
                return response_util_1.ResponseUtil.error('Current password is incorrect');
            }
            users[userIndex].password = this.hashPassword(data.newPassword);
            this.saveUsers(users);
            this.systemService.createActivity({
                userId: user.id,
                action: 'PasswordChange',
                details: `Password changed for user ${user.name}`,
                module: 'Authentication',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.success('Password changed successfully');
        }
        catch (error) {
            console.error('Change password error:', error);
            return response_util_1.ResponseUtil.serverError('Failed to change password');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [system_service_1.SystemService,
        patients_service_1.PatientsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map