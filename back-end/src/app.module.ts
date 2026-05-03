import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { BillingModule } from './billing/billing.module';
import { AmbulanceModule } from './ambulance/ambulance.module';
import { FeedbackModule } from './feedback/feedback.module';
import { BedsModule } from './beds/beds.module';
import { InventoryModule } from './inventory/inventory.module';
import { SystemModule } from './system/system.module';

/**
 * Main Application Module
 * Root module that imports and configures all feature modules
 * Provides centralized dependency injection and module orchestration
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    PatientsModule,
    AppointmentsModule,
    BillingModule,
    AmbulanceModule,
    FeedbackModule,
    BedsModule,
    InventoryModule,
    SystemModule,
  ],
})
export class AppModule {}
