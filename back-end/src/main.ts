import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { applyMiddlewareContract, buildSwaggerConfig } from './swagger.config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { errorHandlerMiddleware, notFoundMiddleware, fileRotator } from './lodger.middleware';
import { fileLogger } from './common/logging/file-logger';
import { json, urlencoded, static as expressStatic } from 'express';
import * as morgan from 'morgan';
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
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'x-csrf-token', 
      'Accept', 
      'x-request-id', 
      'x-query-timestamp', 
      'x-user-role', 
      'Origin', 
      'X-Requested-With', 
      'Cache-Control'
    ],
    exposedHeaders: ['x-query-timestamp', 'Authorization', 'x-request-id', 'x-ratelimit-remaining', 'x-csrf-token'],
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

  // ─── Static File Serving ─────────────────────────────────────────────────
  // Serve static files from public directory (images, documents, etc.)
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use('/public', expressStatic(publicDir));
    fileLogger.info('app', 'Static file serving enabled', { path: publicDir });
  } else {
    // Create public directory if it doesn't exist
    fs.mkdirSync(publicDir, { recursive: true });
    app.use('/public', expressStatic(publicDir));
    fileLogger.info('app', 'Static file directory created and enabled', { path: publicDir });
  }

  // ─── Morgan HTTP Logging ────────────────────────────────────────────────
  // Use Morgan for HTTP request logging (industry standard)
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: accessLogStream }));
  fileLogger.info('app', 'Morgan HTTP logging enabled', { logPath: path.join(logsDir, 'access.log') });

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

  // ─── Start File Rotator ─────────────────────────────────────────────────
  // Start automatic log file rotation (required for evaluation)
  fileRotator.start(60000); // Check every minute

  // ─── Swagger Documentation ────────────────────────────────────────────────
  const config = buildSwaggerConfig();

  // Fold the global middleware contract into every operation — see swagger.config.ts.
  const document = applyMiddlewareContract(SwaggerModule.createDocument(app, config));

  // docs/swagger.json is NOT written here. It is a tracked file, and rewriting
  // it on every boot made it churn in four of the last nineteen commits and
  // guaranteed a conflict whenever two people ran the app. Regenerate it
  // deliberately instead:  npm run swagger:generate

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
    fileRotator.stop(); // Stop file rotator
    fileLogger.stop();
    process.exit(0);
  });
}

// Start the application
bootstrap();
