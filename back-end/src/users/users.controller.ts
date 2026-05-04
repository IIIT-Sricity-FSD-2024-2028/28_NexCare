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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Users Controller
 * Manages user accounts across all roles in the NexCare system
 * Provides endpoints for user CRUD operations and management
 */
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users with optional filtering
   * @route GET /users
   * @query role Optional role filter
   * @query status Optional status filter
   * @access Private (Admin)
   */
  @Get()
  async findAll(@Query('role') role?: string, @Query('status') status?: string) {
    return this.usersService.findAll(role as any, status as any);
  }

  /**
   * Create new user
   * @route POST /users
   * @access Private (Admin)
   */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto as any);
  }

  /**
   * Get user statistics
   * @route GET /users/stats
   * @access Private (Admin)
   */
  @Get('stats/overview')
  async getStats() {
    return this.usersService.getStats();
  }

  /**
   * Get users by role
   * @route GET /users/role/:role
   * @access Private (Admin)
   */
  @Get('role/:role')
  async findByRole(@Param('role') role: string) {
    return this.usersService.findByRole(role as any);
  }

  /**
   * Search users
   * @route GET /users/search/:query
   * @access Private (Admin)
   */
  @Get('search/:query')
  async search(@Param('query') query: string) {
    return this.usersService.search(query);
  }

  /**
   * Get user by ID
   * @route GET /users/:id
   * @access Private (Admin/User)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Update user
   * @route PUT /users/:id
   * @access Private (Admin/User)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto as any);
  }

  /**
   * Partial update user
   * @route PATCH /users/:id
   * @access Private (Admin/User)
   */
  @Patch(':id')
  async patchUpdate(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto as any);
  }

  /**
   * Delete user
   * @route DELETE /users/:id
   * @access Private (Admin)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  /**
   * Update user status
   * @route PATCH /users/:id/status
   * @access Private (Admin)
   */
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateStatus(id, status as any);
  }
}
