import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HospitalsService } from '../hospitals.service';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../../common/interfaces/api-response.interface';

/**
 * Restricts hospital GET/PUT/PATCH-by-id access so regional and hospital
 * managers can only act on hospitals they are assigned to.
 * Superusers bypass the check. Unauthenticated public GETs are allowed
 * (findById is a public patient-facing route).
 */
@Injectable()
export class HospitalAccessMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HospitalAccessMiddleware.name);

  constructor(
    private readonly hospitalsService: HospitalsService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const hospitalId = req.params?.id;
    if (!hospitalId || hospitalId === 'nearby' || hospitalId === 'register') {
      return next();
    }

    const user = this.resolveUser(req);
    if (!user) {
      return next();
    }

    if (user.role === UserRole.SUPERUSER) {
      return next();
    }

    // Regional managers can verify/reject hospitals without being assigned
    const isVerificationAction = req.path?.includes('/verify') || req.path?.includes('/reject');
    if (user.role === UserRole.REGIONAL_MANAGER && isVerificationAction) {
      return next();
    }

    const hospitalResult = await this.hospitalsService.findById(hospitalId);
    const hospital = hospitalResult?.data;
    if (!hospital) {
      return next();
    }

    if (user.role === UserRole.REGIONAL_MANAGER) {
      if (hospital.assignedManagerId !== user.id) {
        this.logUnauthorized(user, hospitalId);
        throw new ForbiddenException('You are not assigned to this hospital');
      }
      return next();
    }

    if (user.role === UserRole.HOSPITAL_MANAGER) {
      const userHospitalId = await this.resolveUserHospitalId(user.id);
      if (userHospitalId !== hospitalId) {
        this.logUnauthorized(user, hospitalId);
        throw new ForbiddenException('You are not assigned to this hospital');
      }
      return next();
    }

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
      `Unauthorized hospital access attempt: userId=${user.id} role=${user.role} hospitalId=${hospitalId} at ${new Date().toISOString()}`,
    );
  }
}
