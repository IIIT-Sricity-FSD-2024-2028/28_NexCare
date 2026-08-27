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
exports.BedStatusChangeMiddleware = void 0;
const common_1 = require("@nestjs/common");
const beds_service_1 = require("../beds.service");
const auth_service_1 = require("../../auth/auth.service");
const api_response_interface_1 = require("../../common/interfaces/api-response.interface");
const ALLOWED_TRANSITIONS = {
    [api_response_interface_1.BedStatus.AVAILABLE]: [api_response_interface_1.BedStatus.OCCUPIED, api_response_interface_1.BedStatus.MAINTENANCE],
    [api_response_interface_1.BedStatus.OCCUPIED]: [api_response_interface_1.BedStatus.CRITICAL, api_response_interface_1.BedStatus.AVAILABLE],
    [api_response_interface_1.BedStatus.CRITICAL]: [api_response_interface_1.BedStatus.OCCUPIED, api_response_interface_1.BedStatus.AVAILABLE],
    [api_response_interface_1.BedStatus.MAINTENANCE]: [api_response_interface_1.BedStatus.AVAILABLE],
};
const TRANSITION_HINTS = {
    'maintenance->occupied': 'Mark the bed as available once maintenance is complete, then allocate it.',
    'maintenance->critical': 'Mark the bed as available once maintenance is complete, then allocate it.',
    'occupied->maintenance': 'Release the patient from the bed before sending it for maintenance.',
    'critical->maintenance': 'Release the patient from the bed before sending it for maintenance.',
    'available->critical': 'A bed must be allocated to a patient (occupied) before it can be marked critical.',
};
let BedStatusChangeMiddleware = class BedStatusChangeMiddleware {
    constructor(bedsService, authService) {
        this.bedsService = bedsService;
        this.authService = authService;
        this.logger = new common_1.Logger('BedStatusChange');
    }
    use(req, res, next) {
        const bedId = this.extractBedId(req);
        const action = this.extractAction(req);
        const actor = this.resolveActor(req);
        if (!bedId) {
            return next();
        }
        const bed = this.bedsService.getBedById(bedId);
        if (!bed) {
            return next();
        }
        const currentStatus = bed.status;
        const requestedStatus = this.resolveRequestedStatus(req, action);
        if (requestedStatus === undefined) {
            return next();
        }
        if (requestedStatus === null) {
            const supplied = (req.body ?? {}).status;
            this.logger.warn(`REJECTED bed=${bedId} action=${action} user=${actor.label} — unknown status "${supplied}"`);
            return this.reject(res, req, `"${supplied}" is not a valid bed status. Valid statuses: ${Object.values(api_response_interface_1.BedStatus).join(', ')}.`);
        }
        if (requestedStatus === currentStatus) {
            this.logger.log(`NO-OP bed=${bedId} already ${currentStatus} action=${action} user=${actor.label}`);
            return next();
        }
        const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
        if (!allowed.includes(requestedStatus)) {
            const hint = TRANSITION_HINTS[`${currentStatus}->${requestedStatus}`];
            this.logger.warn(`REJECTED bed=${bedId} ${currentStatus} -> ${requestedStatus} action=${action} ` +
                `user=${actor.label} at=${new Date().toISOString()}`);
            return this.reject(res, req, `Illegal bed status transition: ${currentStatus} -> ${requestedStatus}.` +
                (hint ? ` ${hint}` : '') +
                ` Allowed from ${currentStatus}: ${allowed.join(', ') || 'none'}.`);
        }
        this.logger.log(`bed=${bedId} ${currentStatus} -> ${requestedStatus} action=${action} ` +
            `user=${actor.label} at=${new Date().toISOString()}`);
        req.bedStatusChange = {
            bedId,
            action,
            from: currentStatus,
            to: requestedStatus,
            userId: actor.id,
            timestamp: new Date().toISOString(),
        };
        next();
    }
    extractBedId(req) {
        const fromParams = req.params?.id;
        if (fromParams)
            return fromParams;
        const match = req.originalUrl.match(/\/beds\/([^/?#]+)/);
        return match ? decodeURIComponent(match[1]) : undefined;
    }
    extractAction(req) {
        const path = req.originalUrl.split('?')[0];
        if (path.endsWith('/status'))
            return 'status';
        if (path.endsWith('/allocate'))
            return 'allocate';
        if (path.endsWith('/release'))
            return 'release';
        return 'update';
    }
    resolveRequestedStatus(req, action) {
        if (action === 'allocate')
            return api_response_interface_1.BedStatus.OCCUPIED;
        if (action === 'release')
            return api_response_interface_1.BedStatus.AVAILABLE;
        const supplied = (req.body ?? {}).status;
        if (supplied === undefined || supplied === null || supplied === '') {
            return action === 'status' ? null : undefined;
        }
        const normalized = String(supplied).trim().toLowerCase();
        const known = Object.values(api_response_interface_1.BedStatus).find((s) => s === normalized);
        return known ?? null;
    }
    resolveActor(req) {
        const [type, token] = (req.headers.authorization ?? '').split(' ');
        if (type !== 'Bearer' || !token) {
            return { id: 'anonymous', label: 'anonymous' };
        }
        const payload = this.authService.verifyToken(token);
        if (!payload) {
            return { id: 'anonymous', label: 'anonymous (invalid token)' };
        }
        return {
            id: payload.sub,
            label: `${payload.sub} (${payload.email} / ${payload.role})`,
        };
    }
    reject(res, req, message) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message,
            error: 'BAD_REQUEST',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
        });
    }
};
exports.BedStatusChangeMiddleware = BedStatusChangeMiddleware;
exports.BedStatusChangeMiddleware = BedStatusChangeMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [beds_service_1.BedsService,
        auth_service_1.AuthService])
], BedStatusChangeMiddleware);
//# sourceMappingURL=bed-status-change.middleware.js.map