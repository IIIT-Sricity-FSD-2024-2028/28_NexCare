import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Patch, 
  Delete, 
  Param, 
  Query,
  Req,
  ForbiddenException,
  HttpCode, 
  HttpStatus, 
  UseInterceptors 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { RestockInventoryDto } from './dto/restock-inventory.dto';
import { CreateInventoryRequirementDto, DecideInventoryRequirementDto } from './interfaces/inventory.interface';
import { InventoryAuditInterceptor } from './interceptors/inventory-audit.interceptor';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, InventoryStatus } from '../common/interfaces/api-response.interface';

/**
 * Inventory Controller
 * Manages supply chain, inventory tracking, and inventory requirement workflows
 */
@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Get all inventory items with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InventoryStatus })
  @ApiQuery({ name: 'location', required: false })
  @ApiResponse({ status: 200, description: 'List of inventory items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('location') location?: string
  ) {
    return this.inventoryService.findAll(category, status as any, location);
  }

  // ==============================================================
  // INVENTORY REQUIREMENT APPROVALS WORKFLOW
  // ==============================================================

  /**
   * Get all inventory requirements (Scoped by hospital)
   */
  @Get('requirements')
  @ApiOperation({ summary: 'Get all inventory requirement requests' })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiResponse({ status: 200, description: 'List of inventory requirements' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRequirements(
    @Req() req: any,
    @Query('hospitalId') hospitalId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('department') department?: string,
  ) {
    const caller = req.user;
    let targetHospitalId = hospitalId;

    if (caller?.role === UserRole.HOSPITAL_MANAGER || caller?.role === UserRole.ADMINISTRATIVE_STAFF) {
      if (hospitalId && caller.hospitalId && hospitalId !== caller.hospitalId) {
        throw new ForbiddenException(
          `Cross-hospital access denied. You can only access inventory requirements for your hospital (${caller.hospitalId}).`
        );
      }
      targetHospitalId = caller.hospitalId;
    }

    return this.inventoryService.findAllRequirements(targetHospitalId, status, priority, department);
  }

  /**
   * Get single inventory requirement by ID
   */
  @Get('requirements/:id')
  @ApiOperation({ summary: 'Get single inventory requirement by ID' })
  @ApiResponse({ status: 200, description: 'Inventory requirement retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRequirementById(@Req() req: any, @Param('id') id: string) {
    const caller = req.user;
    const res: any = await this.inventoryService.findRequirementById(id);

    if (caller?.role === UserRole.HOSPITAL_MANAGER && res?.success && res.data) {
      if (res.data.hospitalId && res.data.hospitalId !== caller.hospitalId) {
        throw new ForbiddenException('Cross-hospital access denied.');
      }
    }
    return res;
  }

  /**
   * Raise a new inventory requirement (Administrative Staff or Manager)
   */
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.ADMINISTRATIVE_STAFF)
  @Post('requirements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an inventory requirement request' })
  @ApiResponse({ status: 200, description: 'Inventory requirement created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async createRequirement(@Req() req: any, @Body() data: CreateInventoryRequirementDto) {
    const caller = req.user;
    if ((caller?.role === UserRole.HOSPITAL_MANAGER || caller?.role === UserRole.ADMINISTRATIVE_STAFF) && caller.hospitalId) {
      data.hospitalId = caller.hospitalId;
    }
    if (caller) {
      data.requestedBy = data.requestedBy || caller.name || 'Administrative Staff';
      data.requestedById = caller.id;
    }
    return this.inventoryService.createRequirement(data);
  }

  /**
   * Approve an inventory requirement (Hospital Manager action)
   */
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER)
  @Patch('requirements/:id/approve')
  @ApiOperation({ summary: 'Approve an inventory requirement' })
  @ApiResponse({ status: 200, description: 'Requirement approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async approveRequirement(@Req() req: any, @Param('id') id: string, @Body() body?: DecideInventoryRequirementDto) {
    const caller = req.user;
    if (caller?.role === UserRole.HOSPITAL_MANAGER) {
      const currentRes: any = await this.inventoryService.findRequirementById(id);
      if (currentRes?.success && currentRes.data) {
        if (currentRes.data.hospitalId && currentRes.data.hospitalId !== caller.hospitalId) {
          throw new ForbiddenException('Cross-hospital access denied. You can only approve requirements for your hospital.');
        }
      }
    }
    return this.inventoryService.approveRequirement(id, caller?.id || 'HM', caller?.name || 'Hospital Manager', body?.managerRemarks);
  }

  /**
   * Reject an inventory requirement with reason (Hospital Manager action)
   */
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER)
  @Patch('requirements/:id/reject')
  @ApiOperation({ summary: 'Reject an inventory requirement with reason' })
  @ApiResponse({ status: 200, description: 'Requirement rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async rejectRequirement(@Req() req: any, @Param('id') id: string, @Body() body: DecideInventoryRequirementDto) {
    const caller = req.user;
    if (caller?.role === UserRole.HOSPITAL_MANAGER) {
      const currentRes: any = await this.inventoryService.findRequirementById(id);
      if (currentRes?.success && currentRes.data) {
        if (currentRes.data.hospitalId && currentRes.data.hospitalId !== caller.hospitalId) {
          throw new ForbiddenException('Cross-hospital access denied. You can only reject requirements for your hospital.');
        }
      }
    }
    return this.inventoryService.rejectRequirement(
      id, 
      caller?.id || 'HM', 
      caller?.name || 'Hospital Manager', 
      body?.rejectionReason || 'Request rejected by Hospital Manager'
    );
  }

  /**
   * Start Purchase for an approved requirement (Administrative Staff action)
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Patch('requirements/:id/start-purchase')
  @ApiOperation({ summary: 'Initiate purchasing for an approved requirement' })
  @ApiResponse({ status: 200, description: 'Purchase initiated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async startPurchase(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const caller = req.user;
    return this.inventoryService.startPurchase(id, body, caller?.id || 'U002', caller?.name || 'Administrative Staff');
  }

  /**
   * Mark requirement as purchased (Administrative Staff action)
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Patch('requirements/:id/mark-purchased')
  @ApiOperation({ summary: 'Mark inventory requirement as purchased' })
  @ApiResponse({ status: 200, description: 'Requirement marked as purchased' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async markPurchased(@Req() req: any, @Param('id') id: string) {
    const caller = req.user;
    return this.inventoryService.markPurchased(id, caller?.id || 'U002', caller?.name || 'Administrative Staff');
  }

  /**
   * Mark requirement as restocked and increment central inventory stock (Administrative Staff action)
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Patch('requirements/:id/mark-restocked')
  @ApiOperation({ summary: 'Mark inventory requirement as restocked and increase stock' })
  @ApiResponse({ status: 200, description: 'Requirement restocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async markRestocked(@Req() req: any, @Param('id') id: string) {
    const caller = req.user;
    return this.inventoryService.markRestocked(id, caller?.id || 'U002', caller?.name || 'Administrative Staff');
  }

  /**
   * Legacy fulfill endpoint (alias to mark-restocked)
   */
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.ADMINISTRATIVE_STAFF)
  @Patch('requirements/:id/fulfill')
  @ApiOperation({ summary: 'Mark requirement fulfilled and restock stock' })
  @ApiResponse({ status: 200, description: 'Requirement fulfilled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async fulfillRequirement(@Req() req: any, @Param('id') id: string) {
    const caller = req.user;
    return this.inventoryService.markRestocked(id, caller?.id || 'SYSTEM', caller?.name || 'Administrative Staff');
  }

  // ==============================================================
  // STANDARD INVENTORY CRUD & AUDIT
  // ==============================================================

  /**
   * Create new inventory item
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 200, description: 'Item creation result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto as any);
  }

  /**
   * Get inventory statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({ status: 200, description: 'Inventory statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.inventoryService.getStats();
  }

  /**
   * Get low stock items
   */
  @Get('low-stock')
  @ApiOperation({ summary: 'Get all low stock items' })
  @ApiResponse({ status: 200, description: 'List of low stock items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  /**
   * Get out of stock items
   */
  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get all out of stock items' })
  @ApiResponse({ status: 200, description: 'List of out of stock items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOutOfStockItems() {
    return this.inventoryService.getOutOfStockItems();
  }

  /**
   * Get items by category
   */
  @Get('category/:category')
  @ApiOperation({ summary: 'Get items by category' })
  @ApiResponse({ status: 200, description: 'List of items in category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByCategory(@Param('category') category: string) {
    return this.inventoryService.findByCategory(category);
  }

  /**
   * Get items by location
   */
  @Get('location/:location')
  @ApiOperation({ summary: 'Get items by location' })
  @ApiResponse({ status: 200, description: 'List of items at location' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByLocation(@Param('location') location: string) {
    return this.inventoryService.findByLocation(location);
  }

  /**
   * Search inventory items
   */
  @Get('search/:query')
  @ApiOperation({ summary: 'Search inventory items' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async search(@Param('query') query: string) {
    return this.inventoryService.search(query);
  }

  /**
   * Get inventory audit trail for an item
   */
  @Get('audit/:itemId')
  @ApiOperation({ summary: 'Get inventory audit trail for an item' })
  @ApiResponse({ status: 200, description: 'Audit trail retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAuditTrail(@Param('itemId') itemId: string) {
    return this.inventoryService.getAuditTrail(itemId);
  }

  /**
   * Get inventory item by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Item details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findById(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  /**
   * Update inventory item
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Put(':id')
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto as any);
  }

  /**
   * Partial update inventory item
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an inventory item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async patchUpdate(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto as any);
  }

  /**
   * Delete inventory item
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async delete(@Param('id') id: string) {
    return this.inventoryService.delete(id);
  }

  /**
   * Restock inventory item
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Patch(':id/restock')
  @UseInterceptors(InventoryAuditInterceptor)
  @ApiOperation({ summary: 'Restock an inventory item' })
  @ApiResponse({ status: 200, description: 'Item restocked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async restock(@Param('id') id: string, @Body() restockDto: RestockInventoryDto) {
    return this.inventoryService.restock(id, restockDto);
  }

  /**
   * Use inventory item
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER)
  @Patch(':id/use')
  @UseInterceptors(InventoryAuditInterceptor)
  @ApiOperation({ summary: 'Consume/use an inventory item' })
  @ApiResponse({ status: 200, description: 'Item consumed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async useItem(@Param('id') id: string, @Body() body: any) {
    const quantity = typeof body === 'number' ? body : Number(body?.quantity);
    return this.inventoryService.useItem(id, quantity, body?.notes);
  }
}
