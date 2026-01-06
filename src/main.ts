import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

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

    // ✅ Dynamic port for Render deployment
    // Render assigns PORT dynamically, fallback to 3000 for local dev
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📘 Swagger docs available on http://localhost:${port}/api`);
}
bootstrap();