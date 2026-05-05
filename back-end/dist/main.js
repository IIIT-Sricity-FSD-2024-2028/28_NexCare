"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
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
    console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
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