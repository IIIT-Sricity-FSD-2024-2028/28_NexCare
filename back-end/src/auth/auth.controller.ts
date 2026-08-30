import { Controller, Post, Body, Get, Patch, Param, Req, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { Response } from 'express';

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
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);
    
    // Add Cache-Control headers to prevent stale cached pages
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.json(result);
  }

  /** @route POST /api/auth/register — Public (patient self-registration) */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new patient account' })
  @ApiResponse({ status: 200, description: 'Registration result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(registerDto);
    
    // Add Cache-Control headers to prevent stale cached pages
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.json(result);
  }

  /** @route POST /api/auth/register-staff — Public (staff self-registration) */
  @Public()
  @Post('register-staff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new staff account (administrative_staff/ambulance)' })
  @ApiResponse({ status: 200, description: 'Registration result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async registerStaff(@Body() registerStaffDto: RegisterStaffDto, @Res() res: Response) {
    const result = await this.authService.registerStaff(registerStaffDto);
    
    // Add Cache-Control headers to prevent stale cached pages
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.json(result);
  }

  /** @route POST /api/auth/logout/:userId — Any authenticated user */
  @ApiBearerAuth('JWT-auth')
  @Post('logout/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Successful logout' })
  async logout(@Req() req: any, @Param('userId') userId: string) {
    // Only ever act on the authenticated user — ignore a mismatched path param.
    return this.authService.logout(req.user?.id || userId);
  }

  /** @route GET /api/auth/current/:userId — Any authenticated user */
  @ApiBearerAuth('JWT-auth')
  @Get('current/:userId')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getCurrentUser(@Req() req: any, @Param('userId') userId: string) {
    // A user may only read their own session.
    return this.authService.getCurrentUser(req.user?.id || userId);
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
  async changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    // Bind the change to the authenticated user only — never trust a client id.
    return this.authService.changePassword({ ...body, userId: req.user?.id });
  }
}
