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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, BillStatus } from '../common/interfaces/api-response.interface';

/**
 * Billing Controller
 * Manages financial operations and bill generation in the NexCare system
 * Provides endpoints for bill CRUD operations and payment processing
 */
@ApiTags('Billing')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Get all bills with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all bills' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BillStatus })
  @ApiResponse({ status: 200, description: 'List of bills' })
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string
  ) {
    return this.billingService.findAll(patientId, status as any);
  }

  /**
   * Create new bill
   */
  @Post()
  @ApiOperation({ summary: 'Create a new bill' })
  @ApiResponse({ status: 201, description: 'Bill created successfully' })
  async create(@Body() createBillDto: CreateBillDto) {
    return this.billingService.create(createBillDto as any);
  }

  /**
   * Get bill statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get billing statistics' })
  @ApiResponse({ status: 200, description: 'Billing statistics retrieved' })
  async getStats() {
    return this.billingService.getStats();
  }

  /**
   * Get bills by patient
   */
  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get bills by patient ID' })
  @ApiResponse({ status: 200, description: 'List of patient bills' })
  async findByPatient(@Param('patientId') patientId: string) {
    return this.billingService.findByPatient(patientId);
  }

  /**
   * Get overdue bills
   */
  @Get('overdue')
  @ApiOperation({ summary: 'Get all overdue bills' })
  @ApiResponse({ status: 200, description: 'List of overdue bills' })
  async getOverdueBills() {
    return this.billingService.getOverdueBills();
  }

  /**
   * Get revenue by date range
   */
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue by date range' })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  @ApiResponse({ status: 200, description: 'Revenue statistics retrieved' })
  async getRevenueByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.billingService.getRevenueByDateRange(startDate, endDate);
  }

  /**
   * Get bill by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get bill by ID' })
  @ApiResponse({ status: 200, description: 'Bill details retrieved' })
  async findById(@Param('id') id: string) {
    return this.billingService.findById(id);
  }

  /**
   * Update bill
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update bill details' })
  @ApiResponse({ status: 200, description: 'Bill updated successfully' })
  async update(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billingService.update(id, updateBillDto as any);
  }

  /**
   * Partial update bill
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update bill details' })
  @ApiResponse({ status: 200, description: 'Bill updated successfully' })
  async patchUpdate(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billingService.update(id, updateBillDto as any);
  }

  /**
   * Delete bill
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bill' })
  @ApiResponse({ status: 200, description: 'Bill deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.billingService.delete(id);
  }

  /**
   * Process payment for bill
   */
  @Patch(':id/pay')
  @ApiOperation({ summary: 'Process payment for a bill' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto
  ) {
    return this.billingService.processPayment(id, { 
      amount: processPaymentDto.amount, 
      method: processPaymentDto.method 
    });
  }
}
