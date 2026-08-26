import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HospitalsModule } from '../hospitals/hospitals.module';

/**
 * Users Module
 * Manages user accounts across all roles in the NexCare system
 * Provides CRUD operations and user management functionality
 */
@Module({
  imports: [HospitalsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
