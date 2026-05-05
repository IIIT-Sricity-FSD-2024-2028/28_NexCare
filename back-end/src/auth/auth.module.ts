import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SystemModule } from '../system/system.module';
import { PatientsModule } from '../patients/patients.module';

/**
 * Authentication Module
 * Handles authentication, authorization, and session management
 * Provides services for login, registration, and user session tracking
 */
@Module({
  imports: [SystemModule, PatientsModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
