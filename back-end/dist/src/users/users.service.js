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
const fs = require("fs");
const path = require("path");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const array_util_1 = require("../common/utils/array.util");
const sanitizer_util_1 = require("../common/utils/sanitizer.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let UsersService = class UsersService {
    constructor() {
        this.usersFilePath = path.join(process.cwd(), 'data', 'users.json');
        this.hospitalsFilePath = path.join(process.cwd(), 'data', 'hospitals.json');
    }
    get users() {
        try {
            const raw = fs.readFileSync(this.usersFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    set users(val) {
        try {
            fs.mkdirSync(path.dirname(this.usersFilePath), { recursive: true });
            fs.writeFileSync(this.usersFilePath, JSON.stringify(val, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist users to disk:', err);
        }
    }
    get hospitals() {
        try {
            const raw = fs.readFileSync(this.hospitalsFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
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
                hospitalId: userData.hospitalId,
                city: userData.city,
                state: userData.state,
                pincode: userData.pincode,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const currentUsers = this.users;
            currentUsers.push(newUser);
            this.users = currentUsers;
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
            const currentUsers = this.users;
            const updatedUser = array_util_1.ArrayUtil.updateById(currentUsers, id, {
                ...updateData,
                hospitalId: updateData.hospitalId,
                city: updateData.city,
                state: updateData.state,
                pincode: updateData.pincode,
                updatedAt: new Date().toISOString()
            });
            this.users = currentUsers;
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
            const currentUsers = this.users;
            array_util_1.ArrayUtil.removeById(currentUsers, id);
            this.users = currentUsers;
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
            const currentUsers = this.users;
            const updatedUser = array_util_1.ArrayUtil.updateById(currentUsers, id, {
                status,
                updatedAt: new Date().toISOString()
            });
            this.users = currentUsers;
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
    async getRegionalManagersByCity(city) {
        try {
            const regionalManagers = this.users.filter(user => user.role === api_response_interface_1.UserRole.REGIONAL_MANAGER &&
                user.city &&
                user.city.toLowerCase() === city.toLowerCase());
            const rmsWithoutPassword = sanitizer_util_1.DataSanitizer.removePasswords(regionalManagers);
            return response_util_1.ResponseUtil.success(`Regional managers for city '${city}' retrieved successfully`, rmsWithoutPassword);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve regional managers by city');
        }
    }
    async getRMWorkload(managerId) {
        try {
            const rm = array_util_1.ArrayUtil.findById(this.users, managerId);
            if (!rm || rm.role !== api_response_interface_1.UserRole.REGIONAL_MANAGER) {
                throw new Error('Regional manager not found');
            }
            const hospitals = this.hospitals;
            const assignedHospitals = hospitals.filter(h => h.assignedManagerId === managerId);
            const pendingVerifications = assignedHospitals.filter(h => h.verificationStatus === api_response_interface_1.VerificationStatus.PENDING_VERIFICATION).length;
            const verifiedHospitals = assignedHospitals.filter(h => h.verificationStatus === api_response_interface_1.VerificationStatus.VERIFIED).length;
            const rejectedHospitals = assignedHospitals.filter(h => h.verificationStatus === api_response_interface_1.VerificationStatus.REJECTED).length;
            const activeHospitals = verifiedHospitals;
            const totalHospitals = assignedHospitals.length;
            let workloadLevel = 'low';
            if (totalHospitals > 15)
                workloadLevel = 'high';
            else if (totalHospitals > 8)
                workloadLevel = 'medium';
            const workload = {
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
        }
        catch (error) {
            throw new Error('Failed to get RM workload');
        }
    }
    async suggestRMForHospital(hospitalCity) {
        try {
            const regionalManagers = this.users.filter(user => user.role === api_response_interface_1.UserRole.REGIONAL_MANAGER);
            if (regionalManagers.length === 0) {
                return [];
            }
            const suggestions = [];
            for (const rm of regionalManagers) {
                const workload = await this.getRMWorkload(rm.id);
                const cityMatch = rm.city && rm.city.toLowerCase() === hospitalCity.toLowerCase();
                let recommendation = 'available';
                let reason = 'No current workload';
                if (workload.workloadLevel === 'high') {
                    recommendation = 'not_recommended';
                    reason = 'High current workload';
                }
                else if (workload.workloadLevel === 'medium') {
                    recommendation = 'acceptable';
                    reason = 'Moderate workload, still available';
                }
                if (cityMatch) {
                    reason += ', assigned to this city';
                }
                else {
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
            suggestions.sort((a, b) => {
                const aCityMatch = a.city.toLowerCase() === hospitalCity.toLowerCase();
                const bCityMatch = b.city.toLowerCase() === hospitalCity.toLowerCase();
                if (aCityMatch && !bCityMatch)
                    return -1;
                if (!aCityMatch && bCityMatch)
                    return 1;
                if (a.currentWorkload !== b.currentWorkload) {
                    return a.currentWorkload - b.currentWorkload;
                }
                return 0;
            });
            return suggestions;
        }
        catch (error) {
            throw new Error('Failed to suggest regional manager');
        }
    }
    async getAllRMWorkloads() {
        try {
            const regionalManagers = this.users.filter(user => user.role === api_response_interface_1.UserRole.REGIONAL_MANAGER);
            const workloads = [];
            for (const rm of regionalManagers) {
                try {
                    const workload = await this.getRMWorkload(rm.id);
                    workloads.push(workload);
                }
                catch (error) {
                    console.error(`Failed to get workload for RM ${rm.id}:`, error);
                }
            }
            return workloads;
        }
        catch (error) {
            throw new Error('Failed to get all RM workloads');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map