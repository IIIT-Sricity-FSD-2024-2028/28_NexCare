import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../../common/interfaces/api-response.interface';

/**
 * Restricts ambulance request access so hospital-scoped users can only see and
 * act on requests belonging to their assigned hospital.
 *
 * Not every role IS hospital-scoped, and requiring a hospitalId of the ones
 * that are not made the endpoint unusable for them:
 *
 *  - PATIENT has no hospitalId. A patient is a customer of the platform who
 *    picks a hospital per request, so demanding one up front rejected every
 *    patient ambulance request with 403 "You are not assigned to any hospital".
 *    Patients are already constrained to their own records by
 *    assertOwnsRequest() in the controller.
 *  - REGIONAL_MANAGER has no hospitalId either; they oversee a SET of
 *    hospitals, and their scope is enforced against that set elsewhere.
 *  - SUPERUSER sees everything.
 *
 * Everyone else — administrative staff, ambulance crew, hospital managers — is
 * pinned to exactly one hospital, and that is what this middleware enforces.
 */
@Injectable()
export class AmbulanceAccessMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AmbulanceAccessMiddleware.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = this.resolveUser(req);
    if (!user) {
      return next();
    }

    // Roles that are not pinned to a single hospital. See the class comment —
    // requiring a hospitalId of these made the endpoint unusable for them.
    const NOT_HOSPITAL_SCOPED: string[] = [
      UserRole.SUPERUSER,
      UserRole.PATIENT,
      UserRole.REGIONAL_MANAGER,
    ];
    if (NOT_HOSPITAL_SCOPED.includes(user.role)) {
      return next();
    }

    // Get hospital ID from authenticated user
    const userHospitalId = await this.resolveUserHospitalId(user.id);
    if (!userHospitalId) {
      // User has no hospital assignment - reject
      this.logUnauthorized(user, 'no hospital assignment');
      throw new ForbiddenException('You are not assigned to any hospital');
    }

    // Attach hospitalId to request for downstream use
    (req as any).hospitalId = userHospitalId;

    // For GET requests with hospitalId query param, validate it matches user's hospital
    const queryHospitalId = req.query?.hospitalId as string;
    if (queryHospitalId && queryHospitalId !== userHospitalId) {
      this.logUnauthorized(user, queryHospitalId);
      throw new ForbiddenException('You can only access ambulance requests for your assigned hospital');
    }

    // For PUT/PATCH/DELETE by ID, we'll validate in the service layer
    // by checking the request's hospitalId against the user's hospitalId
    return next();
  }

  private resolveUser(req: Request): { id: string; role: string } | null {
    const attached = (req as any).user;
    if (attached?.id && attached?.role) {
      return attached;
    }

    const authHeader: string = req.headers?.authorization ?? '';
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    const payload = this.authService.verifyToken(token);
    if (!payload) {
      return null;
    }

    return {
      id: payload.sub,
      role: payload.role,
    };
  }

  private async resolveUserHospitalId(userId: string): Promise<string | undefined> {
    const result = await this.usersService.findById(userId);
    return result?.data?.hospitalId;
  }

  private logUnauthorized(user: { id: string; role: string }, hospitalId: string) {
    this.logger.warn(
      `Unauthorized ambulance access attempt: userId=${user.id} role=${user.role} hospitalId=${hospitalId} at ${new Date().toISOString()}`,
    );
  }
}
