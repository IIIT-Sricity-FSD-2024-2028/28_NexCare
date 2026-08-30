import { Module, MiddlewareConsumer, RequestMethod, forwardRef } from '@nestjs/common';
import { AmbulanceController } from './ambulance.controller';
import { AmbulanceService } from './ambulance.service';
import { SystemModule } from '../system/system.module';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { AmbulanceAccessMiddleware } from './middleware/ambulance-access.middleware';

/**
 * Ambulance Module
 * Manages emergency services and ambulance requests in the NexCare system
 * Provides CRUD operations and ambulance status management functionality
 */
@Module({
  imports: [SystemModule, PatientsModule, forwardRef(() => UsersModule), forwardRef(() => AuthModule), BillingModule],
  controllers: [AmbulanceController],
  providers: [AmbulanceService, AmbulanceAccessMiddleware],
  exports: [AmbulanceService],
})
export class AmbulanceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AmbulanceAccessMiddleware)
      .forRoutes(
        { path: 'ambulance', method: RequestMethod.GET },
        { path: 'ambulance/:id', method: RequestMethod.GET },
        { path: 'ambulance', method: RequestMethod.POST },
        { path: 'ambulance/:id', method: RequestMethod.PUT },
        { path: 'ambulance/:id', method: RequestMethod.PATCH },
        { path: 'ambulance/:id', method: RequestMethod.DELETE },
        { path: 'ambulance/stats/overview', method: RequestMethod.GET },
        { path: 'ambulance/patient/:patientId', method: RequestMethod.GET },
        { path: 'ambulance/active', method: RequestMethod.GET },
        { path: 'ambulance/assigned/:assignedTo', method: RequestMethod.GET },
      );
  }
}
