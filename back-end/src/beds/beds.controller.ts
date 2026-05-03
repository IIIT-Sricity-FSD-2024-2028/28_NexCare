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
import { BedsService } from './beds.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';

/**
 * Beds Controller
 * Manages hospital bed allocation and ward management in the NexCare system
 * Provides endpoints for bed CRUD operations and allocation management
 */
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  /**
   * Get all beds with optional filtering
   * @route GET /beds
   * @query ward Optional ward filter
   * @query status Optional status filter
   * @access Private (Admin/Staff)
   */
  @Get()
  async findAll(@Query('ward') ward?: string, @Query('status') status?: string) {
    return this.bedsService.findAll(ward, status as any);
  }

  /**
   * Create new bed
   * @route POST /beds
   * @access Private (Admin)
   */
  @Post()
  async create(@Body() createBedDto: CreateBedDto) {
    return this.bedsService.create(createBedDto as any);
  }

  /**
   * Get bed statistics
   * @route GET /beds/stats
   * @access Private (Admin/Staff)
   */
  @Get('stats/overview')
  async getStats() {
    return this.bedsService.getStats();
  }

  /**
   * Get beds by ward
   * @route GET /beds/ward/:ward
   * @access Private (Admin/Staff)
   */
  @Get('ward/:ward')
  async findByWard(@Param('ward') ward: string) {
    return this.bedsService.findByWard(ward);
  }

  /**
   * Get available beds
   * @route GET /beds/available
   * @access Private (Admin/Staff)
   */
  @Get('available')
  async getAvailableBeds() {
    return this.bedsService.getAvailableBeds();
  }

  /**
   * Get beds by patient
   * @route GET /beds/patient/:patient
   * @access Private (Admin/Staff)
   */
  @Get('patient/:patient')
  async findByPatient(@Param('patient') patient: string) {
    return this.bedsService.findByPatient(patient);
  }

  /**
   * Get occupancy by ward
   * @route GET /beds/occupancy
   * @access Private (Admin/Staff)
   */
  @Get('occupancy')
  async getOccupancyByWard() {
    return this.bedsService.getOccupancyByWard();
  }

  /**
   * Get bed by ID
   * @route GET /beds/:id
   * @access Private (Admin/Staff)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.bedsService.findById(id);
  }

  /**
   * Update bed
   * @route PUT /beds/:id
   * @access Private (Admin/Staff)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBedDto: UpdateBedDto) {
    return this.bedsService.update(id, updateBedDto as any);
  }

  /**
   * Partial update bed
   * @route PATCH /beds/:id
   * @access Private (Admin/Staff)
   */
  @Patch(':id')
  async patchUpdate(@Param('id') id: string, @Body() updateBedDto: UpdateBedDto) {
    return this.bedsService.update(id, updateBedDto as any);
  }

  /**
   * Delete bed
   * @route DELETE /beds/:id
   * @access Private (Admin)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.bedsService.delete(id);
  }

  /**
   * Allocate bed to patient
   * @route PATCH /beds/:id/allocate
   * @access Private (Admin/Staff)
   */
  @Patch(':id/allocate')
  async allocate(@Param('id') id: string, @Body('patient') patient: string) {
    return this.bedsService.allocate(id, patient);
  }

  /**
   * Release bed from patient
   * @route PATCH /beds/:id/release
   * @access Private (Admin/Staff)
   */
  @Patch(':id/release')
  async release(@Param('id') id: string) {
    return this.bedsService.release(id);
  }

  /**
   * Update bed status
   * @route PATCH /beds/:id/status
   * @access Private (Admin/Staff)
   */
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bedsService.updateStatus(id, status as any);
  }
}
