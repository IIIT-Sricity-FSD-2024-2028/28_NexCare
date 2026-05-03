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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

/**
 * Patients Controller
 * Manages patient records and profiles in the NexCare system
 * Provides endpoints for patient CRUD operations and management
 */
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Get all patients with optional filtering
   * @route GET /patients
   * @query status Optional status filter
   * @access Private (Admin/Staff)
   */
  @Get()
  async findAll(@Query('status') status?: string) {
    return this.patientsService.findAll(status);
  }

  /**
   * Create new patient
   * @route POST /patients
   * @access Private (Admin/Staff)
   */
  @Post()
  async create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto as any);
  }

  /**
   * Get patient statistics
   * @route GET /patients/stats
   * @access Private (Admin/Staff)
   */
  @Get('stats/overview')
  async getStats() {
    return this.patientsService.getStats();
  }

  /**
   * Search patients
   * @route GET /patients/search/:query
   * @access Private (Admin/Staff)
   */
  @Get('search/:query')
  async search(@Param('query') query: string) {
    return this.patientsService.search(query);
  }

  /**
   * Get patients by blood group
   * @route GET /patients/blood-group/:bloodGroup
   * @access Private (Admin/Staff)
   */
  @Get('blood-group/:bloodGroup')
  async findByBloodGroup(@Param('bloodGroup') bloodGroup: string) {
    return this.patientsService.findByBloodGroup(bloodGroup);
  }

  /**
   * Get patients by age range
   * @route GET /patients/age-range
   * @query minAge Minimum age
   * @query maxAge Maximum age
   * @access Private (Admin/Staff)
   */
  @Get('age-range')
  async findByAgeRange(@Query('minAge') minAge: number, @Query('maxAge') maxAge: number) {
    return this.patientsService.findByAgeRange(minAge, maxAge);
  }

  /**
   * Get patient by ID
   * @route GET /patients/:id
   * @access Private (Admin/Staff/Patient)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  /**
   * Update patient
   * @route PUT /patients/:id
   * @access Private (Admin/Staff/Patient)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto as any);
  }

  /**
   * Partial update patient
   * @route PATCH /patients/:id
   * @access Private (Admin/Staff/Patient)
   */
  @Patch(':id')
  async patchUpdate(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto as any);
  }

  /**
   * Delete patient
   * @route DELETE /patients/:id
   * @access Private (Admin)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.patientsService.delete(id);
  }

  /**
   * Update patient status
   * @route PATCH /patients/:id/status
   * @access Private (Admin/Staff)
   */
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.patientsService.updateStatus(id, status);
  }
}
