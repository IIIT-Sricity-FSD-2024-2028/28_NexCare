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
import { BedsService } from './beds.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { AllocateBedDto } from './dto/allocate-bed.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, BedStatus } from '../common/interfaces/api-response.interface';

/**
 * Beds Controller
 * Manages hospital bed allocation and ward management in the NexCare system
 * Provides endpoints for bed CRUD operations and allocation management
 */
@ApiTags('Beds')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  /**
   * Get all beds with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all beds' })
  @ApiQuery({ name: 'ward', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BedStatus })
  @ApiResponse({ status: 200, description: 'List of beds' })
  async findAll(@Query('ward') ward?: string, @Query('status') status?: string) {
    return this.bedsService.findAll(ward, status as any);
  }

  /**
   * Create new bed
   */
  @Post()
  @ApiOperation({ summary: 'Create a new bed record' })
  @ApiResponse({ status: 201, description: 'Bed created successfully' })
  async create(@Body() createBedDto: CreateBedDto) {
    return this.bedsService.create(createBedDto as any);
  }

  /**
   * Get bed statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get bed statistics' })
  @ApiResponse({ status: 200, description: 'Bed statistics retrieved' })
  async getStats() {
    return this.bedsService.getStats();
  }

  /**
   * Get beds by ward
   */
  @Get('ward/:ward')
  @ApiOperation({ summary: 'Get beds by ward' })
  @ApiResponse({ status: 200, description: 'List of ward beds retrieved' })
  async findByWard(@Param('ward') ward: string) {
    return this.bedsService.findByWard(ward);
  }

  /**
   * Get available beds
   */
  @Get('available')
  @ApiOperation({ summary: 'Get all available beds' })
  @ApiResponse({ status: 200, description: 'List of available beds' })
  async getAvailableBeds() {
    return this.bedsService.getAvailableBeds();
  }

  /**
   * Get beds by patient
   */
  @Get('patient/:patient')
  @ApiOperation({ summary: 'Get bed by patient name' })
  @ApiResponse({ status: 200, description: 'Bed retrieved' })
  async findByPatient(@Param('patient') patient: string) {
    return this.bedsService.findByPatient(patient);
  }

  /**
   * Get occupancy by ward
   */
  @Get('occupancy')
  @ApiOperation({ summary: 'Get bed occupancy statistics by ward' })
  @ApiResponse({ status: 200, description: 'Occupancy statistics retrieved' })
  async getOccupancyByWard() {
    return this.bedsService.getOccupancyByWard();
  }

  /**
   * Get bed by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get bed by ID' })
  @ApiResponse({ status: 200, description: 'Bed details retrieved' })
  async findById(@Param('id') id: string) {
    return this.bedsService.findById(id);
  }

  /**
   * Update bed
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update bed details' })
  @ApiResponse({ status: 200, description: 'Bed updated successfully' })
  async update(@Param('id') id: string, @Body() updateBedDto: UpdateBedDto) {
    return this.bedsService.update(id, updateBedDto as any);
  }

  /**
   * Partial update bed
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update bed details' })
  @ApiResponse({ status: 200, description: 'Bed updated successfully' })
  async patchUpdate(@Param('id') id: string, @Body() updateBedDto: UpdateBedDto) {
    return this.bedsService.update(id, updateBedDto as any);
  }

  /**
   * Delete bed
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bed' })
  @ApiResponse({ status: 200, description: 'Bed deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.bedsService.delete(id);
  }

  /**
   * Allocate bed to patient
   */
  @Patch(':id/allocate')
  @ApiOperation({ summary: 'Allocate a bed to a patient' })
  @ApiResponse({ status: 200, description: 'Bed allocated successfully' })
  async allocate(@Param('id') id: string, @Body() allocateBedDto: AllocateBedDto) {
    return this.bedsService.allocate(id, allocateBedDto.patientId);
  }

  /**
   * Release bed from patient
   */
  @Patch(':id/release')
  @ApiOperation({ summary: 'Release a bed from a patient' })
  @ApiResponse({ status: 200, description: 'Bed released successfully' })
  async release(@Param('id') id: string) {
    return this.bedsService.release(id);
  }

  /**
   * Update bed status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update bed status' })
  @ApiResponse({ status: 200, description: 'Bed status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bedsService.updateStatus(id, status as any);
  }
}
