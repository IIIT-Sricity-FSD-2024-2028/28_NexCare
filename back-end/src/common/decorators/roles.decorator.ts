import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../interfaces/api-response.interface';

/**
 * Roles Decorator
 * Specify which roles are allowed to access a route
 * Usage: @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
