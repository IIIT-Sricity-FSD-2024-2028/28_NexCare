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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

/**
 * Appointments Controller
 * Manages appointment scheduling and status tracking in the NexCare system
 * Provides endpoints for appointment CRUD operations and management
 */
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Get all appointments with optional filtering
   * @route GET /appointments
   * @query patientId Optional patient filter
   * @query status Optional status filter
   * @query department Optional department filter
   * @access Private (Admin/Staff/Patient)
   */
  @Get()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('department') department?: string
  ) {
    return this.appointmentsService.findAll(patientId, status as any, department);
  }

  /**
   * Create new appointment
   * @route POST /appointments
   * @access Private (Admin/Staff/Patient)
   */
  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto as any);
  }

  /**
   * Get appointment statistics
   * @route GET /appointments/stats
   * @access Private (Admin/Staff)
   */
  @Get('stats/overview')
  async getStats() {
    return this.appointmentsService.getStats();
  }

  /**
   * Get appointments by patient
   * @route GET /appointments/patient/:patientId
   * @access Private (Admin/Staff/Patient)
   */
  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return this.appointmentsService.findByPatient(patientId);
  }

  /**
   * Get appointments by department
   * @route GET /appointments/department/:department
   * @access Private (Admin/Staff)
   */
  @Get('department/:department')
  async findByDepartment(@Param('department') department: string) {
    return this.appointmentsService.findByDepartment(department);
  }

  /**
   * Get today's appointments
   * @route GET /appointments/today
   * @access Private (Admin/Staff)
   */
  @Get('today')
  async getTodayAppointments() {
    return this.appointmentsService.getTodayAppointments();
  }

  /**
   * Get appointment by ID
   * @route GET /appointments/:id
   * @access Private (Admin/Staff/Patient)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  /**
   * Update appointment
   * @route PUT /appointments/:id
   * @access Private (Admin/Staff)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto as any);
  }

  /**
   * Partial update appointment
   * @route PATCH /appointments/:id
   * @access Private (Admin/Staff)
   */
  @Patch(':id')
  async patchUpdate(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto as any);
  }

  /**
   * Delete appointment
   * @route DELETE /appointments/:id
   * @access Private (Admin/Staff)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.appointmentsService.delete(id);
  }

  /**
   * Confirm appointment
   * @route PATCH /appointments/:id/confirm
   * @access Private (Admin/Staff)
   */
  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.appointmentsService.confirm(id);
  }

  /**
   * Complete appointment
   * @route PATCH /appointments/:id/complete
   * @access Private (Admin/Staff)
   */
  @Patch(':id/complete')
  async complete(@Param('id') id: string) {
    return this.appointmentsService.complete(id);
  }

  /**
   * Cancel appointment
   * @route PATCH /appointments/:id/cancel
   * @access Private (Admin/Staff/Patient)
   */
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}
