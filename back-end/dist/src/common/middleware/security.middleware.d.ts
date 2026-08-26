import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class SecurityMiddleware implements NestMiddleware {
    private readonly helmetHandler;
    private readonly hits;
    private readonly maxBodyBytes;
    private readonly disabled;
    constructor();
    use(req: Request, res: Response, next: NextFunction): void;
    private sweep;
    private clientIp;
}
