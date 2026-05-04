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
import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Billing Controller
 * Manages financial operations and bill generation in the NexCare system
 * Provides endpoints for bill CRUD operations and payment processing
 */
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Get all bills with optional filtering
   * @route GET /billing
   * @query patientId Optional patient filter
   * @query status Optional status filter
   * @access Private (Admin/Staff/Patient)
   */
  @Get()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string
  ) {
    return this.billingService.findAll(patientId, status as any);
  }

  /**
   * Create new bill
   * @route POST /billing
   * @access Private (Admin/Staff)
   */
  @Post()
  async create(@Body() createBillDto: CreateBillDto) {
    return this.billingService.create(createBillDto as any);
  }

  /**
   * Get bill statistics
   * @route GET /billing/stats
   * @access Private (Admin/Staff)
   */
  @Get('stats/overview')
  async getStats() {
    return this.billingService.getStats();
  }

  /**
   * Get bills by patient
   * @route GET /billing/patient/:patientId
   * @access Private (Admin/Staff/Patient)
   */
  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return this.billingService.findByPatient(patientId);
  }

  /**
   * Get overdue bills
   * @route GET /billing/overdue
   * @access Private (Admin/Staff)
   */
  @Get('overdue')
  async getOverdueBills() {
    return this.billingService.getOverdueBills();
  }

  /**
   * Get revenue by date range
   * @route GET /billing/revenue
   * @query startDate Start date
   * @query endDate End date
   * @access Private (Admin/Staff)
   */
  @Get('revenue')
  async getRevenueByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.billingService.getRevenueByDateRange(startDate, endDate);
  }

  /**
   * Get bill by ID
   * @route GET /billing/:id
   * @access Private (Admin/Staff/Patient)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.billingService.findById(id);
  }

  /**
   * Update bill
   * @route PUT /billing/:id
   * @access Private (Admin/Staff)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billingService.update(id, updateBillDto as any);
  }

  /**
   * Partial update bill
   * @route PATCH /billing/:id
   * @access Private (Admin/Staff)
   */
  @Patch(':id')
  async patchUpdate(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billingService.update(id, updateBillDto as any);
  }

  /**
   * Delete bill
   * @route DELETE /billing/:id
   * @access Private (Admin)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.billingService.delete(id);
  }

  /**
   * Process payment for bill
   * @route PATCH /billing/:id/pay
   * @access Private (Admin/Staff/Patient)
   */
  @Patch(':id/pay')
  async processPayment(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('method') method: string
  ) {
    return this.billingService.processPayment(id, { amount, method });
  }
}
