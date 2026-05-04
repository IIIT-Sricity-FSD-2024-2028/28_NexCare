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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_service_1 = require("../../auth/auth.service");
const public_decorator_1 = require("../decorators/public.decorator");
let AuthGuard = class AuthGuard {
    constructor(reflector, authService) {
        this.reflector = reflector;
        this.authService = authService;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new common_1.UnauthorizedException('No authentication token provided. Please log in.');
        }
        const payload = this.authService.verifyToken(token);
        if (!payload) {
            throw new common_1.UnauthorizedException('Invalid or expired token. Please log in again.');
        }
        request.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        return true;
    }
    extractTokenFromHeader(request) {
        const authHeader = request.headers?.authorization ?? '';
        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        auth_service_1.AuthService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map