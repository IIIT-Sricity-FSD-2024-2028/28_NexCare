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
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Inventory Controller
 * Manages supply chain and inventory tracking in the NexCare system
 * Provides endpoints for inventory CRUD operations and stock management
 */
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Get all inventory with optional filtering
   * @route GET /inventory
   * @query category Optional category filter
   * @query status Optional status filter
   * @query location Optional location filter
   * @access Private (Admin/Staff)
   */
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('location') location?: string
  ) {
    return this.inventoryService.findAll(category, status as any, location);
  }

  /**
   * Create new inventory item
   * @route POST /inventory
   * @access Private (Admin/Staff)
   */
  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto as any);
  }

  /**
   * Get inventory statistics
   * @route GET /inventory/stats
   * @access Private (Admin/Staff)
   */
  @Get('stats/overview')
  async getStats() {
    return this.inventoryService.getStats();
  }

  /**
   * Get low stock items
   * @route GET /inventory/low-stock
   * @access Private (Admin/Staff)
   */
  @Get('low-stock')
  async getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  /**
   * Get out of stock items
   * @route GET /inventory/out-of-stock
   * @access Private (Admin/Staff)
   */
  @Get('out-of-stock')
  async getOutOfStockItems() {
    return this.inventoryService.getOutOfStockItems();
  }

  /**
   * Get items by category
   * @route GET /inventory/category/:category
   * @access Private (Admin/Staff)
   */
  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.inventoryService.findByCategory(category);
  }

  /**
   * Get items by location
   * @route GET /inventory/location/:location
   * @access Private (Admin/Staff)
   */
  @Get('location/:location')
  async findByLocation(@Param('location') location: string) {
    return this.inventoryService.findByLocation(location);
  }

  /**
   * Search inventory items
   * @route GET /inventory/search/:query
   * @access Private (Admin/Staff)
   */
  @Get('search/:query')
  async search(@Param('query') query: string) {
    return this.inventoryService.search(query);
  }

  /**
   * Get inventory item by ID
   * @route GET /inventory/:id
   * @access Private (Admin/Staff)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  /**
   * Update inventory item
   * @route PUT /inventory/:id
   * @access Private (Admin/Staff)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto as any);
  }

  /**
   * Partial update inventory item
   * @route PATCH /inventory/:id
   * @access Private (Admin/Staff)
   */
  @Patch(':id')
  async patchUpdate(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto as any);
  }

  /**
   * Delete inventory item
   * @route DELETE /inventory/:id
   * @access Private (Admin)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.inventoryService.delete(id);
  }

  /**
   * Restock inventory item
   * @route PATCH /inventory/:id/restock
   * @access Private (Admin/Staff)
   */
  @Patch(':id/restock')
  async restock(@Param('id') id: string, @Body('quantity') quantity: number, @Body('notes') notes?: string) {
    return this.inventoryService.restock(id, { quantity, notes });
  }

  /**
   * Use inventory item
   * @route PATCH /inventory/:id/use
   * @access Private (Admin/Staff)
   */
  @Patch(':id/use')
  async useItem(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.useItem(id, quantity);
  }
}
