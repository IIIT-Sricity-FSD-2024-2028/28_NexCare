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
const system_module_1 = require("./system/system.module");
const hospitals_module_1 = require("./hospitals/hospitals.module");
const departments_module_1 = require("./departments/departments.module");
const wards_module_1 = require("./wards/wards.module");
const equipment_module_1 = require("./equipment/equipment.module");
const support_requests_module_1 = require("./support-requests/support-requests.module");
const auth_guard_1 = require("./common/guards/auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
let AppModule = class AppModule {
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
            system_module_1.SystemModule,
            hospitals_module_1.HospitalsModule,
            departments_module_1.DepartmentsModule,
            wards_module_1.WardsModule,
            equipment_module_1.EquipmentModule,
            support_requests_module_1.SupportRequestsModule,
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