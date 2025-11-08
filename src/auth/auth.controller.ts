import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
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
        destination: './uploads/users',
        filename: (req, file, cb) =>
          cb(null, Date.now() + '-' + file.originalname),
      }),
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
            role: 'Client'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
