import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 * Mark a route as publicly accessible (no auth token required)
 * Usage: @Public() on any controller method
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
