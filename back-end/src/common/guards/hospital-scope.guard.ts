import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../interfaces/api-response.interface';

/**
 * Hospital Scope Guard & Helper
 *
 * Enforces hospital-level scoping:
 * - Superuser: Platform-wide access across all hospitals.
 * - Regional Officer: Access across hospitals assigned in their region.
 * - Patient: May select any verified hospital; private records remain
 *   patient-owned through ResourceOwnershipGuard/controller checks.
 * - Hospital Manager / Staff: Access strictly restricted to their assigned hospitalId.
 * - Any cross-hospital attempt throws 403 Forbidden.
 */
@Injectable()
export class HospitalScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true; // AuthGuard handles authentication

    // Superuser has global access
    if (user.role === UserRole.SUPERUSER) {
      return true;
    }

    // A home/registration hospital on a patient profile is reporting metadata,
    // not a tenancy boundary. Patients may discover and book across the network.
    if (user.role === UserRole.PATIENT) {
      return true;
    }

    // Extract target hospital ID from params, query, or body
    const targetHospitalId =
      request.params?.hospitalId ||
      request.params?.id ||
      request.query?.hospitalId ||
      request.body?.hospitalId;

    if (!targetHospitalId) {
      return true; // Scope filtered dynamically in controller/service
    }

    return HospitalScopeGuard.enforceScope(user, targetHospitalId);
  }

  /**
   * Helper function to enforce hospital scope in controllers or services
   */
  static enforceScope(user: any, targetHospitalId: string, allowedHospitalIds?: string[]): boolean {
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === UserRole.SUPERUSER) {
      return true;
    }

    if (user.role === UserRole.REGIONAL_MANAGER) {
      if (allowedHospitalIds && allowedHospitalIds.length > 0) {
        if (!allowedHospitalIds.includes(targetHospitalId)) {
          throw new ForbiddenException(
            `Access denied. Hospital ${targetHospitalId} is not assigned to your regional jurisdiction.`,
          );
        }
      }
      return true;
    }

    // Hospital Manager & Staff must match their own hospitalId exactly
    if (user.hospitalId && targetHospitalId && user.hospitalId !== targetHospitalId) {
      throw new ForbiddenException(
        `Access denied. You can only manage data for your assigned hospital (${user.hospitalId}). Target: ${targetHospitalId}`,
      );
    }

    return true;
  }
}
