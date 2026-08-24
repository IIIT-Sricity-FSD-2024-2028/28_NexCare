import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InventoryService } from '../inventory.service';
import { IdGenerator } from '../../common/utils/id-generator.util';
import { InventoryAudit } from '../interfaces/inventory.interface';

/**
 * Inventory Audit Interceptor
 * Intercepts restock and consume/use operations on inventory items,
 * captures before/after stock quantities, writes audit logs to disk,
 * and sets the 'x-audit-id' header on the HTTP response.
 */
@Injectable()
export class InventoryAuditInterceptor implements NestInterceptor {
  constructor(private readonly inventoryService: InventoryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const itemId = request.params?.id;

    // Capture before state
    const itemBefore = itemId ? this.inventoryService.getRawItem(itemId) : undefined;
    const quantityBefore = itemBefore ? itemBefore.quantity : 0;
    const statusBefore = itemBefore?.status;

    // Determine action: restock vs use
    const url = request.url || request.originalUrl || '';
    const action: 'restock' | 'use' = url.includes('/use') ? 'use' : 'restock';

    // Determine user ID from JWT auth user, request body, or default fallback
    const userId =
      request.user?.id ||
      request.user?.email ||
      request.body?.restockedBy ||
      'ADMIN';

    // Generate unique audit ID
    const auditId = IdGenerator.generateAuditId();

    // Attach x-audit-id header to response (and expose it for CORS if applicable)
    if (response && typeof response.setHeader === 'function') {
      response.setHeader('x-audit-id', auditId);
      response.setHeader('Access-Control-Expose-Headers', 'x-audit-id');
    } else if (response && typeof response.header === 'function') {
      response.header('x-audit-id', auditId);
      response.header('Access-Control-Expose-Headers', 'x-audit-id');
    }

    return next.handle().pipe(
      tap((resData) => {
        // Capture after state from result or state lookup
        const afterItem = resData?.data || (itemId ? this.inventoryService.getRawItem(itemId) : undefined);
        const quantityAfter =
          afterItem && typeof afterItem.quantity === 'number'
            ? afterItem.quantity
            : quantityBefore;
        const statusAfter = afterItem?.status || statusBefore;

        const auditEntry: InventoryAudit = {
          id: auditId,
          itemId,
          action,
          quantityBefore,
          quantityAfter,
          statusBefore,
          statusAfter,
          userId,
          timestamp: new Date().toISOString(),
          notes: request.body?.notes || undefined,
        };

        this.inventoryService.recordAuditEntry(auditEntry);
      }),
    );
  }
}
