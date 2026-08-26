import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Must mirror main.ts, or every documented path loses its /api prefix.
  app.setGlobalPrefix('api');

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
        description: 'User role for RBAC (superuser, administrative_staff, patient, ambulance, regional_manager, hospital_manager)',
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

  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }

  // To allow user to see it in .3 as well, let's output to standard out so I can capture it.
  console.log(JSON.stringify(document));
  
  await app.close();
}

bootstrap();
