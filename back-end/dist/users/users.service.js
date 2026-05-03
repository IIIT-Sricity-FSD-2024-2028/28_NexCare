"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const array_util_1 = require("../common/utils/array.util");
const sanitizer_util_1 = require("../common/utils/sanitizer.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let UsersService = class UsersService {
    constructor() {
        this.users = [
            {
                id: 'U001',
                name: 'System Administrator',
                email: 'superuser@nexcare.com',
                role: api_response_interface_1.UserRole.SUPERUSER,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'U002',
                name: 'Jane Doe (Desk)',
                email: 'admin@nexcare.com',
                role: api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'U003',
                name: 'Alex Martinez',
                email: 'ambulance@nexcare.com',
                role: api_response_interface_1.UserRole.AMBULANCE,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'U004',
                name: 'John Anderson',
                email: 'patient@gmail.com',
                role: api_response_interface_1.UserRole.PATIENT,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                patientId: 'P001',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'U005',
                name: 'Dr. Sarah Smith',
                email: 'sarah.smith@nexcare.com',
                role: api_response_interface_1.UserRole.DOCTOR,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                dept: 'Cardiology',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'U006',
                name: 'Dr. Vikram Patel',
                email: 'vikram.patel@nexcare.com',
                role: api_response_interface_1.UserRole.DOCTOR,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                dept: 'Orthopedics',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'U007',
                name: 'Dr. Anjali Desai',
                email: 'anjali.desai@nexcare.com',
                role: api_response_interface_1.UserRole.DOCTOR,
                status: api_response_interface_1.UserStatus.ON_LEAVE,
                password: 'Password123',
                dept: 'General Medicine',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'U008',
                name: 'Nurse Emily Davis',
                email: 'emily.davis@nexcare.com',
                role: api_response_interface_1.UserRole.NURSE,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                dept: 'ER',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'U009',
                name: 'Maria Garcia',
                email: 'maria@example.com',
                role: api_response_interface_1.UserRole.PATIENT,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: 'Password123',
                patientId: 'P002',
                createdAt: '2024-01-01T00:00:00Z'
            }
        ];
    }
    async findAll(role, status) {
        try {
            let filteredUsers = [...this.users];
            if (role) {
                filteredUsers = filteredUsers.filter(user => user.role === role);
            }
            if (status) {
                filteredUsers = filteredUsers.filter(user => user.status === status);
            }
            const usersWithoutPassword = filteredUsers.map(({ password, ...user }) => user);
            return response_util_1.ResponseUtil.success('Users retrieved successfully', usersWithoutPassword);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve users');
        }
    }
    async findById(id) {
        try {
            const user = array_util_1.ArrayUtil.findById(this.users, id);
            if (!user) {
                return response_util_1.ResponseUtil.notFound('User', id);
            }
            const userWithoutPassword = sanitizer_util_1.DataSanitizer.removePassword(user);
            return response_util_1.ResponseUtil.success('User retrieved successfully', userWithoutPassword);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve user');
        }
    }
    async create(userData) {
        try {
            const existingUser = array_util_1.ArrayUtil.searchByText(this.users, userData.email, ['email']);
            if (existingUser.length > 0) {
                return response_util_1.ResponseUtil.error('Email already exists');
            }
            const newUserId = id_generator_util_1.IdGenerator.generateUserId();
            const newUser = {
                id: newUserId,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                status: api_response_interface_1.UserStatus.ACTIVE,
                password: userData.password,
                patientId: userData.patientId,
                dept: userData.dept,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.users.push(newUser);
            const userWithoutPassword = sanitizer_util_1.DataSanitizer.removePassword(newUser);
            return response_util_1.ResponseUtil.created('User created successfully', userWithoutPassword);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create user');
        }
    }
    async update(id, updateData) {
        try {
            const userIndex = array_util_1.ArrayUtil.findIndexById(this.users, id);
            if (userIndex === -1) {
                return response_util_1.ResponseUtil.notFound('User', id);
            }
            if (updateData.email) {
                const allUsersWithEmail = array_util_1.ArrayUtil.searchByText(this.users, updateData.email, ['email']);
                const existingUser = allUsersWithEmail.find(u => u.id !== id);
                if (existingUser) {
                    return response_util_1.ResponseUtil.error('Email already exists');
                }
            }
            const updatedUser = array_util_1.ArrayUtil.updateById(this.users, id, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            if (!updatedUser) {
                return response_util_1.ResponseUtil.notFound('User', id);
            }
            const userWithoutPassword = sanitizer_util_1.DataSanitizer.removePassword(updatedUser);
            return response_util_1.ResponseUtil.updated('User updated successfully', userWithoutPassword);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update user');
        }
    }
    async delete(id) {
        try {
            const user = array_util_1.ArrayUtil.findById(this.users, id);
            if (!user) {
                return response_util_1.ResponseUtil.notFound('User', id);
            }
            if (user.role === api_response_interface_1.UserRole.SUPERUSER) {
                return response_util_1.ResponseUtil.error('Cannot delete superuser account');
            }
            array_util_1.ArrayUtil.removeById(this.users, id);
            return response_util_1.ResponseUtil.deleted('User');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete user');
        }
    }
    async getStats() {
        try {
            const stats = {
                total: this.users.length,
                active: this.users.filter(u => u.status === api_response_interface_1.UserStatus.ACTIVE).length,
                inactive: this.users.filter(u => u.status === api_response_interface_1.UserStatus.INACTIVE).length,
                onLeave: this.users.filter(u => u.status === api_response_interface_1.UserStatus.ON_LEAVE).length,
                byRole: {}
            };
            Object.values(api_response_interface_1.UserRole).forEach(role => {
                stats.byRole[role] = this.users.filter(u => u.role === role).length;
            });
            return response_util_1.ResponseUtil.success('User statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve user statistics');
        }
    }
    async findByRole(role) {
        try {
            const users = array_util_1.ArrayUtil.filterByProperty(this.users, 'role', role);
            const usersWithoutPassword = sanitizer_util_1.DataSanitizer.removePasswords(users);
            return response_util_1.ResponseUtil.success(`Users with role '${role}' retrieved successfully`, usersWithoutPassword);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve users by role');
        }
    }
    async updateStatus(id, status) {
        try {
            const user = array_util_1.ArrayUtil.findById(this.users, id);
            if (!user) {
                return response_util_1.ResponseUtil.notFound('User', id);
            }
            const updatedUser = array_util_1.ArrayUtil.updateById(this.users, id, {
                status,
                updatedAt: new Date().toISOString()
            });
            if (!updatedUser) {
                return response_util_1.ResponseUtil.notFound('User', id);
            }
            const userWithoutPassword = sanitizer_util_1.DataSanitizer.removePassword(updatedUser);
            return response_util_1.ResponseUtil.updated('User status updated successfully', userWithoutPassword);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update user status');
        }
    }
    async search(query) {
        try {
            const matchingUsers = array_util_1.ArrayUtil.searchByText(this.users, query, ['name', 'email']);
            const usersWithoutPassword = sanitizer_util_1.DataSanitizer.removePasswords(matchingUsers);
            return response_util_1.ResponseUtil.success('Search results retrieved successfully', usersWithoutPassword);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to search users');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map