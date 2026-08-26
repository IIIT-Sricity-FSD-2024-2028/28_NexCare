"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const error_handler_middleware_1 = require("./common/middleware/error-handler.middleware");
const file_logger_1 = require("./common/logging/file-logger");
const express_1 = require("express");
const fs = require("fs");
const path = require("path");
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath))
            return;
        for (const rawLine of fs.readFileSync(envPath, 'utf-8').split('\n')) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#'))
                continue;
            const eq = line.indexOf('=');
            if (eq === -1)
                continue;
            const key = line.slice(0, eq).trim();
            let val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
            if (key && process.env[key] === undefined)
                process.env[key] = val;
        }
    }
    catch (err) {
        console.warn('Could not load .env file:', err.message);
    }
}
loadEnv();
const KNOWN_DEFAULT_SECRET = 'nexcare_jwt_secret_key_2024_evaluation';
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET is not set — tokens are signed with a fallback secret. Set JWT_SECRET in .env.');
}
else if (process.env.JWT_SECRET === KNOWN_DEFAULT_SECRET) {
    console.warn('⚠️  JWT_SECRET is the shipped default — change it before any real deployment.');
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsEnv = process.env.CORS_ORIGIN?.trim();
    const corsOrigin = corsEnv && corsEnv !== '*'
        ? corsEnv.split(',').map((o) => o.trim()).filter(Boolean)
        : true;
    app.enableCors({
        origin: corsOrigin,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
        exposedHeaders: ['x-query-timestamp', 'x-request-id', 'x-ratelimit-remaining'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const maxBodyBytes = Number(process.env.MAX_BODY_BYTES) || 1024 * 1024;
    app.use((0, express_1.json)({ limit: maxBodyBytes }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: maxBodyBytes }));
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
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.enableShutdownHooks();
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
    const swaggerPath = path.join(docsDir, 'swagger.json');
    fs.writeFileSync(swaggerPath, JSON.stringify(document, null, 2));
    console.log(`✅ Swagger JSON saved to: ${swaggerPath}`);
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
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use(error_handler_middleware_1.notFoundMiddleware);
    expressApp.use(error_handler_middleware_1.errorHandlerMiddleware);
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    file_logger_1.fileLogger.info('app', 'Application started', { port: Number(port), pid: process.pid });
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
    file_logger_1.fileLogger.error('Uncaught exception', { name: error.name, detail: error.message, stack: error.stack });
    file_logger_1.fileLogger.stop();
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection reason:', reason);
    file_logger_1.fileLogger.error('Unhandled promise rejection', {
        detail: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
    });
    file_logger_1.fileLogger.stop();
    process.exit(1);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        file_logger_1.fileLogger.info('app', 'Process signal received', { signal });
        file_logger_1.fileLogger.stop();
        process.exit(0);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map