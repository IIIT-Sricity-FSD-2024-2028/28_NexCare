import { CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../interfaces/api-response.interface';
export declare class RolesGuard implements CanActivate {
    private requiredRoles?;
    constructor(requiredRoles?: UserRole[]);
    canActivate(context: ExecutionContext): boolean;
}
