import { Request, Response, NextFunction } from 'express';
export declare function errorHandlerMiddleware(err: any, req: Request, res: Response, next: NextFunction): void;
export declare function notFoundMiddleware(req: Request, res: Response): void;
