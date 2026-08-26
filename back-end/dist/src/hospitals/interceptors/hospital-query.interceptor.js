"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HospitalQueryInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalQueryInterceptor = void 0;
const common_1 = require("@nestjs/common");
let HospitalQueryInterceptor = HospitalQueryInterceptor_1 = class HospitalQueryInterceptor {
    constructor() {
        this.logger = new common_1.Logger(HospitalQueryInterceptor_1.name);
    }
    intercept(context, next) {
        const httpCtx = context.switchToHttp();
        const request = httpCtx.getRequest();
        const response = httpCtx.getResponse();
        const timestamp = new Date().toISOString();
        if (request && request.query) {
            const { speciality, city, pincode } = request.query;
            if (typeof speciality === 'string') {
                request.query.speciality = speciality.trim().toLowerCase();
            }
            if (typeof city === 'string') {
                request.query.city = city.trim().toLowerCase();
            }
            if (typeof pincode === 'string') {
                request.query.pincode = pincode.trim();
            }
            this.logger.log(`Sanitized query [Timestamp: ${timestamp}]: speciality="${request.query.speciality ?? ''}", city="${request.query.city ?? ''}", pincode="${request.query.pincode ?? ''}"`);
        }
        if (response && typeof response.setHeader === 'function') {
            response.setHeader('x-query-timestamp', timestamp);
        }
        return next.handle();
    }
};
exports.HospitalQueryInterceptor = HospitalQueryInterceptor;
exports.HospitalQueryInterceptor = HospitalQueryInterceptor = HospitalQueryInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], HospitalQueryInterceptor);
//# sourceMappingURL=hospital-query.interceptor.js.map