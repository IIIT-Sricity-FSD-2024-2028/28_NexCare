import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { BillingModule } from './billing/billing.module';
import { AmbulanceModule } from './ambulance/ambulance.module';
import { FeedbackModule } from './feedback/feedback.module';
import { BedsModule } from './beds/beds.module';
import { InventoryModule } from './inventory/inventory.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { SystemModule } from './system/system.module';
import { DepartmentsModule } from './departments/departments.module';
import { WardsModule } from './wards/wards.module';
import { EquipmentModule } from './equipment/equipment.module';
import { SupportRequestsModule } from './support-requests/support-requests.module';
import { LeavesModule } from './leaves/leaves.module';
import { SchedulesModule } from './schedules/schedules.module';
import { UploadsModule } from './uploads/uploads.module';
import { RevenueModule } from './revenue/revenue.module';
import { HierarchyModule } from './hierarchy/hierarchy.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoggingModule } from './common/logging/logging.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestLoggerMiddleware, SecurityMiddleware, CsrfMiddleware } from './lodger.middleware';

/**
 * Main Application Module
 * Root module that imports and configures all feature modules.
 *
 * Guards are registered globally here via APP_GUARD so they apply to
 * every route without needing @UseGuards() on each controller.
 * Routes can opt out of auth with the @Public() decorator.
 *
 * Application-level middleware is registered in configure() and runs on every
 * request, before the guards:
 *   SecurityMiddleware      — security headers, rate limiting, payload limits
 *   RequestLoggerMiddleware — request id + access/error logging to file
 
 *
 * Router-level middleware lives with the feature it belongs to:
 *   BedStatusChangeMiddleware — beds module, status-changing routes
 *   FileUploadMiddleware      — uploads module, POST /uploads
 */
@Module({
  imports: [
    AuthModule,      // AuthService is exported from here and injected into AuthGuard
    UsersModule,
    PatientsModule,
    AppointmentsModule,
    BillingModule,
    AmbulanceModule,
    FeedbackModule,
    BedsModule,
    InventoryModule,
    HospitalsModule,
    SystemModule,
    DepartmentsModule,
    WardsModule,
    EquipmentModule,
    SupportRequestsModule,
    LeavesModule,
    SchedulesModule,
    UploadsModule,
    LoggingModule,
    RevenueModule,
    HierarchyModule,
    PaymentsModule,
    NotificationsModule,
  ],
  providers: [
    // AuthGuard runs first — validates the JWT and populates request.user
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // RolesGuard runs second — checks request.user.role against @Roles() metadata
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Order matters: reject abusive or oversized traffic before logging it,
    // then log everything that survives, then apply CSRF protection.
    //
    // CsrfMiddleware was unwired on 2026-08-30 because it was answering 403 to
    // every request, including POST /auth/login — nobody could sign in. That
    // was a bug in the middleware, not a reason to drop the protection: it now
    // exempts pre-session auth routes and Bearer-authenticated writes (which
    // are structurally immune, since a browser never attaches an Authorization
    // header on its own) and challenges only unauthenticated state-changing
    // requests. See the class comment in lodger.middleware.ts.
    consumer.apply(SecurityMiddleware, RequestLoggerMiddleware, CsrfMiddleware).forRoutes('*');
  }
}
