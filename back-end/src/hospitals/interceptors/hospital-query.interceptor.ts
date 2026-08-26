import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class HospitalQueryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HospitalQueryInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();

    const timestamp = new Date().toISOString();

    if (request && request.query) {
      const { speciality, city, pincode } = request.query;

      if (typeof speciality === 'string') {
        request.query.speciality = speciality.trim().toLowerCase();
      }

      if (typeof city === 'string') {
        request.query.city = city.trim().toLowerCase();
      }

      if (typeof pincode === 'string') {
        request.query.pincode = pincode.trim();
      }

      this.logger.log(
        `Sanitized query [Timestamp: ${timestamp}]: speciality="${request.query.speciality ?? ''}", city="${request.query.city ?? ''}", pincode="${request.query.pincode ?? ''}"`,
      );
    }

    if (response && typeof response.setHeader === 'function') {
      response.setHeader('x-query-timestamp', timestamp);
    }

    return next.handle();
  }
}
