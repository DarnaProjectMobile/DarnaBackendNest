import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common'; // ✅ Add this import

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove properties not in DTO
      forbidNonWhitelisted: false, // throw error if extra fields sent
      transform: true, // automatically transform payloads to DTO instances
    }),
  );

  // Serve static files (e.g., uploaded images)
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('SkillSwapTn API')
    .setDescription('API for managing SkillSwapTn app')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (document as any).security = [{ 'access-token': [] }];

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📘 Swagger docs available on http://localhost:3000/api');
}
bootstrap();
