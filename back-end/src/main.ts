import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Minimal .env loader (no external dependency).
 * Populates process.env from a .env file for keys that aren't already set,
 * so JWT_SECRET / PORT / etc. are picked up without requiring dotenv.
 */
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    for (const rawLine of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch (err) {
    console.warn('Could not load .env file:', (err as Error).message);
  }
}

loadEnv();

// Security guard-rail: warn loudly if the JWT secret is missing or left at the
// well-known default. In production this should be a real, unique secret.
const KNOWN_DEFAULT_SECRET = 'nexcare_jwt_secret_key_2024_evaluation';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set — tokens are signed with a fallback secret. Set JWT_SECRET in .env.');
} else if (process.env.JWT_SECRET === KNOWN_DEFAULT_SECRET) {
  console.warn('⚠️  JWT_SECRET is the shipped default — change it before any real deployment.');
}

/**
 * Bootstrap function
 * Initializes and starts the NestJS application
 * Configures global pipes, CORS, Swagger, and middleware
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── CORS ─────────────────────────────────────────────────────────────────
  // Default is permissive (reflect any origin) to support the multi-host/WSL dev
  // setup. Set CORS_ORIGIN to a comma-separated allowlist to lock it down in prod.
  const corsEnv = process.env.CORS_ORIGIN?.trim();
  const corsOrigin =
    corsEnv && corsEnv !== '*'
      ? corsEnv.split(',').map((o) => o.trim()).filter(Boolean)
      : true;
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
    exposedHeaders: ['x-query-timestamp'],
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
