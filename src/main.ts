import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: true,
    });

    // ✅ Enable CORS (Required for mobile app & testing)
    app.enableCors({
        origin: true,
        credentials: true,
    });

    // ✅ Increase request size limit to 10MB
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

    // ✅ Enable global validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // ✅ Auto-create upload directories (CRITICAL for Chat & Visits features)
    const uploadDirs = [
        join(__dirname, '..', 'uploads'),
        join(__dirname, '..', 'uploads', 'users'),
        join(__dirname, '..', 'uploads', 'chat'),
        join(__dirname, '..', 'uploads', 'visites'),
        join(__dirname, '..', 'uploads', 'visites', 'confirmation'),
        join(__dirname, '..', 'uploads', 'annonces'),
        join(__dirname, '..', 'uploads', 'logement'),
    ];

    uploadDirs.forEach(dir => {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
            console.log(`📁 Created upload directory: ${dir}`);
        }
    });

    // Serve static files (e.g., uploaded images)
    app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

    // Swagger configuration
    const config = new DocumentBuilder()
        .setTitle('Darna Backend API') // Updated title for consistency
        .setDescription('API for managing Darna application')
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

    // Use port 3000 as requested (was 3007 in source)
    await app.listen(3000, '0.0.0.0');
    console.log('🚀 Server running on http://localhost:3000');
    console.log('📘 Swagger docs available on http://localhost:3000/api');
}
bootstrap();