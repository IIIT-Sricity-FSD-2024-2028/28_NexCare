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
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
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
            const user = users.find((u) => u.email.toLowerCase() === loginRequest.email.toLowerCase());
            if (!user) {
                return response_util_1.ResponseUtil.error('Authentication Failed: Email address not found');
            }
            if (user.password !== loginRequest.password) {
                return response_util_1.ResponseUtil.error('Authentication Failed: Incorrect password');
            }
            if (user.role !== loginRequest.role) {
                return response_util_1.ResponseUtil.error(`Access Denied: Account is registered as '${user.role}', not '${loginRequest.role}'`);
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
                password: registerRequest.password,
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [system_service_1.SystemService,
        patients_service_1.PatientsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map