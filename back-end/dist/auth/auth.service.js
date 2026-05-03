"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const array_util_1 = require("../common/utils/array.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let AuthService = class AuthService {
    constructor() {
        this.users = [
            {
                id: 'U001',
                name: 'System Administrator',
                email: 'superuser@nexcare.com',
                role: api_response_interface_1.UserRole.SUPERUSER,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123'
            },
            {
                id: 'U002',
                name: 'Jane Doe (Desk)',
                email: 'admin@nexcare.com',
                role: api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123'
            },
            {
                id: 'U003',
                name: 'Alex Martinez',
                email: 'ambulance@nexcare.com',
                role: api_response_interface_1.UserRole.AMBULANCE,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123'
            },
            {
                id: 'U004',
                name: 'John Anderson',
                email: 'patient@gmail.com',
                role: api_response_interface_1.UserRole.PATIENT,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                patientId: 'P001'
            },
            {
                id: 'U005',
                name: 'Dr. Sarah Smith',
                email: 'sarah.smith@nexcare.com',
                role: api_response_interface_1.UserRole.DOCTOR,
                dept: 'Cardiology',
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123'
            },
            {
                id: 'U006',
                name: 'Dr. Vikram Patel',
                email: 'vikram.patel@nexcare.com',
                role: api_response_interface_1.UserRole.DOCTOR,
                dept: 'Orthopedics',
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123'
            },
            {
                id: 'U007',
                name: 'Dr. Anjali Desai',
                email: 'anjali.desai@nexcare.com',
                role: api_response_interface_1.UserRole.DOCTOR,
                dept: 'General Medicine',
                status: api_response_interface_1.UserStatus.ON_LEAVE,
                password: 'Password123'
            },
            {
                id: 'U008',
                name: 'Nurse Emily Davis',
                email: 'emily.davis@nexcare.com',
                role: api_response_interface_1.UserRole.NURSE,
                dept: 'ER',
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123'
            },
            {
                id: 'U009',
                name: 'Maria Garcia',
                email: 'maria@example.com',
                role: api_response_interface_1.UserRole.PATIENT,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                patientId: 'P002'
            }
        ];
        this.sessions = new Map();
    }
    async login(loginRequest) {
        try {
            const users = array_util_1.ArrayUtil.searchByText(this.users, loginRequest.email, ['email']);
            const user = users.length > 0 ? users[0] : null;
            if (!user) {
                return response_util_1.ResponseUtil.error('Authentication Failed: Email address not found');
            }
            if (user.password !== loginRequest.password) {
                return response_util_1.ResponseUtil.error('Authentication Failed: Incorrect password');
            }
            if (user.role !== loginRequest.role) {
                return response_util_1.ResponseUtil.error(`Access Denied: User exists but is not registered as '${loginRequest.role}'. (Registered as: ${user.role})`);
            }
            if (user.status === api_response_interface_1.UserStatus.INACTIVE) {
                return response_util_1.ResponseUtil.error('Account is inactive. Please contact administrator.');
            }
            const session = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                loginTime: new Date().toISOString()
            };
            this.sessions.set(user.id, session);
            const authResponse = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status
                },
                token: this.generateToken(user)
            };
            return response_util_1.ResponseUtil.success('Login successful', authResponse);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Login failed due to server error');
        }
    }
    async register(registerRequest) {
        try {
            const existingUser = array_util_1.ArrayUtil.searchByText(this.users, registerRequest.email, ['email']);
            if (existingUser.length > 0) {
                return response_util_1.ResponseUtil.error('Email already registered');
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
                patientId: newPatientId
            };
            this.users.push(newUser);
            const session = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
                loginTime: new Date().toISOString()
            };
            this.sessions.set(newUser.id, session);
            const authResponse = {
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    status: newUser.status
                },
                token: this.generateToken(newUser)
            };
            return response_util_1.ResponseUtil.created('Patient account created successfully', authResponse);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Registration failed due to server error');
        }
    }
    async logout(userId) {
        try {
            this.sessions.delete(userId);
            return response_util_1.ResponseUtil.success('Logout successful');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Logout failed due to server error');
        }
    }
    async getCurrentUser(userId) {
        try {
            const session = this.sessions.get(userId);
            if (!session) {
                return response_util_1.ResponseUtil.error('Session not found');
            }
            return response_util_1.ResponseUtil.success('Session retrieved successfully', session);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve session');
        }
    }
    generateToken(user) {
        return `token_${user.id}_${Date.now()}`;
    }
    async validateToken(token) {
        try {
            if (token.startsWith('token_')) {
                const parts = token.split('_');
                const userId = parts[1];
                return this.sessions.get(userId) || null;
            }
            return null;
        }
        catch (error) {
            return null;
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
    (0, common_1.Injectable)()
], AuthService);
//# sourceMappingURL=auth.service.js.map