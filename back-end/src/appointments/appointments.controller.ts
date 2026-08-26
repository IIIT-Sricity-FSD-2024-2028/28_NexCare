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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AppointmentStatus } from '../common/interfaces/api-response.interface';

/**
 * Appointments Controller
 * Manages appointment scheduling and status tracking in the NexCare system.
 *
 * RBAC: staff/superuser/doctor manage all appointments. Patients may book and
 * view/cancel their OWN appointments only (enforced against req.user.patientId).
 */
@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.DOCTOR)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  private isPatient(req: any): boolean {
    return req?.user?.role === UserRole.PATIENT;
  }

  /** For a patient caller, verify the appointment belongs to them (else 403). */
  private async assertOwnsAppointment(req: any, id: string) {
    if (!this.isPatient(req)) return;
    const res: any = await this.appointmentsService.findById(id);
    if (res?.success && res.data && res.data.patientId !== req.user.patientId) {
      throw new ForbiddenException('You can only access your own appointments.');
    }
  }

  /**
   * Get all appointments with optional filtering
   */
  @Get()
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get all appointments (patients: only their own)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'department', required: false })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  async findAll(
    @Req() req: any,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('department') department?: string
  ) {
    // Patients are always scoped to their own appointments regardless of query.
    if (this.isPatient(req)) {
      patientId = req.user.patientId;
    }
    return this.appointmentsService.findAll(patientId, status as any, department);
  }

  /**
   * Create new appointment
   */
  @Post()
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.DOCTOR, UserRole.PATIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Book a new appointment' })
  @ApiResponse({ status: 200, description: 'Appointment booking result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Req() req: any, @Body() createAppointmentDto: CreateAppointmentDto) {
    const dto: any = { ...createAppointmentDto };
    // A patient can only book for themselves.
    if (this.isPatient(req)) {
      dto.patientId = req.user.patientId;
    }
    return this.appointmentsService.create(dto);
  }

  /**
   * Get appointment statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get appointment statistics' })
  @ApiResponse({ status: 200, description: 'Appointment statistics retrieved' })
  async getStats() {
    return this.appointmentsService.getStats();
  }

  /**
   * Get appointments by patient
   */
  @Get('patient/:patientId')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get appointments by patient ID (patients: own only)' })
  @ApiResponse({ status: 200, description: 'List of patient appointments' })
  async findByPatient(@Req() req: any, @Param('patientId') patientId: string) {
    if (this.isPatient(req) && patientId !== req.user.patientId) {
      throw new ForbiddenException('You can only view your own appointments.');
    }
    return this.appointmentsService.findByPatient(patientId);
  }

  /**
   * Get appointments by department
   */
  @Get('department/:department')
  @ApiOperation({ summary: 'Get appointments by department' })
  @ApiResponse({ status: 200, description: 'List of department appointments' })
  async findByDepartment(@Param('department') department: string) {
    return this.appointmentsService.findByDepartment(department);
  }

  /**
   * Get today's appointments
   */
  @Get('today')
  @ApiOperation({ summary: "Get today's appointments" })
  @ApiResponse({ status: 200, description: 'List of appointments for today' })
  async getTodayAppointments() {
    return this.appointmentsService.getTodayAppointments();
  }

  /**
   * Get appointment by ID
   */
  @Get(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get appointment by ID (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  async findById(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsAppointment(req, id);
    return this.appointmentsService.findById(id);
  }

  /**
   * Update appointment
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update appointment details' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  async update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto as any);
  }

  /**
   * Partial update appointment
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update appointment details' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  async patchUpdate(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto as any);
  }

  /**
   * Delete appointment
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.appointmentsService.delete(id);
  }

  /**
   * Confirm appointment
   */
  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment confirmed successfully' })
  async confirm(@Param('id') id: string) {
    return this.appointmentsService.confirm(id);
  }

  /**
   * Complete appointment
   */
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an appointment as completed' })
  @ApiResponse({ status: 200, description: 'Appointment completed successfully' })
  async complete(@Param('id') id: string) {
    return this.appointmentsService.complete(id);
  }

  /**
   * Cancel appointment
   */
  @Patch(':id/cancel')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Cancel an appointment (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  async cancel(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsAppointment(req, id);
    return this.appointmentsService.cancel(id);
  }
}
