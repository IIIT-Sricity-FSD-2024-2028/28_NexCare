import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { applyMiddlewareContract, buildSwaggerConfig } from './src/swagger.config';
import { AppModule } from './src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Must mirror main.ts, or every documented path loses its /api prefix.
  app.setGlobalPrefix('api');

  const config = buildSwaggerConfig();

  // Fold the global middleware contract into every operation — see swagger.config.ts.
  const document = applyMiddlewareContract(SwaggerModule.createDocument(app, config));

  // This is the on-demand generator for docs/swagger.json. main.ts no longer
  // writes that file on boot, so it only changes when someone runs this.
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const swaggerPath = path.join(docsDir, 'swagger.json');
  fs.writeFileSync(swaggerPath, JSON.stringify(document, null, 2));
  console.log(`Swagger JSON written to: ${swaggerPath}`);
  
  await app.close();
}

bootstrap();
