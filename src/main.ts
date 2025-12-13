import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { existsSync, mkdirSync } from 'fs';
import * as os from 'os';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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

    // Use port 3008 as requested
    const port = process.env.PORT ? Number(process.env.PORT) : 3009;

    // Get local IP address for network access
    // Priority: 192.168.x.x > 10.x.x.x > other private IPs > APIPA (169.254.x.x)
    const getLocalIP = (): string => {
        const interfaces = os.networkInterfaces();
        const ipAddresses: { ip: string; priority: number }[] = [];

        for (const name of Object.keys(interfaces)) {
            const networkInterface = interfaces[name];
            if (networkInterface) {
                for (const iface of networkInterface) {
                    // Skip internal (loopback) addresses and non-IPv4
                    if (iface.family === 'IPv4' && !iface.internal) {
                        const ip = iface.address;
                        let priority = 3; // Default priority (lowest)

                        // Priority 1: 192.168.x.x (most common home network)
                        if (ip.startsWith('192.168.')) {
                            priority = 1;
                        }
                        // Priority 2: 10.x.x.x (common corporate/VPN networks)
                        else if (ip.startsWith('10.')) {
                            priority = 2;
                        }
                        // Priority 4: APIPA (169.254.x.x) - avoid if possible
                        else if (ip.startsWith('169.254.')) {
                            priority = 4;
                        }

                        ipAddresses.push({ ip, priority });
                    }
                }
            }
        }

        // Sort by priority (lower number = higher priority)
        ipAddresses.sort((a, b) => a.priority - b.priority);

        // Return the highest priority IP, or localhost if none found
        return ipAddresses.length > 0 ? ipAddresses[0].ip : 'localhost';
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
