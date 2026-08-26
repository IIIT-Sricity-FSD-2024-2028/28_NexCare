import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare const MAX_UPLOAD_BYTES: number;
export declare class FileUploadMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
    private reject;
}
