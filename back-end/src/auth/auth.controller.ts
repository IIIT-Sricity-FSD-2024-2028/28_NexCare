import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
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
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** @route POST /api/auth/login — Public */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** @route POST /api/auth/register — Public (patient self-registration) */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /** @route POST /api/auth/logout/:userId — Any authenticated user */
  @Post('logout/:userId')
  @HttpCode(HttpStatus.OK)
  async logout(@Param('userId') userId: string) {
    return this.authService.logout(userId);
  }

  /** @route GET /api/auth/current/:userId — Any authenticated user */
  @Get('current/:userId')
  async getCurrentUser(@Param('userId') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  /** @route GET /api/auth/sessions — Superuser only */
  @Roles(UserRole.SUPERUSER)
  @Get('sessions')
  async getActiveSessions() {
    return this.authService.getActiveSessions();
  }
}
