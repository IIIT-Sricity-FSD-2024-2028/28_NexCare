import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HospitalsService } from '../hospitals.service';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../../auth/auth.service';
export declare class HospitalAccessMiddleware implements NestMiddleware {
    private readonly hospitalsService;
    private readonly usersService;
    private readonly authService;
    private readonly logger;
    constructor(hospitalsService: HospitalsService, usersService: UsersService, authService: AuthService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private resolveUser;
    private resolveUserHospitalId;
    private logUnauthorized;
}
