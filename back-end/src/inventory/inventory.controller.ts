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
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { RestockInventoryDto } from './dto/restock-inventory.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, InventoryStatus } from '../common/interfaces/api-response.interface';

/**
 * Inventory Controller
 * Manages supply chain and inventory tracking in the NexCare system.
 * Staff are scoped to their own hospital; superuser sees all hospitals.
 */
@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /** Hospital to scope queries to: undefined (all) for superuser, else the user's hospital. */
  private scopeHospitalId(req: any): string | undefined {
    const user = req?.user;
    return user?.role === UserRole.SUPERUSER ? undefined : user?.hospitalId;
  }

  /**
   * Get all inventory with optional filtering
   */
  // Regional Officers get read-only oversight; the client scopes to one hospital.
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.REGIONAL_MANAGER)
  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InventoryStatus })
  @ApiQuery({ name: 'location', required: false })
  @ApiResponse({ status: 200, description: 'List of inventory items' })
  async findAll(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('location') location?: string
  ) {
    return this.inventoryService.findAll(category, status as any, location, this.scopeHospitalId(req));
  }

  /**
   * Create new inventory item
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 200, description: 'Item creation result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Req() req: any, @Body() createInventoryDto: CreateInventoryDto) {
    const hospitalId = this.scopeHospitalId(req) || (createInventoryDto as any).hospitalId;
    return this.inventoryService.create({ ...(createInventoryDto as any), hospitalId });
  }

  /**
   * Get inventory statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({ status: 200, description: 'Inventory statistics retrieved' })
  async getStats(@Req() req: any) {
    return this.inventoryService.getStats(this.scopeHospitalId(req));
  }

  /**
   * Get low stock items
   */
  @Get('low-stock')
  @ApiOperation({ summary: 'Get all low stock items' })
  @ApiResponse({ status: 200, description: 'List of low stock items' })
  async getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  /**
   * Get out of stock items
   */
  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get all out of stock items' })
  @ApiResponse({ status: 200, description: 'List of out of stock items' })
  async getOutOfStockItems() {
    return this.inventoryService.getOutOfStockItems();
  }

  /**
   * Get items by category
   */
  @Get('category/:category')
  @ApiOperation({ summary: 'Get items by category' })
  @ApiResponse({ status: 200, description: 'List of items in category' })
  async findByCategory(@Param('category') category: string) {
    return this.inventoryService.findByCategory(category);
  }

  /**
   * Get items by location
   */
  @Get('location/:location')
  @ApiOperation({ summary: 'Get items by location' })
  @ApiResponse({ status: 200, description: 'List of items at location' })
  async findByLocation(@Param('location') location: string) {
    return this.inventoryService.findByLocation(location);
  }

  /**
   * Search inventory items
   */
  @Get('search/:query')
  @ApiOperation({ summary: 'Search inventory items' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Param('query') query: string) {
    return this.inventoryService.search(query);
  }

  /**
   * Get inventory item by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Item details retrieved' })
  async findById(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  /**
   * Update inventory item
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto as any);
  }

  /**
   * Partial update inventory item
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an inventory item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  async patchUpdate(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto as any);
  }

  /**
   * Delete inventory item
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.inventoryService.delete(id);
  }

  /**
   * Restock inventory item
   */
  @Patch(':id/restock')
  @ApiOperation({ summary: 'Restock an inventory item' })
  @ApiResponse({ status: 200, description: 'Item restocked successfully' })
  async restock(@Param('id') id: string, @Body() restockDto: RestockInventoryDto) {
    return this.inventoryService.restock(id, { quantity: restockDto.quantity, notes: restockDto.notes });
  }

  /**
   * Use inventory item
   */
  @Patch(':id/use')
  @ApiOperation({ summary: 'Consume/use an inventory item' })
  @ApiResponse({ status: 200, description: 'Item consumed successfully' })
  async useItem(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.useItem(id, quantity);
  }
}
