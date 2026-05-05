"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
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
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: errorMessages,
            });
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
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
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
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
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const ips = ['localhost'];
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
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
bootstrap();
//# sourceMappingURL=main.js.map