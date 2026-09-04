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
  NotFoundException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, FeedbackStatus } from '../common/interfaces/api-response.interface';
import { HospitalsService } from '../hospitals/hospitals.service';

/**
 * Feedback Controller
 * Manages communication and feedback system in the NexCare system.
 *
 * RBAC: staff/superuser triage and resolve all feedback. Patients may submit
 * feedback and view their OWN submissions only (enforced against
 * req.user.patientId).
 */
@ApiTags('Feedback')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  private isPatient(req: any): boolean {
    return req?.user?.role === UserRole.PATIENT;
  }

  /**
   * Get all feedback with optional filtering
   */
  @Get()
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
  @ApiOperation({ summary: 'Get all feedback (patients: only their own, hospital staff: their hospital only)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: FeedbackStatus })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiResponse({ status: 200, description: 'List of feedback' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Req() req: any,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('hospitalId') hospitalId?: string
  ) {
    if (this.isPatient(req)) {
      patientId = req.user.patientId || req.user.id;
    }
    // If Hospital Manager or Administrative Staff, strictly scope to their hospital
    if (req?.user?.role === UserRole.HOSPITAL_MANAGER || req?.user?.role === UserRole.ADMINISTRATIVE_STAFF) {
      hospitalId = req.user.hospitalId || 'H001';
    }
    if (req?.user?.role === UserRole.REGIONAL_MANAGER) {
      return this.feedbackService.findForRegionalManager(req.user.id, status as any, category, hospitalId);
    }
    return this.feedbackService.findAll(patientId, status as any, category, hospitalId);
  }

  /**
   * Create new feedback
   */
  @Post()
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit new feedback' })
  @ApiResponse({ status: 200, description: 'Feedback submission result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async create(@Req() req: any, @Body() createFeedbackDto: CreateFeedbackDto) {
    const dto: any = { ...createFeedbackDto };
    if (this.isPatient(req)) {
      dto.patientId = req.user.patientId;
    }
    return this.feedbackService.create(dto);
  }

  /**
   * Regional manager view of patient complaints across assigned hospitals.
   */
  @Get('regional')
  @Roles(UserRole.REGIONAL_MANAGER)
  @ApiOperation({ summary: 'Get feedback for hospitals assigned to the regional manager' })
  @ApiQuery({ name: 'status', required: false, enum: FeedbackStatus })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findRegional(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('hospitalId') hospitalId?: string,
  ) {
    const hospitalIds = this.hospitalsService
      .getHospitalsForManager(req.user.id)
      .map(h => h.id);
    return this.feedbackService.findForRegionalManager(
      hospitalIds,
      status as FeedbackStatus,
      category,
      hospitalId,
    );
  }

  /**
   * Get feedback statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get feedback statistics' })
  @ApiResponse({ status: 200, description: 'Feedback statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.feedbackService.getStats();
  }

  /**
   * Get feedback by patient
   */
  @Get('patient/:patientId')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get feedback by patient ID (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Patient feedback retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByPatient(@Req() req: any, @Param('patientId') patientId: string) {
    if (this.isPatient(req) && patientId !== req.user.patientId) {
      throw new ForbiddenException('You can only view your own feedback.');
    }
    return this.feedbackService.findByPatient(patientId);
  }

  /**
   * Get feedback by category
   */
  @Get('category/:category')
  @ApiOperation({ summary: 'Get feedback by category' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved by category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByCategory(@Param('category') category: string) {
    return this.feedbackService.findByCategory(category);
  }

  /**
   * Get feedback by rating
   */
  @Get('rating/:rating')
  @ApiOperation({ summary: 'Get feedback by rating (1-5)' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved by rating' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByRating(@Param('rating') rating: number) {
    return this.feedbackService.findByRating(rating);
  }

  /**
   * Get unresolved feedback
   */
  @Get('unresolved')
  @ApiOperation({ summary: 'Get all unresolved feedback' })
  @ApiResponse({ status: 200, description: 'Unresolved feedback retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUnresolvedFeedback() {
    return this.feedbackService.getUnresolvedFeedback();
  }

  /**
   * Get high priority feedback
   */
  @Get('high-priority')
  @ApiOperation({ summary: 'Get high priority feedback (low ratings)' })
  @ApiResponse({ status: 200, description: 'High priority feedback retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getHighPriorityFeedback() {
    return this.feedbackService.getHighPriorityFeedback();
  }

  /**
   * Get feedback by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  @ApiResponse({ status: 200, description: 'Feedback details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findById(@Param('id') id: string) {
    return this.feedbackService.findById(id);
  }

  /**
   * Update feedback
   */
  @Put(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Update feedback details (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async update(@Req() req: any, @Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    await this.assertMayEdit(req, id);
    return this.feedbackService.update(id, updateFeedbackDto as any);
  }

  /**
   * Partial update feedback
   */
  @Patch(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Partially update feedback details (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async patchUpdate(@Req() req: any, @Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    await this.assertMayEdit(req, id);
    return this.feedbackService.update(id, updateFeedbackDto as any);
  }

  /**
   * Delete feedback
   */
  @Delete(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @ApiOperation({ summary: 'Delete feedback (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.assertMayEdit(req, id);
    return this.feedbackService.delete(id);
  }

  /**
   * A patient may amend or withdraw their OWN submission and nothing else.
   *
   * The patient portal has always shown Edit and Delete buttons on the
   * submissions list, but `@Put`, `@Patch` and `@Delete` inherited the
   * class-level roles (superuser, administrative_staff), so both buttons
   * returned 403 for the only people who ever saw them. Adding `PATIENT` to
   * the role list alone would have let any patient edit anybody's feedback,
   * so ownership is checked here rather than trusted from the request.
   */
  private async assertMayEdit(req: any, id: string) {
    if (!this.isPatient(req)) return;

    const existing: any = await this.feedbackService.findById(id);
    const row = existing?.data ?? existing;
    if (!row || !row.id) {
      throw new NotFoundException(`Feedback ${id} was not found.`);
    }
    if (row.patientId !== req.user?.patientId) {
      throw new ForbiddenException('You can only change your own feedback.');
    }
  }

  /**
   * Update feedback status
   */
  @Patch(':id/status')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.REGIONAL_MANAGER)
  @ApiOperation({ summary: 'Update feedback status' })
  @ApiResponse({ status: 200, description: 'Feedback status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.feedbackService.updateStatus(id, status as any);
  }
}
