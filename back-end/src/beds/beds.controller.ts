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
 * Manages hospital bed allocation and ward management in the NexCare system.
 * Staff are scoped to their own hospital; superuser sees all hospitals.
 */
@ApiTags('Beds')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  /** Hospital to scope queries to: undefined (all) for superuser, else the user's hospital. */
  private scopeHospitalId(req: any): string | undefined {
    const user = req?.user;
    return user?.role === UserRole.SUPERUSER ? undefined : user?.hospitalId;
  }

  /**
   * Get all beds with optional filtering
   */
  // Regional Officers get read-only oversight; the client scopes to one hospital.
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.REGIONAL_MANAGER)
  @Get()
  @ApiOperation({ summary: 'Get all beds' })
  @ApiQuery({ name: 'ward', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BedStatus })
  @ApiResponse({ status: 200, description: 'List of beds' })
  async findAll(@Req() req: any, @Query('ward') ward?: string, @Query('status') status?: string) {
    return this.bedsService.findAll(ward, status as any, this.scopeHospitalId(req));
  }

  /**
   * Create new bed
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new bed record' })
  @ApiResponse({ status: 200, description: 'Bed creation result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Req() req: any, @Body() createBedDto: CreateBedDto) {
    const hospitalId = this.scopeHospitalId(req) || (createBedDto as any).hospitalId;
    return this.bedsService.create({ ...(createBedDto as any), hospitalId });
  }

  /**
   * Get bed statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get bed statistics' })
  @ApiResponse({ status: 200, description: 'Bed statistics retrieved' })
  async getStats(@Req() req: any) {
    return this.bedsService.getStats(this.scopeHospitalId(req));
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
  @ApiResponse({ status: 400, description: 'Bad Request - typically due to illegal bed status transition from BedStatusChangeMiddleware (e.g. maintenance to occupied).' })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  async update(@Param('id') id: string, @Body() updateBedDto: UpdateBedDto) {
    return this.bedsService.update(id, updateBedDto as any);
  }

  /**
   * Partial update bed
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update bed details' })
  @ApiResponse({ status: 200, description: 'Bed updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - typically due to illegal bed status transition from BedStatusChangeMiddleware.' })
  @ApiResponse({ status: 404, description: 'Bed not found' })
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
  @ApiOperation({ summary: 'Allocate a bed to a patient (status becomes OCCUPIED)' })
  @ApiResponse({ status: 200, description: 'Bed allocated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - illegal transition if bed is not AVAILABLE or CRITICAL (e.g., MAINTENANCE -> OCCUPIED is rejected).' })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  async allocate(@Param('id') id: string, @Body() allocateBedDto: AllocateBedDto) {
    return this.bedsService.allocate(id, allocateBedDto.patientId);
  }

  /**
   * Release bed from patient
   */
  @Patch(':id/release')
  @ApiOperation({ summary: 'Release a bed from a patient (status becomes AVAILABLE)' })
  @ApiResponse({ status: 200, description: 'Bed released successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid if bed is already AVAILABLE or MAINTENANCE.' })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  async release(@Param('id') id: string) {
    return this.bedsService.release(id);
  }

  /**
   * Update bed status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update bed status (must follow valid state machine transitions)' })
  @ApiResponse({ status: 200, description: 'Bed status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - illegal transition, e.g., OCCUPIED -> MAINTENANCE without releasing first.' })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bedsService.updateStatus(id, status as any);
  }
}
