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
import { UsersService } from './users.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Users Controller
 * Manages user accounts across all roles in the NexCare system
 * Provides endpoints for user CRUD operations and management
 */
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  /**
   * Get all users with optional filtering.
   *
   * A Regional Officer gets read-only oversight, scoped to the hospitals assigned
   * to them — they never see staff at hospitals they do not manage. Everyone else
   * on the allow-list sees the unscoped list, as before.
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.REGIONAL_MANAGER)
  @Get()
  @ApiOperation({ summary: 'Get all users (Regional Officers see only their hospitals)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(
    @Req() req: any,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.usersService.findAll(role as any, status as any);

    if (req.user?.role !== UserRole.REGIONAL_MANAGER || !result?.success) {
      return result;
    }

    const managedIds = await this.managedHospitalIds(req.user.id);
    return {
      ...result,
      data: (result.data || []).filter(
        (u: any) => u.hospitalId && managedIds.includes(u.hospitalId),
      ),
    };
  }

  /** Hospital ids assigned to a given regional manager. */
  private async managedHospitalIds(managerId: string): Promise<string[]> {
    const res: any = await this.hospitalsService.findAll();
    return (res?.data || [])
      .filter((h: any) => h.assignedManagerId === managerId)
      .map((h: any) => h.id);
  }

  /**
   * Create new user
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 200, description: 'User creation result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto as any);
  }

  /**
   * Get active doctors (available to patients for appointment booking)
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
  @Get('doctors')
  @ApiOperation({ summary: 'Get active doctors, optionally filtered by department' })
  @ApiQuery({ name: 'dept', required: false })
  @ApiResponse({ status: 200, description: 'Doctors retrieved successfully' })
  async findDoctors(@Query('dept') dept?: string) {
    return this.usersService.findDoctors(dept);
  }

  /**
   * Get user statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getStats() {
    return this.usersService.getStats();
  }

  /**
   * Get users by role
   */
  @Get('role/:role')
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findByRole(@Param('role') role: string) {
    return this.usersService.findByRole(role as any);
  }

  /**
   * Search users
   */
  @Get('search/:query')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Param('query') query: string) {
    return this.usersService.search(query);
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved (check success field for not-found)' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Update user
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User update result (check success field)' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto as any);
  }

  /**
   * Partial update user
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partial update user' })
  @ApiResponse({ status: 200, description: 'User update result (check success field)' })
  async patchUpdate(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto as any);
  }

  /**
   * Delete user
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deletion result (check success field)' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  /**
   * Update user status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, description: 'Status update result (check success field)' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateStatus(id, status as any);
  }
}
