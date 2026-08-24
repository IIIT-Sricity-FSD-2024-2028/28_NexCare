import { Module } from '@nestjs/common';
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
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

/**
 * Main Application Module
 * Root module that imports and configures all feature modules.
 *
 * Guards are registered globally here via APP_GUARD so they apply to
 * every route without needing @UseGuards() on each controller.
 * Routes can opt out of auth with the @Public() decorator.
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
export class AppModule {}
