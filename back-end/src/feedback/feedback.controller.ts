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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Feedback Controller
 * Manages communication and feedback system in the NexCare system
 * Provides endpoints for feedback CRUD operations and status management
 */
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * Get all feedback with optional filtering
   * @route GET /feedback
   * @query patientId Optional patient filter
   * @query status Optional status filter
   * @query category Optional category filter
   * @access Private (Admin/Staff/Patient)
   */
  @Get()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string
  ) {
    return this.feedbackService.findAll(patientId, status as any, category);
  }

  /**
   * Create new feedback
   * @route POST /feedback
   * @access Private (Admin/Staff/Patient)
   */
  @Post()
  async create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto as any);
  }

  /**
   * Get feedback statistics
   * @route GET /feedback/stats
   * @access Private (Admin/Staff)
   */
  @Get('stats/overview')
  async getStats() {
    return this.feedbackService.getStats();
  }

  /**
   * Get feedback by patient
   * @route GET /feedback/patient/:patientId
   * @access Private (Admin/Staff/Patient)
   */
  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return this.feedbackService.findByPatient(patientId);
  }

  /**
   * Get feedback by category
   * @route GET /feedback/category/:category
   * @access Private (Admin/Staff)
   */
  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.feedbackService.findByCategory(category);
  }

  /**
   * Get feedback by rating
   * @route GET /feedback/rating/:rating
   * @access Private (Admin/Staff)
   */
  @Get('rating/:rating')
  async findByRating(@Param('rating') rating: number) {
    return this.feedbackService.findByRating(rating);
  }

  /**
   * Get unresolved feedback
   * @route GET /feedback/unresolved
   * @access Private (Admin/Staff)
   */
  @Get('unresolved')
  async getUnresolvedFeedback() {
    return this.feedbackService.getUnresolvedFeedback();
  }

  /**
   * Get high priority feedback
   * @route GET /feedback/high-priority
   * @access Private (Admin/Staff)
   */
  @Get('high-priority')
  async getHighPriorityFeedback() {
    return this.feedbackService.getHighPriorityFeedback();
  }

  /**
   * Get feedback by ID
   * @route GET /feedback/:id
   * @access Private (Admin/Staff/Patient)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.feedbackService.findById(id);
  }

  /**
   * Update feedback
   * @route PUT /feedback/:id
   * @access Private (Admin/Staff)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, updateFeedbackDto as any);
  }

  /**
   * Partial update feedback
   * @route PATCH /feedback/:id
   * @access Private (Admin/Staff)
   */
  @Patch(':id')
  async patchUpdate(@Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, updateFeedbackDto as any);
  }

  /**
   * Delete feedback
   * @route DELETE /feedback/:id
   * @access Private (Admin)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.feedbackService.delete(id);
  }

  /**
   * Update feedback status
   * @route PATCH /feedback/:id/status
   * @access Private (Admin/Staff)
   */
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.feedbackService.updateStatus(id, status as any);
  }
}
