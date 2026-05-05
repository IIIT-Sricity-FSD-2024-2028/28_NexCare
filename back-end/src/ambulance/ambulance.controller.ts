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
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AmbulanceService } from './ambulance.service';
import { CreateAmbulanceRequestDto } from './dto/create-request.dto';
import { UpdateAmbulanceRequestDto } from './dto/update-request.dto';
import { DispatchAmbulanceDto } from './dto/dispatch-ambulance.dto';
import { DtoValidatorUtil } from '../common/validation/dto-validator.util';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AmbulanceStatus } from '../common/interfaces/api-response.interface';

/**
 * Ambulance Controller
 * Manages emergency services and ambulance requests in the NexCare system
 * Provides endpoints for ambulance CRUD operations and status management
 */
@ApiTags('Ambulance')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.AMBULANCE, UserRole.PATIENT)
@Controller('ambulance')
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  /**
   * Get all ambulance requests with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all ambulance requests' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AmbulanceStatus })
  @ApiResponse({ status: 200, description: 'List of ambulance requests' })
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string
  ) {
    return this.ambulanceService.findAll(patientId, status as any);
  }

  /**
   * Create new ambulance request
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create an ambulance request' })
  @ApiResponse({ status: 200, description: 'Request creation result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() createRequestDto: CreateAmbulanceRequestDto) {
    // Validate DTO before processing
    const validation = DtoValidatorUtil.validateAmbulanceRequest(createRequestDto);
    
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validation.errors,
        fieldErrors: validation.fieldErrors
      });
    }
    
    return this.ambulanceService.create(createRequestDto as any);
  }

  /**
   * Get ambulance statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get ambulance statistics' })
  @ApiResponse({ status: 200, description: 'Ambulance statistics retrieved' })
  async getStats() {
    return this.ambulanceService.getStats();
  }

  /**
   * Get requests by patient
   */
  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get ambulance requests by patient ID' })
  @ApiResponse({ status: 200, description: 'Patient requests retrieved' })
  async findByPatient(@Param('patientId') patientId: string) {
    return this.ambulanceService.findByPatient(patientId);
  }

  /**
   * Get active requests
   */
  @Get('active')
  @ApiOperation({ summary: 'Get all active ambulance requests' })
  @ApiResponse({ status: 200, description: 'Active requests retrieved' })
  async getActiveRequests() {
    return this.ambulanceService.getActiveRequests();
  }

  /**
   * Get requests by assigned staff
   */
  @Get('assigned/:assignedTo')
  @ApiOperation({ summary: 'Get ambulance requests by assigned staff' })
  @ApiResponse({ status: 200, description: 'Staff assigned requests retrieved' })
  async findByAssignedStaff(@Param('assignedTo') assignedTo: string) {
    return this.ambulanceService.findByAssignedStaff(assignedTo);
  }

  /**
   * Get ambulance request by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get ambulance request by ID' })
  @ApiResponse({ status: 200, description: 'Request details retrieved' })
  async findById(@Param('id') id: string) {
    return this.ambulanceService.findById(id);
  }

  /**
   * Update ambulance request
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an ambulance request' })
  @ApiResponse({ status: 200, description: 'Request updated successfully' })
  async update(@Param('id') id: string, @Body() updateRequestDto: UpdateAmbulanceRequestDto) {
    return this.ambulanceService.update(id, updateRequestDto as any);
  }

  /**
   * Partial update ambulance request
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an ambulance request' })
  @ApiResponse({ status: 200, description: 'Request updated successfully' })
  async patchUpdate(@Param('id') id: string, @Body() updateRequestDto: UpdateAmbulanceRequestDto) {
    return this.ambulanceService.update(id, updateRequestDto as any);
  }

  /**
   * Delete ambulance request
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an ambulance request' })
  @ApiResponse({ status: 200, description: 'Request deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.ambulanceService.delete(id);
  }

  /**
   * Dispatch ambulance
   */
  @Patch(':id/dispatch')
  @ApiOperation({ summary: 'Dispatch an ambulance' })
  @ApiResponse({ status: 200, description: 'Ambulance dispatched successfully' })
  async dispatch(@Param('id') id: string, @Body() dispatchDto: DispatchAmbulanceDto) {
    return this.ambulanceService.dispatch(id, dispatchDto.assignedTo);
  }

  /**
   * Complete ambulance request
   */
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an ambulance request as completed' })
  @ApiResponse({ status: 200, description: 'Request completed successfully' })
  async complete(@Param('id') id: string) {
    return this.ambulanceService.complete(id);
  }

  /**
   * Update request status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ambulance request status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ambulanceService.updateStatus(id, status as any);
  }
}
