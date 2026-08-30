import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Delete, 
  Param, 
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto, UpdateLeaveDto } from './interfaces/leave.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, LeaveStatus } from '../common/interfaces/api-response.interface';
import { LeaveRequestGuard } from './guards/leave-request.guard';

/**
 * Leaves Controller
 * Manages doctor leave requests and approvals in the NexCare system
 * Provides endpoints for leave CRUD operations and management
 */
@ApiTags('Leaves')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.ADMINISTRATIVE_STAFF, UserRole.DOCTOR)
@Controller('leaves')
@UseGuards(LeaveRequestGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  /**
   * Get all leaves with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all leaves' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: LeaveStatus })
  @ApiResponse({ status: 200, description: 'List of leaves' })
  async findAll(
    @Query('doctorId') doctorId?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('status') status?: LeaveStatus
  ) {
    return this.leavesService.findAll(doctorId, hospitalId, status);
  }

  /**
   * Get calendar view of approved leaves
   */
  @Get('calendar')
  @ApiOperation({ summary: 'Get calendar view of approved leaves' })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Calendar view of approved leaves' })
  async getCalendarView(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.leavesService.getCalendarView(hospitalId, startDate, endDate);
  }

  /**
   * Get leave by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get leave by ID' })
  @ApiResponse({ status: 200, description: 'Leave details' })
  async findById(@Param('id') id: string) {
    return this.leavesService.findById(id);
  }

  /**
   * Create new leave request (doctor applies for leave)
   * Guard validates no overlapping approved leaves
   */
  @Post()
  @UseGuards(LeaveRequestGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply for leave' })
  @ApiResponse({ status: 200, description: 'Leave request submitted successfully' })
  @ApiResponse({ status: 409, description: 'Conflict - overlapping approved leave' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() createLeaveDto: CreateLeaveDto) {
    return this.leavesService.create(createLeaveDto);
  }

  /**
   * Update leave status (approve/reject)
   * Guard validates only hospital_manager or superuser can approve/reject
   */
  @Patch(':id')
  @UseGuards(LeaveRequestGuard)
  @ApiOperation({ summary: 'Approve or reject leave request' })
  @ApiResponse({ status: 200, description: 'Leave status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Leave not found' })
  async update(@Req() req: any, @Param('id') id: string, @Body() updateLeaveDto: UpdateLeaveDto) {
    if (!updateLeaveDto.approvedBy) {
      updateLeaveDto.approvedBy = req.user?.sub || req.user?.id;
    }
    return this.leavesService.update(id, updateLeaveDto);
  }

  /**
   * Delete leave request
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a leave request' })
  @ApiResponse({ status: 200, description: 'Leave deleted successfully' })
  @ApiResponse({ status: 404, description: 'Leave not found' })
  async delete(@Param('id') id: string) {
    return this.leavesService.delete(id);
  }
}
