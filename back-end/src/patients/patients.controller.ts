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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { VerifyInsuranceDto } from './dto/verify-insurance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Patients Controller
 * Manages patient records and profiles in the NexCare system.
 *
 * RBAC: staff/superuser have full access. Patients are granted access to a
 * small subset of routes (view/update their OWN record only) via method-level
 * @Roles, and ownership is enforced against req.user.patientId.
 */
@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /** Throw 403 if a patient is trying to touch a record that isn't their own. */
  private assertOwnRecord(req: any, id: string) {
    const user = req?.user;
    if (user?.role === UserRole.PATIENT && user?.patientId !== id) {
      throw new ForbiddenException('You can only access your own patient record.');
    }
  }

  /**
   * Get all patients with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by patient status' })
  @ApiResponse({ status: 200, description: 'List of patients' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@Query('status') status?: string) {
    return this.patientsService.findAll(status);
  }

  /**
   * Create new patient
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new patient record' })
  @ApiResponse({ status: 200, description: 'Patient creation result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto as any);
  }

  /**
   * Get patient statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get patient statistics' })
  @ApiResponse({ status: 200, description: 'Patient statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.patientsService.getStats();
  }

  /**
   * Search patients
   */
  @Get('search/:query')
  @ApiOperation({ summary: 'Search patients by name, email, or phone' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async search(@Param('query') query: string) {
    return this.patientsService.search(query);
  }

  /**
   * Get patients by blood group
   */
  @Get('blood-group/:bloodGroup')
  @ApiOperation({ summary: 'Get patients by blood group' })
  @ApiResponse({ status: 200, description: 'List of patients matching blood group' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByBloodGroup(@Param('bloodGroup') bloodGroup: string) {
    return this.patientsService.findByBloodGroup(bloodGroup);
  }

  /**
   * Get patients by age range
   */
  @Get('age-range')
  @ApiOperation({ summary: 'Get patients by age range' })
  @ApiQuery({ name: 'minAge', type: Number })
  @ApiQuery({ name: 'maxAge', type: Number })
  @ApiResponse({ status: 200, description: 'List of patients in age range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByAgeRange(@Query('minAge') minAge: number, @Query('maxAge') maxAge: number) {
    return this.patientsService.findByAgeRange(minAge, maxAge);
  }

  /**
   * Get patient by ID
   */
  @Get(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get patient by ID (patients: own record only)' })
  @ApiResponse({ status: 200, description: 'Patient details (check success field for not-found)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findById(@Req() req: any, @Param('id') id: string) {
    this.assertOwnRecord(req, id);
    return this.patientsService.findById(id);
  }

  /**
   * Update patient
   */
  @Put(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Update patient details (patients: own record only)' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async update(@Req() req: any, @Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    this.assertOwnRecord(req, id);
    return this.patientsService.update(id, updatePatientDto as any);
  }

  /**
   * Partial update patient
   */
  @Patch(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Partially update patient details (patients: own record only)' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async patchUpdate(@Req() req: any, @Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    this.assertOwnRecord(req, id);
    return this.patientsService.update(id, updatePatientDto as any);
  }

  /**
   * Delete patient
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a patient' })
  @ApiResponse({ status: 200, description: 'Patient deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async remove(@Param('id') id: string) {
    return this.patientsService.delete(id);
  }

  /**
   * Mock verify insurance
   */
  @Post(':id/verify-insurance')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
  @ApiOperation({
    summary: 'Record and mock-verify a patient insurance policy',
    description:
      'Stores the declared policy against the patient and stamps it mock_verified. ' +
      'No insurer is contacted — this is a mock verification.',
  })
  @ApiResponse({ status: 200, description: 'Insurance details submitted (mock verified)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async verifyInsurance(@Param('id') id: string, @Body() insuranceData: VerifyInsuranceDto) {
    return this.patientsService.verifyInsurance(id, insuranceData);
  }

  /**
   * Update patient status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update patient status' })
  @ApiResponse({ status: 200, description: 'Patient status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.patientsService.updateStatus(id, status);
  }
}
