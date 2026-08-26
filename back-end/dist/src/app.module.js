"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const patients_module_1 = require("./patients/patients.module");
const appointments_module_1 = require("./appointments/appointments.module");
const billing_module_1 = require("./billing/billing.module");
const ambulance_module_1 = require("./ambulance/ambulance.module");
const feedback_module_1 = require("./feedback/feedback.module");
const beds_module_1 = require("./beds/beds.module");
const inventory_module_1 = require("./inventory/inventory.module");
const hospitals_module_1 = require("./hospitals/hospitals.module");
const system_module_1 = require("./system/system.module");
const leaves_module_1 = require("./leaves/leaves.module");
const uploads_module_1 = require("./uploads/uploads.module");
const logging_module_1 = require("./common/logging/logging.module");
const auth_guard_1 = require("./common/guards/auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const request_logger_middleware_1 = require("./common/middleware/request-logger.middleware");
const security_middleware_1 = require("./common/middleware/security.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(security_middleware_1.SecurityMiddleware, request_logger_middleware_1.RequestLoggerMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            patients_module_1.PatientsModule,
            appointments_module_1.AppointmentsModule,
            billing_module_1.BillingModule,
            ambulance_module_1.AmbulanceModule,
            feedback_module_1.FeedbackModule,
            beds_module_1.BedsModule,
            inventory_module_1.InventoryModule,
            hospitals_module_1.HospitalsModule,
            system_module_1.SystemModule,
            leaves_module_1.LeavesModule,
            uploads_module_1.UploadsModule,
            logging_module_1.LoggingModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.AuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map