import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { BedsController } from './beds.controller';
import { BedsService } from './beds.service';
import { BedStatusChangeMiddleware } from '../lodger.middleware';
import { AuthModule } from '../auth/auth.module';

/**
 * Beds Module
 * Manages hospital bed allocation and ward management in the NexCare system
 * Provides CRUD operations and bed management functionality
 *
 * Registers BedStatusChangeMiddleware on every route that can change a bed's
 * status, so illegal transitions are rejected before the controller runs.
 */
@Module({
  imports: [AuthModule], // AuthService — lets the middleware attribute changes to a user
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BedStatusChangeMiddleware)
      .forRoutes(
        { path: 'beds/:id/status', method: RequestMethod.PATCH },
        { path: 'beds/:id/allocate', method: RequestMethod.PATCH },
        { path: 'beds/:id/release', method: RequestMethod.PATCH },
        // Generic updates can carry a status too — guard them as well
        { path: 'beds/:id', method: RequestMethod.PUT },
        { path: 'beds/:id', method: RequestMethod.PATCH },
      );
  }
}
