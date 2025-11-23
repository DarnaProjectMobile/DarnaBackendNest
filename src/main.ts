import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as os from 'os'; // ✅ For network IP detection

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for Android app
  app.enableCors({
    origin: true, // Allow all origins (for development) - change to specific origin in production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ✅ Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove properties not in DTO
      forbidNonWhitelisted: false, // throw error if extra fields sent
      transform: true, // automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // automatically convert types
      },
      stopAtFirstError: false, // show all validation errors
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          return Object.values(error.constraints || {}).join(', ');
        });
        return new BadRequestException({
          statusCode: 400,
          message: messages.length > 0 ? messages : 'Validation failed',
          error: 'Bad Request',
        });
      },
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

  const port = process.env.PORT ? Number(process.env.PORT) : 3007;
  
  // Get local IP address for network access
  const getLocalIP = (): string => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const networkInterface = interfaces[name];
      if (networkInterface) {
        for (const iface of networkInterface) {
          // Skip internal (loopback) addresses and non-IPv4
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
    }
    return 'localhost';
  };

  const localIP = getLocalIP();
  
  // Listen on all network interfaces (0.0.0.0) to allow access from other devices
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Server running on:`);
  console.log(`   📍 Local:   http://localhost:${port}`);
  console.log(`   🌐 Network: http://${localIP}:${port}`);
  console.log(`📘 Swagger docs available on:`);
  console.log(`   📍 Local:   http://localhost:${port}/api`);
  console.log(`   🌐 Network: http://${localIP}:${port}/api`);
}
bootstrap();
