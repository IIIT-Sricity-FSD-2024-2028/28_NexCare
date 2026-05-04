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
import { AmbulanceService } from './ambulance.service';
import { CreateAmbulanceRequestDto } from './dto/create-request.dto';
import { UpdateAmbulanceRequestDto } from './dto/update-request.dto';
import { DtoValidatorUtil } from '../common/validation/dto-validator.util';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Ambulance Controller
 * Manages emergency services and ambulance requests in the NexCare system
 * Provides endpoints for ambulance CRUD operations and status management
 */
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.AMBULANCE, UserRole.PATIENT)
@Controller('ambulance')
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  /**
   * Get all ambulance requests with optional filtering
   * @route GET /ambulance
   * @query patientId Optional patient filter
   * @query status Optional status filter
   * @access Private (Admin/Staff/Ambulance/Patient)
   */
  @Get()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string
  ) {
    return this.ambulanceService.findAll(patientId, status as any);
  }

  /**
   * Create new ambulance request
   * @route POST /ambulance
   * @access Private (Admin/Staff/Patient)
   */
  @Post()
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
   * @route GET /ambulance/stats
   * @access Private (Admin/Staff)
   */
  @Get('stats/overview')
  async getStats() {
    return this.ambulanceService.getStats();
  }

  /**
   * Get requests by patient
   * @route GET /ambulance/patient/:patientId
   * @access Private (Admin/Staff/Patient)
   */
  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return this.ambulanceService.findByPatient(patientId);
  }

  /**
   * Get active requests
   * @route GET /ambulance/active
   * @access Private (Admin/Staff/Ambulance)
   */
  @Get('active')
  async getActiveRequests() {
    return this.ambulanceService.getActiveRequests();
  }

  /**
   * Get requests by assigned staff
   * @route GET /ambulance/assigned/:assignedTo
   * @access Private (Admin/Staff/Ambulance)
   */
  @Get('assigned/:assignedTo')
  async findByAssignedStaff(@Param('assignedTo') assignedTo: string) {
    return this.ambulanceService.findByAssignedStaff(assignedTo);
  }

  /**
   * Get ambulance request by ID
   * @route GET /ambulance/:id
   * @access Private (Admin/Staff/Ambulance/Patient)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ambulanceService.findById(id);
  }

  /**
   * Update ambulance request
   * @route PUT /ambulance/:id
   * @access Private (Admin/Staff/Ambulance)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRequestDto: UpdateAmbulanceRequestDto) {
    return this.ambulanceService.update(id, updateRequestDto as any);
  }

  /**
   * Partial update ambulance request
   * @route PATCH /ambulance/:id
   * @access Private (Admin/Staff/Ambulance)
   */
  @Patch(':id')
  async patchUpdate(@Param('id') id: string, @Body() updateRequestDto: UpdateAmbulanceRequestDto) {
    return this.ambulanceService.update(id, updateRequestDto as any);
  }

  /**
   * Delete ambulance request
   * @route DELETE /ambulance/:id
   * @access Private (Admin)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.ambulanceService.delete(id);
  }

  /**
   * Dispatch ambulance
   * @route PATCH /ambulance/:id/dispatch
   * @access Private (Admin/Staff/Ambulance)
   */
  @Patch(':id/dispatch')
  async dispatch(@Param('id') id: string, @Body('assignedTo') assignedTo?: string) {
    return this.ambulanceService.dispatch(id, assignedTo);
  }

  /**
   * Complete ambulance request
   * @route PATCH /ambulance/:id/complete
   * @access Private (Admin/Staff/Ambulance)
   */
  @Patch(':id/complete')
  async complete(@Param('id') id: string) {
    return this.ambulanceService.complete(id);
  }

  /**
   * Update request status
   * @route PATCH /ambulance/:id/status
   * @access Private (Admin/Staff/Ambulance)
   */
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ambulanceService.updateStatus(id, status as any);
  }
}
