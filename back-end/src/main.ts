import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { errorHandlerMiddleware, notFoundMiddleware } from './common/middleware/error-handler.middleware';
import { fileLogger } from './common/logging/file-logger';
import { json, urlencoded } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Bootstrap function
 * Initializes and starts the NestJS application
 * Configures global pipes, CORS, Swagger, and middleware
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
    exposedHeaders: ['x-query-timestamp', 'x-request-id', 'x-ratelimit-remaining'],
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Body size limits, matching the check in SecurityMiddleware. The parser
  // runs before application middleware, so this is what actually stops an
  // oversized body; AllExceptionsFilter turns the refusal into a 413.
  const maxBodyBytes = Number(process.env.MAX_BODY_BYTES) || 1024 * 1024;
  app.use(json({ limit: maxBodyBytes }));
  app.use(urlencoded({ extended: true, limit: maxBodyBytes }));

  // ─── Global Validation Pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const errorMessages = errors.map((error) => ({
          field: error.property,
          messages: Object.values(error.constraints || {}),
        }));
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
        });
      },
    }),
  );

  // ─── Global Exception Filter ──────────────────────────────────────────────
  // Catches every exception thrown inside a route handler, returns the
  // standard JSON envelope and writes the failure to logs/error-<date>.log
  app.useGlobalFilters(new AllExceptionsFilter());

  // Flush buffered logs when the process is asked to stop
  app.enableShutdownHooks();

  // ─── Swagger Documentation ────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('NexCare Hospital Management API')
    .setDescription(
      'Complete REST API for the NexCare Hospital Administrative Operations Platform. ' +
      'Features role-based access control (RBAC), JWT authentication, and comprehensive ' +
      'modules for patients, appointments, billing, beds, ambulance, inventory, feedback, and system management.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-user-role',
        description: 'User role for RBAC (superuser, administrative_staff, patient, ambulance, doctor, nurse)',
      },
      'x-user-role',
    )
    .addServer(
      process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`,
      'Local Server',
    )
    .addTag('Auth', 'Authentication & session management')
    .addTag('Users', 'User account management (Admin)')
    .addTag('Patients', 'Patient records & profiles')
    .addTag('Appointments', 'Appointment scheduling & tracking')
    .addTag('Billing', 'Financial operations & bill management')
    .addTag('Beds', 'Bed allocation & ward management')
    .addTag('Ambulance', 'Emergency services & ambulance requests')
    .addTag('Inventory', 'Supply chain & inventory tracking')
    .addTag('Feedback', 'Communication & feedback system')
    .addTag('System', 'Audit logs & system configuration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // ============================================
  // SAVE SWAGGER JSON TO FILE
  // ============================================
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }
  const swaggerPath = path.join(docsDir, 'swagger.json');
  fs.writeFileSync(swaggerPath, JSON.stringify(document, null, 2));
  console.log(`✅ Swagger JSON saved to: ${swaggerPath}`);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
    },
    customCss: '.topbar { display: none }',
    customSiteTitle: 'NexCare API Documentation',
  });

  // ─── Express-level error handling ─────────────────────────────────────────
  // These have to be registered after the routes are mounted, which is what
  // init() does — hence init() here and listen() below. They catch what the
  // Nest exception filter cannot see: body-parser failures, errors thrown by
  // middleware, and requests for routes that do not exist.
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(notFoundMiddleware);
  expressApp.use(errorHandlerMiddleware);

  // ─── Binding ──────────────────────────────────────────────────────────────
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  fileLogger.info('app', 'Application started', { port: Number(port), pid: process.pid });

  // Show all accessible URLs
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips: string[] = ['localhost'];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  console.log(`\n🚀 NexCare Backend API is running on port ${port}`);
  console.log(`📡 Accessible at:`);
  ips.forEach(ip => console.log(`   http://${ip}:${port}/api`));
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
  console.log(`🏥 NexCare Hospital Management System\n`);
}

// Handle uncaught exceptions — record them before the process dies
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  fileLogger.error('Uncaught exception', { name: error.name, detail: error.message, stack: error.stack });
  fileLogger.stop(); // synchronous flush
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection reason:', reason);
  fileLogger.error('Unhandled promise rejection', {
    detail: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  fileLogger.stop();
  process.exit(1);
});

// Write out anything still buffered on a normal shutdown
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    fileLogger.info('app', 'Process signal received', { signal });
    fileLogger.stop();
    process.exit(0);
  });
}

// Start the application
bootstrap();
