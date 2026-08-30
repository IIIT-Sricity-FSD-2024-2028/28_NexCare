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
import { UsersService } from './users.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Users Controller
 * Manages user accounts across all roles in the NexCare system
 * Enforces hospital-level and regional scoping
 */
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  /**
   * Get all users with optional filtering.
   * Scoped by role:
   *  - Superuser: sees all
   *  - Regional Officer: sees staff in their assigned region
   *  - Hospital Manager: sees staff ONLY for their own hospital
   */
  @Get()
  @ApiOperation({ summary: 'Get all users (Scoped by caller role and hospital)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(
    @Req() req: any,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('hospitalId') hospitalIdQuery?: string,
  ) {
    const result = await this.usersService.findAll(role as any, status as any);
    if (!result?.success || !Array.isArray(result.data)) {
      return result;
    }

    const caller = req.user;

    // Hospital Manager scope: strictly their own hospital
    if (caller?.role === UserRole.HOSPITAL_MANAGER) {
      if (hospitalIdQuery && caller.hospitalId && hospitalIdQuery !== caller.hospitalId) {
        throw new ForbiddenException(
          `Cross-hospital access denied. You can only view staff for your assigned hospital (${caller.hospitalId}).`
        );
      }
      return {
        ...result,
        data: result.data.filter((u: any) => u.hospitalId === caller.hospitalId),
      };
    }

    // Regional Officer scope: hospitals in their region
    if (caller?.role === UserRole.REGIONAL_MANAGER) {
      const managedIds = await this.managedHospitalIds(caller.id);
      return {
        ...result,
        data: result.data.filter(
          (u: any) => u.hospitalId && managedIds.includes(u.hospitalId),
        ),
      };
    }

    // Explicit hospital query filter for superuser / other callers
    if (hospitalIdQuery) {
      return {
        ...result,
        data: result.data.filter((u: any) => u.hospitalId === hospitalIdQuery),
      };
    }

    return result;
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
   * Hospital Managers can ONLY register Doctors, Administrative Staff, and Ambulance Staff for their own hospital.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new user / staff member' })
  @ApiResponse({ status: 200, description: 'User creation result' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - role or hospital scope violation' })
  async create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    const caller = req.user;

    if (caller?.role === UserRole.HOSPITAL_MANAGER) {
      // Disallow creating Superuser, Regional Officer, or another Hospital Manager
      const forbiddenRoles = [UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER, UserRole.HOSPITAL_MANAGER];
      if (forbiddenRoles.includes(createUserDto.role)) {
        throw new ForbiddenException(
          'Hospital Managers are not permitted to create Super Users, Regional Officers, or other Hospital Managers.',
        );
      }

      // Automatically force the hospitalId and region to the manager's assigned hospital
      createUserDto.hospitalId = caller.hospitalId;
      if (!createUserDto.hospitalName && caller.hospitalName) {
        createUserDto.hospitalName = caller.hospitalName;
      }
      if (!createUserDto.regionId && caller.regionId) {
        createUserDto.regionId = caller.regionId;
      }
    }

    return this.usersService.create(createUserDto as any);
  }

  /**
   * Preview auto-generated staff email
   */
  @Get('preview-email')
  @ApiOperation({ summary: 'Preview auto-generated unique staff email' })
  @ApiQuery({ name: 'name', required: true })
  previewEmail(@Query('name') name: string) {
    const email = this.usersService.generateStaffEmail(name || '');
    return { success: true, data: { email } };
  }

  /**
   * Get active doctors (available to patients for appointment booking)
   */
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
  @Get('doctors')
  @ApiOperation({ summary: 'Get active doctors, optionally filtered by department' })
  @ApiQuery({ name: 'dept', required: false })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiResponse({ status: 200, description: 'Doctors retrieved successfully' })
  async findDoctors(@Req() req: any, @Query('dept') dept?: string, @Query('hospitalId') hospitalId?: string) {
    const caller = req.user;
    const targetHospitalId = (caller?.role === UserRole.HOSPITAL_MANAGER) ? caller.hospitalId : hospitalId;
    const res: any = await this.usersService.findDoctors(dept);
    
    if (targetHospitalId && res?.success && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.filter((d: any) => !d.hospitalId || d.hospitalId === targetHospitalId),
      };
    }
    return res;
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
  @ApiResponse({ status: 200, description: 'User retrieved' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const caller = req.user;
    const userRes: any = await this.usersService.findById(id);
    
    if (caller?.role === UserRole.HOSPITAL_MANAGER && userRes?.success && userRes.data) {
      if (userRes.data.hospitalId && userRes.data.hospitalId !== caller.hospitalId) {
        throw new ForbiddenException('Cross-hospital access denied. You can only view staff in your hospital.');
      }
    }
    return userRes;
  }

  /**
   * Update user
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User update result' })
  async update(@Req() req: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    await this.validateHospitalManagerAccess(req.user, id, updateUserDto);
    return this.usersService.update(id, updateUserDto as any);
  }

  /**
   * Partial update user
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partial update user' })
  @ApiResponse({ status: 200, description: 'User update result' })
  async patchUpdate(@Req() req: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    await this.validateHospitalManagerAccess(req.user, id, updateUserDto);
    return this.usersService.update(id, updateUserDto as any);
  }

  /**
   * Delete user
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deletion result' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.validateHospitalManagerAccess(req.user, id);
    return this.usersService.delete(id);
  }

  /**
   * Update user status (Activate / Deactivate)
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, description: 'Status update result' })
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: string) {
    await this.validateHospitalManagerAccess(req.user, id);
    return this.usersService.updateStatus(id, status as any);
  }

  /**
   * Get regional managers by city
   * Used by super admin for RM assignment
   */
  @Get('regional-managers/city/:city')
  @Roles(UserRole.SUPERUSER)
  @ApiOperation({ summary: 'Get regional managers by city' })
  @ApiResponse({ status: 200, description: 'Regional managers retrieved successfully' })
  async getRegionalManagersByCity(@Param('city') city: string) {
    return this.usersService.getRegionalManagersByCity(city);
  }

  /**
   * Get regional manager workload
   * Used by super admin for workload balancing
   */
  @Get('regional-managers/:id/workload')
  @Roles(UserRole.SUPERUSER)
  @ApiOperation({ summary: 'Get regional manager workload' })
  @ApiResponse({ status: 200, description: 'RM workload retrieved successfully' })
  async getRMWorkload(@Param('id') id: string) {
    return this.usersService.getRMWorkload(id);
  }

  /**
   * Suggest regional manager for hospital
   * Used by super admin for smart assignment
   */
  @Get('regional-managers/suggest/:city')
  @Roles(UserRole.SUPERUSER)
  @ApiOperation({ summary: 'Suggest regional manager for hospital by city' })
  @ApiResponse({ status: 200, description: 'RM suggestions retrieved successfully' })
  async suggestRMForHospital(@Param('city') city: string) {
    return this.usersService.suggestRMForHospital(city);
  }

  /**
   * Get all regional managers with their workload
   * Used by super admin for overview
   */
  @Get('regional-managers/workloads')
  @Roles(UserRole.SUPERUSER)
  @ApiOperation({ summary: 'Get all regional managers with workload' })
  @ApiResponse({ status: 200, description: 'All RM workloads retrieved successfully' })
  async getAllRMWorkloads() {
    return this.usersService.getAllRMWorkloads();
  }

  /** Helper to validate that a Hospital Manager only modifies their own hospital's staff */
  private async validateHospitalManagerAccess(caller: any, targetUserId: string, updateDto?: any) {
    if (!caller) return;
    if (caller.role === UserRole.HOSPITAL_MANAGER) {
      const targetRes: any = await this.usersService.findById(targetUserId);
      if (targetRes?.success && targetRes.data) {
        if (targetRes.data.hospitalId && targetRes.data.hospitalId !== caller.hospitalId) {
          throw new ForbiddenException('Cross-hospital access denied. You can only manage staff belonging to your hospital.');
        }
      }
      if (updateDto?.role) {
        const forbidden = [UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER, UserRole.HOSPITAL_MANAGER];
        if (forbidden.includes(updateDto.role)) {
          throw new ForbiddenException('Hospital managers cannot assign administrative oversight roles.');
        }
      }
    }
  }
}
