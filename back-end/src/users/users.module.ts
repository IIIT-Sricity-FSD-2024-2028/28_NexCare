import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HospitalsModule } from '../hospitals/hospitals.module';

/**
 * Users Module
 * Manages user accounts across all roles in the NexCare system
 * Provides CRUD operations and user management functionality
 */
@Module({
  // Circular by design: UsersController scopes /users to a regional officer's
  // hospitals, while HospitalsModule's HospitalDetailsController needs
  // UsersService for its per-hospital doctor list. forwardRef breaks the cycle.
  imports: [forwardRef(() => HospitalsModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
