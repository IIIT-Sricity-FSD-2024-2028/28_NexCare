import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InventoryService } from '../inventory.service';
export declare class InventoryAuditInterceptor implements NestInterceptor {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
