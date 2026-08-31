import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../interfaces/api-response.interface';

export const RESOURCE_OWNER_KEY = 'resourceOwnerCheck';

/**
 * ResourceOwnershipGuard
 *
 * Enforces that the resource being accessed via a :id route belongs to the
 * requesting user's hospital. Prevents IDOR (Insecure Direct Object Reference)
 * attacks where a malicious user increments/guesses a resource ID and reads
 * data belonging to a different hospital.
 *
 * Usage: apply per-controller by injecting the resource loader at the service
 * level, or use the static helper `assertSameHospital` inside service methods.
 *
 * The static helper is the recommended pattern — controllers/services call it
 * immediately after loading a resource by ID and before returning it.
 */
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // This guard delegates real enforcement to assertSameHospital below.
    // It is registered here so it can be applied globally if desired.
    // Route-level enforcement happens via the static helper in services.
    return true;
  }

  /**
   * Call this immediately after loading any single resource by its :id.
   * Throws 403 if the resource belongs to a different hospital.
   * Throws 404 if the resource is null (safe: don't leak existence to outsiders).
   *
   * @param user        request.user — set by AuthGuard from the verified JWT
   * @param resource    the loaded entity (must have a hospitalId field)
   * @param resourceLabel  human-readable label for error messages, e.g. 'Bill'
   *
   * @example
   *   const bill = bills.find(b => b.id === id);
   *   ResourceOwnershipGuard.assertSameHospital(request.user, bill, 'Bill');
   *   return bill; // safe to return now
   */
  static assertSameHospital(
    user: { role: UserRole; hospitalId?: string; id?: string } | undefined,
    resource: { hospitalId?: string; patientId?: string; doctorId?: string } | null | undefined,
    resourceLabel = 'Resource',
  ): void {
    if (!resource) {
      // Throw 404, not 403 — don't reveal that the resource exists in another tenant
      throw new NotFoundException(`${resourceLabel} not found.`);
    }

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // Superusers can access all resources
    if (user.role === UserRole.SUPERUSER) return;

    // Regional managers can access resources across their region —
    // full cross-hospital validation is done in HospitalScopeGuard.
    if (user.role === UserRole.REGIONAL_MANAGER) return;

    // Patients can only see their own records
    if (user.role === UserRole.PATIENT) {
      const patientId = (resource as any).patientId;
      if (patientId && (user as any).patientId && patientId !== (user as any).patientId) {
        throw new ForbiddenException(`${resourceLabel} not found.`);
      }
      return;
    }

    // Hospital staff must match hospitalId exactly
    if (!user.hospitalId) {
      throw new ForbiddenException('No hospital context on your session. Please log in again.');
    }

    if (resource.hospitalId && resource.hospitalId !== user.hospitalId) {
      throw new ForbiddenException(
        `${resourceLabel} not found.`, // Safe: same message as 404, doesn't leak cross-tenant info
      );
    }
  }
}
