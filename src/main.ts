import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

// import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Swagger SAFE
  // app.use(
  //   '/api/docs',
  //   basicAuth({
  //     challenge: true,
  //     users: { admin: process.env.SWAGGER_PASSWORD ?? '1234' },
  //   }),
  // );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('UniFlow API')
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server: http://localhost:${port}/api`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}
void bootstrap();
