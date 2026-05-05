import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseUtil } from './common/utils/response.util';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


/**
 * Bootstrap function
 * Initializes and starts the NestJS application
 * Configures global pipes, CORS, and middleware
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 🔥 SWAGGER SETUP
const config = new DocumentBuilder()
  .setTitle('NexCare API')
  .setDescription('Hospital Management System APIs')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config);

// ⚠️ IMPORTANT: because you used global prefix 'api'
SwaggerModule.setup('api/docs', app, document);
  // ─── CORS ─────────────────────────────────────────────────────────────────
  // Allow ALL origins — this is intentional for the evaluation environment.
  // The backend enforces security via JWT tokens, not CORS.
  // Restricting CORS here would break access from any non-whitelisted IP/port,
  // which is unpredictable during evaluation demos.
  app.enableCors({
    origin: true,   // reflect any Origin header back (allows all)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Note: Validation should be handled in service layer, not in DTOs
  // DTOs are simple data transfer objects - no validation decorators
  // Validation logic should be separate from data transfer

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // ─── Binding ──────────────────────────────────────────────────────────────
  // Bind to 0.0.0.0 so the backend is reachable on ALL network interfaces:
  //   localhost, 127.0.0.1, WSL bridge IP, LAN IP, etc.
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  // Show all accessible URLs (helps evaluator know where to connect)
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
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
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
