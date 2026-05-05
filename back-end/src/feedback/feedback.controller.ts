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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, FeedbackStatus } from '../common/interfaces/api-response.interface';

/**
 * Feedback Controller
 * Manages communication and feedback system in the NexCare system
 * Provides endpoints for feedback CRUD operations and status management
 */
@ApiTags('Feedback')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * Get all feedback with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all feedback' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: FeedbackStatus })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'List of feedback' })
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string
  ) {
    return this.feedbackService.findAll(patientId, status as any, category);
  }

  /**
   * Create new feedback
   */
  @Post()
  @ApiOperation({ summary: 'Submit new feedback' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  async create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto as any);
  }

  /**
   * Get feedback statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get feedback statistics' })
  @ApiResponse({ status: 200, description: 'Feedback statistics retrieved' })
  async getStats() {
    return this.feedbackService.getStats();
  }

  /**
   * Get feedback by patient
   */
  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get feedback by patient ID' })
  @ApiResponse({ status: 200, description: 'Patient feedback retrieved' })
  async findByPatient(@Param('patientId') patientId: string) {
    return this.feedbackService.findByPatient(patientId);
  }

  /**
   * Get feedback by category
   */
  @Get('category/:category')
  @ApiOperation({ summary: 'Get feedback by category' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved by category' })
  async findByCategory(@Param('category') category: string) {
    return this.feedbackService.findByCategory(category);
  }

  /**
   * Get feedback by rating
   */
  @Get('rating/:rating')
  @ApiOperation({ summary: 'Get feedback by rating (1-5)' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved by rating' })
  async findByRating(@Param('rating') rating: number) {
    return this.feedbackService.findByRating(rating);
  }

  /**
   * Get unresolved feedback
   */
  @Get('unresolved')
  @ApiOperation({ summary: 'Get all unresolved feedback' })
  @ApiResponse({ status: 200, description: 'Unresolved feedback retrieved' })
  async getUnresolvedFeedback() {
    return this.feedbackService.getUnresolvedFeedback();
  }

  /**
   * Get high priority feedback
   */
  @Get('high-priority')
  @ApiOperation({ summary: 'Get high priority feedback (low ratings)' })
  @ApiResponse({ status: 200, description: 'High priority feedback retrieved' })
  async getHighPriorityFeedback() {
    return this.feedbackService.getHighPriorityFeedback();
  }

  /**
   * Get feedback by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  @ApiResponse({ status: 200, description: 'Feedback details retrieved' })
  async findById(@Param('id') id: string) {
    return this.feedbackService.findById(id);
  }

  /**
   * Update feedback
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update feedback details' })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully' })
  async update(@Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, updateFeedbackDto as any);
  }

  /**
   * Partial update feedback
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update feedback details' })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully' })
  async patchUpdate(@Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, updateFeedbackDto as any);
  }

  /**
   * Delete feedback
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete feedback' })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.feedbackService.delete(id);
  }

  /**
   * Update feedback status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update feedback status' })
  @ApiResponse({ status: 200, description: 'Feedback status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.feedbackService.updateStatus(id, status as any);
  }
}
