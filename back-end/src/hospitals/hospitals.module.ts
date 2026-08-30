import { Module, NestModule, MiddlewareConsumer, RequestMethod, forwardRef } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalDetailsController } from './hospital-details.controller';
import { HospitalsService } from './hospitals.service';
import { HospitalQueryInterceptor } from './interceptors/hospital-query.interceptor';
import { HospitalAccessMiddleware } from './middleware/hospital-access.middleware';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { BedsModule } from '../beds/beds.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AmbulanceModule } from '../ambulance/ambulance.module';

@Module({
  // forwardRef on UsersModule: it imports HospitalsModule back, to scope /users
  // to a regional officer's own hospitals.
  imports: [AuthModule, forwardRef(() => UsersModule), BedsModule, InventoryModule, AmbulanceModule],
  controllers: [HospitalsController, HospitalDetailsController],
  providers: [HospitalsService, HospitalQueryInterceptor, HospitalAccessMiddleware],
  exports: [HospitalsService]
})
export class HospitalsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HospitalAccessMiddleware)
      .forRoutes(
        { path: 'hospitals/:id', method: RequestMethod.GET },
        { path: 'hospitals/:id', method: RequestMethod.PUT },
        { path: 'hospitals/:id/verify', method: RequestMethod.PATCH },
        { path: 'hospitals/:id/reject', method: RequestMethod.PATCH },
        { path: 'hospitals/:id/regional-review', method: RequestMethod.PATCH },
        { path: 'hospitals/:id/assign-manager', method: RequestMethod.PATCH },
        { path: 'hospitals/:id/doctors', method: RequestMethod.GET },
        { path: 'hospitals/:id/beds', method: RequestMethod.GET },
        { path: 'hospitals/:id/inventory', method: RequestMethod.GET },
        { path: 'hospitals/:id/ambulances', method: RequestMethod.GET },
      );
  }
}
