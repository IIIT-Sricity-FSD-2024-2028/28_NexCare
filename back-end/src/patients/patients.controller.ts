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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Patients Controller
 * Manages patient records and profiles in the NexCare system
 * Provides endpoints for patient CRUD operations and management
 */
@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Get all patients with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by patient status' })
  @ApiResponse({ status: 200, description: 'List of patients' })
  async findAll(@Query('status') status?: string) {
    return this.patientsService.findAll(status);
  }

  /**
   * Create new patient
   */
  @Post()
  @ApiOperation({ summary: 'Create a new patient record' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  async create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto as any);
  }

  /**
   * Get patient statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get patient statistics' })
  @ApiResponse({ status: 200, description: 'Patient statistics retrieved' })
  async getStats() {
    return this.patientsService.getStats();
  }

  /**
   * Search patients
   */
  @Get('search/:query')
  @ApiOperation({ summary: 'Search patients by name, email, or phone' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Param('query') query: string) {
    return this.patientsService.search(query);
  }

  /**
   * Get patients by blood group
   */
  @Get('blood-group/:bloodGroup')
  @ApiOperation({ summary: 'Get patients by blood group' })
  @ApiResponse({ status: 200, description: 'List of patients matching blood group' })
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
  async findByAgeRange(@Query('minAge') minAge: number, @Query('maxAge') maxAge: number) {
    return this.patientsService.findByAgeRange(minAge, maxAge);
  }

  /**
   * Get patient by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({ status: 200, description: 'Patient details retrieved' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findById(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  /**
   * Update patient
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update patient details' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  async update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto as any);
  }

  /**
   * Partial update patient
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update patient details' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  async patchUpdate(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto as any);
  }

  /**
   * Delete patient
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a patient record' })
  @ApiResponse({ status: 200, description: 'Patient deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.patientsService.delete(id);
  }

  /**
   * Update patient status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update patient status' })
  @ApiResponse({ status: 200, description: 'Patient status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.patientsService.updateStatus(id, status);
  }
}
