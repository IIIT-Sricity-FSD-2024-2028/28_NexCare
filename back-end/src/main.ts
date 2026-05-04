import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseUtil } from './common/utils/response.util';

/**
 * Bootstrap function
 * Initializes and starts the NestJS application
 * Configures global pipes, CORS, and middleware
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:4200'], // Frontend URLs
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Note: Validation should be handled in service layer, not in DTOs
  // DTOs are simple data transfer objects - no validation decorators
  // Validation logic should be separate from data transfer

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Start the server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 NexCare Backend API is running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation will be available at: http://localhost:${port}/api/docs`);
  console.log(`🏥 NexCare Hospital Management System - Backend Foundation`);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
bootstrap();
