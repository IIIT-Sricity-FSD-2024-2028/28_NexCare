"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalsModule = void 0;
const common_1 = require("@nestjs/common");
const hospitals_controller_1 = require("./hospitals.controller");
const hospital_details_controller_1 = require("./hospital-details.controller");
const hospitals_service_1 = require("./hospitals.service");
const hospital_query_interceptor_1 = require("./interceptors/hospital-query.interceptor");
const lodger_middleware_1 = require("../lodger.middleware");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
const beds_module_1 = require("../beds/beds.module");
const inventory_module_1 = require("../inventory/inventory.module");
const ambulance_module_1 = require("../ambulance/ambulance.module");
let HospitalsModule = class HospitalsModule {
    configure(consumer) {
        consumer
            .apply(lodger_middleware_1.HospitalAccessMiddleware)
            .forRoutes({ path: 'hospitals/:id', method: common_1.RequestMethod.GET }, { path: 'hospitals/:id', method: common_1.RequestMethod.PUT }, { path: 'hospitals/:id/verify', method: common_1.RequestMethod.PATCH }, { path: 'hospitals/:id/reject', method: common_1.RequestMethod.PATCH }, { path: 'hospitals/:id/assign-manager', method: common_1.RequestMethod.PATCH }, { path: 'hospitals/:id/doctors', method: common_1.RequestMethod.GET }, { path: 'hospitals/:id/beds', method: common_1.RequestMethod.GET }, { path: 'hospitals/:id/inventory', method: common_1.RequestMethod.GET }, { path: 'hospitals/:id/ambulances', method: common_1.RequestMethod.GET });
    }
};
exports.HospitalsModule = HospitalsModule;
exports.HospitalsModule = HospitalsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, (0, common_1.forwardRef)(() => users_module_1.UsersModule), beds_module_1.BedsModule, inventory_module_1.InventoryModule, ambulance_module_1.AmbulanceModule],
        controllers: [hospitals_controller_1.HospitalsController, hospital_details_controller_1.HospitalDetailsController],
        providers: [hospitals_service_1.HospitalsService, hospital_query_interceptor_1.HospitalQueryInterceptor, lodger_middleware_1.HospitalAccessMiddleware],
        exports: [hospitals_service_1.HospitalsService]
    })
], HospitalsModule);
//# sourceMappingURL=hospitals.module.js.map