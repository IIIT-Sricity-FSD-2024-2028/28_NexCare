import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
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
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

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
  app.useGlobalFilters(new HttpExceptionFilter());

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

  // ─── Binding ──────────────────────────────────────────────────────────────
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

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
