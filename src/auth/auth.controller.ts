import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { LoginDto } from './dto/login.dto';
import { ApiConsumes, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 1️⃣ Register user
  @Post('register')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Créer un nouveau compte utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou email déjà utilisé' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/users';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) =>
          cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + file.originalname),
      }),
      fileFilter: (req, file, cb) => {
        if (file && !file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new Error('Seuls les fichiers images sont autorisés!'), false);
        } else {
          cb(null, true);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  )
  register(
    @Body() dto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const image = file?.filename;
    return this.authService.register(dto, image);
  }

  // 2️⃣ Login
  @Post('login')
  @ApiOperation({ 
    summary: 'Se connecter et obtenir un token JWT',
    description: 'Authentifiez-vous avec votre email et mot de passe pour obtenir un access_token. Utilisez ce token dans le bouton "Authorize" de Swagger pour accéder aux endpoints protégés.'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion réussie - Token JWT retourné',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        user: {
          type: 'object',
          example: {
            _id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
            role: 'client'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Données de connexion invalides' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto.email, dto.password);
    } catch (error) {
      // Re-throw pour que NestJS gère l'erreur correctement
      throw error;
    }
  }
}
