import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Authentication Guard
 *
 * Runs on every route. Behaviour:
 *  - Routes decorated with @Public() are passed through without a token.
 *  - All other routes require a valid Bearer JWT in the Authorization header.
 *  - On success, the decoded token payload is attached to request.user.
 *  - On failure, throws 401 Unauthorized.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip guard for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided. Please log in.');
    }

    const payload = this.authService.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token. Please log in again.');
    }

    // Attach decoded user info to request so RolesGuard and controllers can use it.
    // hospitalId/patientId/name are needed by hospital-scoped and patient-scoped
    // controllers (requests, support-requests, departments, wards, equipment, …).
    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      patientId: payload.patientId ?? undefined,
      hospitalId: payload.hospitalId ?? undefined,
    };

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader: string = request.headers?.authorization ?? '';
    const [type, token] = authHeader.trim().split(/\s+/);
    return type === 'Bearer' ? token : undefined;
  }
}
