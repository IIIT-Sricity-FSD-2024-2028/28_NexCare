"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./src/app.module");
const fs = require("fs");
const path = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = new swagger_1.DocumentBuilder()
        .setTitle('NexCare Hospital Management API')
        .setDescription('Complete REST API for the NexCare Hospital Administrative Operations Platform. ' +
        'Features role-based access control (RBAC), JWT authentication, and comprehensive ' +
        'modules for patients, appointments, billing, beds, ambulance, inventory, feedback, and system management.')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
    }, 'JWT-auth')
        .addApiKey({
        type: 'apiKey',
        in: 'header',
        name: 'x-user-role',
        description: 'User role for RBAC (superuser, administrative_staff, patient, ambulance, doctor, nurse)',
    }, 'x-user-role')
        .addServer(process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`, 'Local Server')
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir);
    }
    console.log(JSON.stringify(document));
    await app.close();
}
bootstrap();
//# sourceMappingURL=generate-swagger.js.map