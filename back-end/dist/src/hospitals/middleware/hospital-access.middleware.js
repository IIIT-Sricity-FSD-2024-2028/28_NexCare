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
var HospitalAccessMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalAccessMiddleware = void 0;
const common_1 = require("@nestjs/common");
const hospitals_service_1 = require("../hospitals.service");
const users_service_1 = require("../../users/users.service");
const auth_service_1 = require("../../auth/auth.service");
const api_response_interface_1 = require("../../common/interfaces/api-response.interface");
let HospitalAccessMiddleware = HospitalAccessMiddleware_1 = class HospitalAccessMiddleware {
    constructor(hospitalsService, usersService, authService) {
        this.hospitalsService = hospitalsService;
        this.usersService = usersService;
        this.authService = authService;
        this.logger = new common_1.Logger(HospitalAccessMiddleware_1.name);
    }
    async use(req, res, next) {
        const hospitalId = req.params?.id;
        if (!hospitalId || hospitalId === 'nearby' || hospitalId === 'register') {
            return next();
        }
        const user = this.resolveUser(req);
        if (!user) {
            return next();
        }
        if (user.role === api_response_interface_1.UserRole.SUPERUSER) {
            return next();
        }
        const isVerificationAction = req.path?.includes('/verify') || req.path?.includes('/reject');
        if (user.role === api_response_interface_1.UserRole.REGIONAL_MANAGER && isVerificationAction) {
            return next();
        }
        const hospitalResult = await this.hospitalsService.findById(hospitalId);
        const hospital = hospitalResult?.data;
        if (!hospital) {
            return next();
        }
        if (user.role === api_response_interface_1.UserRole.REGIONAL_MANAGER) {
            if (hospital.assignedManagerId !== user.id) {
                this.logUnauthorized(user, hospitalId);
                throw new common_1.ForbiddenException('You are not assigned to this hospital');
            }
            return next();
        }
        if (user.role === api_response_interface_1.UserRole.HOSPITAL_MANAGER) {
            const userHospitalId = await this.resolveUserHospitalId(user.id);
            if (userHospitalId !== hospitalId) {
                this.logUnauthorized(user, hospitalId);
                throw new common_1.ForbiddenException('You are not assigned to this hospital');
            }
            return next();
        }
        return next();
    }
    resolveUser(req) {
        const attached = req.user;
        if (attached?.id && attached?.role) {
            return attached;
        }
        const authHeader = req.headers?.authorization ?? '';
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            return null;
        }
        const payload = this.authService.verifyToken(token);
        if (!payload) {
            return null;
        }
        return {
            id: payload.sub,
            role: payload.role,
        };
    }
    async resolveUserHospitalId(userId) {
        const result = await this.usersService.findById(userId);
        return result?.data?.hospitalId;
    }
    logUnauthorized(user, hospitalId) {
        this.logger.warn(`Unauthorized hospital access attempt: userId=${user.id} role=${user.role} hospitalId=${hospitalId} at ${new Date().toISOString()}`);
    }
};
exports.HospitalAccessMiddleware = HospitalAccessMiddleware;
exports.HospitalAccessMiddleware = HospitalAccessMiddleware = HospitalAccessMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hospitals_service_1.HospitalsService,
        users_service_1.UsersService,
        auth_service_1.AuthService])
], HospitalAccessMiddleware);
//# sourceMappingURL=hospital-access.middleware.js.map