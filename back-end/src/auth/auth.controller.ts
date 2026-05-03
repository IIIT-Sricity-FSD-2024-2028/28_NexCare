import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Authentication Controller
 * Handles all authentication-related endpoints
 * Provides login, logout, registration, and session management
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login endpoint
   * @route POST /auth/login
   * @access Public
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  /**
   * User registration endpoint (for patients)
   * @route POST /auth/register
   * @access Public
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * User logout endpoint
   * @route POST /auth/logout/:userId
   * @access Private
   */
  @Post('logout/:userId')
  @HttpCode(HttpStatus.OK)
  async logout(@Param('userId') userId: string) {
    return this.authService.logout(userId);
  }

  /**
   * Get current user session
   * @route GET /auth/current/:userId
   * @access Private
   */
  @Get('current/:userId')
  async getCurrentUser(@Param('userId') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  /**
   * Get all active sessions (admin only)
   * @route GET /auth/sessions
   * @access Private (Admin)
   */
  @Get('sessions')
  async getActiveSessions() {
    return this.authService.getActiveSessions();
  }
}
