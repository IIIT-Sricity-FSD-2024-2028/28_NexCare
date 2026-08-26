import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BedsService } from '../beds.service';
import { AuthService } from '../../auth/auth.service';
import { BedStatus } from '../../common/interfaces/api-response.interface';

/**
 * Bed status transition rules.
 *
 * A bed may only move to a status listed for its current status. The most
 * important rule is that a bed under maintenance can never be handed straight
 * to a patient — it has to be signed off as `available` first:
 *   maintenance -> occupied  ❌
 *   maintenance -> available -> occupied  ✅
 * A bed with a patient in it also cannot be sent to maintenance; the patient
 * must be released first.
 */
const ALLOWED_TRANSITIONS: Record<BedStatus, BedStatus[]> = {
  [BedStatus.AVAILABLE]: [BedStatus.OCCUPIED, BedStatus.MAINTENANCE],
  [BedStatus.OCCUPIED]: [BedStatus.CRITICAL, BedStatus.AVAILABLE],
  [BedStatus.CRITICAL]: [BedStatus.OCCUPIED, BedStatus.AVAILABLE],
  [BedStatus.MAINTENANCE]: [BedStatus.AVAILABLE],
};

/** Human readable hint shown when a transition is rejected */
const TRANSITION_HINTS: Partial<Record<string, string>> = {
  'maintenance->occupied': 'Mark the bed as available once maintenance is complete, then allocate it.',
  'maintenance->critical': 'Mark the bed as available once maintenance is complete, then allocate it.',
  'occupied->maintenance': 'Release the patient from the bed before sending it for maintenance.',
  'critical->maintenance': 'Release the patient from the bed before sending it for maintenance.',
  'available->critical': 'A bed must be allocated to a patient (occupied) before it can be marked critical.',
};

/**
 * Bed Status Change Middleware
 *
 * Runs before every request that can change a bed's status:
 *   PATCH /beds/:id/status
 *   PATCH /beds/:id/allocate
 *   PATCH /beds/:id/release
 *   PUT   /beds/:id      (only when the payload carries a status)
 *   PATCH /beds/:id      (only when the payload carries a status)
 *
 * Responsibilities:
 *  - Work out the status the request is asking for.
 *  - Reject illegal transitions with 400 Bad Request before the controller runs.
 *  - Log every accepted and rejected change with user, timestamp and old -> new.
 *
 * Note on the rejection: Nest 10 runs on Express 4, whose error handling does
 * not cover asynchronous middleware, and global exception filters are only
 * wired around route handlers. So instead of throwing a BadRequestException
 * this writes the same JSON envelope that HttpExceptionFilter produces, which
 * keeps the response shape identical for the frontend.
 */
@Injectable()
export class BedStatusChangeMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BedStatusChange');

  constructor(
    private readonly bedsService: BedsService,
    private readonly authService: AuthService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const bedId = this.extractBedId(req);
    const action = this.extractAction(req);
    const actor = this.resolveActor(req);

    if (!bedId) {
      return next();
    }

    const bed = this.bedsService.getBedById(bedId);
    if (!bed) {
      // Let the controller/service produce the standard 404 response
      return next();
    }

    const currentStatus = bed.status;
    const requestedStatus = this.resolveRequestedStatus(req, action);

    // Nothing status related in this request (e.g. a PUT that only renames a ward)
    if (requestedStatus === undefined) {
      return next();
    }

    // An unknown value in the payload — reject before the service coerces it
    if (requestedStatus === null) {
      const supplied = (req.body ?? {}).status;
      this.logger.warn(
        `REJECTED bed=${bedId} action=${action} user=${actor.label} — unknown status "${supplied}"`,
      );
      return this.reject(
        res,
        req,
        `"${supplied}" is not a valid bed status. Valid statuses: ${Object.values(BedStatus).join(', ')}.`,
      );
    }

    // Same status in, same status out — harmless, let the service decide
    if (requestedStatus === currentStatus) {
      this.logger.log(
        `NO-OP bed=${bedId} already ${currentStatus} action=${action} user=${actor.label}`,
      );
      return next();
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(requestedStatus)) {
      const hint = TRANSITION_HINTS[`${currentStatus}->${requestedStatus}`];
      this.logger.warn(
        `REJECTED bed=${bedId} ${currentStatus} -> ${requestedStatus} action=${action} ` +
          `user=${actor.label} at=${new Date().toISOString()}`,
      );
      return this.reject(
        res,
        req,
        `Illegal bed status transition: ${currentStatus} -> ${requestedStatus}.` +
          (hint ? ` ${hint}` : '') +
          ` Allowed from ${currentStatus}: ${allowed.join(', ') || 'none'}.`,
      );
    }

    this.logger.log(
      `bed=${bedId} ${currentStatus} -> ${requestedStatus} action=${action} ` +
        `user=${actor.label} at=${new Date().toISOString()}`,
    );

    // Handy for the controller / downstream logging
    (req as any).bedStatusChange = {
      bedId,
      action,
      from: currentStatus,
      to: requestedStatus,
      userId: actor.id,
      timestamp: new Date().toISOString(),
    };

    next();
  }

  /**
   * Bed id from the route params, falling back to parsing the URL directly
   * (middleware bound with a wildcard path does not always populate params).
   */
  private extractBedId(req: Request): string | undefined {
    const fromParams = (req.params as Record<string, string> | undefined)?.id;
    if (fromParams) return fromParams;

    const match = req.originalUrl.match(/\/beds\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  /** Which bed operation is being attempted */
  private extractAction(req: Request): 'status' | 'allocate' | 'release' | 'update' {
    const path = req.originalUrl.split('?')[0];
    if (path.endsWith('/status')) return 'status';
    if (path.endsWith('/allocate')) return 'allocate';
    if (path.endsWith('/release')) return 'release';
    return 'update';
  }

  /**
   * The status this request is asking for.
   * `undefined` — the request does not change the status at all.
   * `null`      — a status was supplied but it is not a known BedStatus.
   */
  private resolveRequestedStatus(
    req: Request,
    action: ReturnType<BedStatusChangeMiddleware['extractAction']>,
  ): BedStatus | null | undefined {
    if (action === 'allocate') return BedStatus.OCCUPIED;
    if (action === 'release') return BedStatus.AVAILABLE;

    const supplied = (req.body ?? {}).status;
    if (supplied === undefined || supplied === null || supplied === '') {
      // A bare status call with no payload is a client error, not a transition
      return action === 'status' ? null : undefined;
    }

    const normalized = String(supplied).trim().toLowerCase();
    const known = Object.values(BedStatus).find((s) => s === normalized);
    return known ?? null;
  }

  /**
   * Identify the caller from the Bearer token so the change can be attributed.
   * Authentication itself stays the AuthGuard's job — middleware runs before
   * guards, so an unusable token is simply logged as `anonymous` here.
   */
  private resolveActor(req: Request): { id: string; label: string } {
    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) {
      return { id: 'anonymous', label: 'anonymous' };
    }

    const payload = this.authService.verifyToken(token);
    if (!payload) {
      return { id: 'anonymous', label: 'anonymous (invalid token)' };
    }

    return {
      id: payload.sub,
      label: `${payload.sub} (${payload.email} / ${payload.role})`,
    };
  }

  /** Same envelope as HttpExceptionFilter so the frontend parses one shape */
  private reject(res: Response, req: Request, message: string): void {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message,
      error: 'BAD_REQUEST',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
}
