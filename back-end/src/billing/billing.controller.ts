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
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiProduces } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, BillStatus } from '../common/interfaces/api-response.interface';
import { BillPdfService } from './bill-pdf.service';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { ResourceOwnershipGuard } from '../common/guards/resource-ownership.guard';

/**
 * Billing Controller
 * Manages financial operations and bill generation in the NexCare system.
 *
 * RBAC: staff/superuser manage bills. Patients may view and pay their OWN
 * bills only (enforced against req.user.patientId).
 */
@ApiTags('Billing')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly billPdfService: BillPdfService,
  ) {}

  private isPatient(req: any): boolean {
    return req?.user?.role === UserRole.PATIENT;
  }

  /** For a patient caller, verify the bill belongs to them (else 403). */
  private async assertOwnsBill(req: any, id: string) {
    if (!this.isPatient(req)) return;
    const res: any = await this.billingService.findById(id);
    if (res?.success && res.data && res.data.patientId !== req.user.patientId) {
      throw new ForbiddenException('You can only access your own bills.');
    }
  }

  /**
   * Get all bills with optional filtering
   */
  @Get()
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get all bills (patients: only their own)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BillStatus })
  @ApiResponse({ status: 200, description: 'List of bills' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Req() req: any,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string
  ) {
    if (this.isPatient(req)) {
      patientId = req.user.patientId;
    }
    return this.billingService.findAll(patientId, status as any);
  }

  /**
   * Create new bill
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new bill' })
  @ApiResponse({ status: 200, description: 'Bill creation result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async create(@Body() createBillDto: CreateBillDto) {
    return this.billingService.create(createBillDto as any);
  }

  /**
   * Get bill statistics
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get billing statistics' })
  @ApiResponse({ status: 200, description: 'Billing statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.billingService.getStats();
  }

  /**
   * Get bills by patient
   */
  @Get('patient/:patientId')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get bills by patient ID (patients: own only)' })
  @ApiResponse({ status: 200, description: 'List of patient bills' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByPatient(@Req() req: any, @Param('patientId') patientId: string) {
    if (this.isPatient(req) && patientId !== req.user.patientId) {
      throw new ForbiddenException('You can only view your own bills.');
    }
    return this.billingService.findByPatient(patientId);
  }

  /**
   * Get overdue bills
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
  @Get('overdue')
  @ApiOperation({ summary: 'Get all overdue bills' })
  @ApiResponse({ status: 200, description: 'List of overdue bills' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOverdueBills() {
    return this.billingService.getOverdueBills();
  }

  /**
   * Get revenue by date range
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue by date range' })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  @ApiResponse({ status: 200, description: 'Revenue statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRevenueByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.billingService.getRevenueByDateRange(startDate, endDate);
  }

  /**
   * Get a specific bill by ID
   */
  @Get(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get bill by ID (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Bill details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsBill(req, id);
    return this.billingService.findById(id);
  }

  /**
   * Download a specific bill as PDF
   */
  @Get(':id/pdf')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Download bill as a PDF tax invoice (patients: own only)' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'The rendered tax invoice',
    content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — bill belongs to another patient or hospital' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async downloadPdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    await this.assertOwnsBill(req, id);
    const response: any = await this.billingService.findById(id);
    if (!response?.data) {
      throw new ForbiddenException('Bill not found');
    }
    
    // Resource Ownership enforcement (cross-tenant check for staff)
    ResourceOwnershipGuard.assertSameHospital(req.user, response.data, 'Bill');

    const pdfBuffer = await this.billPdfService.generatePdf(response.data);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bill-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  /**
   * Update bill
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update bill details' })
  @ApiResponse({ status: 200, description: 'Bill updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async update(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billingService.update(id, updateBillDto as any);
  }

  /**
   * Partial update bill
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update bill details' })
  @ApiResponse({ status: 200, description: 'Bill updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async patchUpdate(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billingService.update(id, updateBillDto as any);
  }

  /**
   * Delete bill
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bill' })
  @ApiResponse({ status: 200, description: 'Bill deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async delete(@Param('id') id: string) {
    return this.billingService.delete(id);
  }

  /**
   * Process payment for bill
   */
  @Patch(':id/pay')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Process payment for a bill (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async processPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto
  ) {
    await this.assertOwnsBill(req, id);
    return this.billingService.processPayment(id, {
      amount: processPaymentDto.amount,
      method: processPaymentDto.method
    });
  }
}
