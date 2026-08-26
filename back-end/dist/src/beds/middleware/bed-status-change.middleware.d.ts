import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BedsService } from '../beds.service';
import { AuthService } from '../../auth/auth.service';
export declare class BedStatusChangeMiddleware implements NestMiddleware {
    private readonly bedsService;
    private readonly authService;
    private readonly logger;
    constructor(bedsService: BedsService, authService: AuthService);
    use(req: Request, res: Response, next: NextFunction): void;
    private extractBedId;
    private extractAction;
    private resolveRequestedStatus;
    private resolveActor;
    private reject;
}
