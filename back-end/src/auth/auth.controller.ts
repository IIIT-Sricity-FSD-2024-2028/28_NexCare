import { Controller, Post, Body, Get, Patch, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Authentication Controller
 * Login and Register are @Public (no token needed).
 * Logout and session endpoints require a valid token (no role restriction).
 * The /sessions admin endpoint is restricted to superuser only.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** @route POST /api/auth/login — Public */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login result (check success field)' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** @route POST /api/auth/register — Public (patient self-registration) */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new patient account' })
  @ApiResponse({ status: 200, description: 'Registration result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /** @route POST /api/auth/logout/:userId — Any authenticated user */
  @ApiBearerAuth('JWT-auth')
  @Post('logout/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Successful logout' })
  async logout(@Param('userId') userId: string) {
    return this.authService.logout(userId);
  }

  /** @route GET /api/auth/current/:userId — Any authenticated user */
  @ApiBearerAuth('JWT-auth')
  @Get('current/:userId')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getCurrentUser(@Param('userId') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  /** @route GET /api/auth/sessions — Superuser only */
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.SUPERUSER)
  @Get('sessions')
  @ApiOperation({ summary: 'Get active user sessions (Superuser only)' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getActiveSessions() {
    return this.authService.getActiveSessions();
  }

  /** @route PATCH /api/auth/change-password — Any authenticated user */
  @ApiBearerAuth('JWT-auth')
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async changePassword(@Body() body: { currentPassword: string; newPassword: string }) {
    return this.authService.changePassword(body);
  }
}
