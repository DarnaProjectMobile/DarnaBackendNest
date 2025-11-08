import {
  Controller,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Post,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { ApiTags, ApiConsumes, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateMailDto } from '../mail/dto/create-mail.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto } from '../mail/dto/forgot-password.dto';
import { ResetPasswordDto } from '../mail/dto/reset-password.dto';

@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 👑 Admin only: Get all users
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Liste de tous les utilisateurs' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  getAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer l\'utilisateur actuel' })
  @ApiResponse({ status: 200, description: 'Informations de l\'utilisateur actuel' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getMe(@CurrentUser() user: any) {
    console.log('🧠 Current user from JWT:', user);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.usersService.findById(user.userId);
  }

  // 🖼️ Upload / update profile image
  @Patch('me/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Mettre à jour l\'image de profil' })
  @ApiResponse({ status: 200, description: 'Image mise à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Aucune image fournie' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/users',
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + file.originalname;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async updateImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File, // ✅ lowercase variable name
  ) {
    if (!file) {
      throw new Error('No image uploaded');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.usersService.updateImageById(user.userId, file.filename);
  }

  @Post('send-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Envoyer le code de vérification par email' })
  @ApiResponse({ status: 200, description: 'Code de vérification envoyé' })
  @ApiResponse({ status: 400, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  sendVerification(@CurrentUser() user: any) {
    return this.usersService.sendVerificationCodeById(user.userId);
  }

  @Post('me/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Vérifier l\'email avec le code reçu' })
  @ApiBody({ type: CreateMailDto })
  @ApiResponse({ status: 200, description: 'Email vérifié avec succès' })
  @ApiResponse({ status: 400, description: 'Code de vérification invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async verifyMe(@CurrentUser() user: any, @Body() body: CreateMailDto) {
    return this.usersService.verifyEmailById(user.userId, body.code);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Demander un code de réinitialisation de mot de passe' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Code de réinitialisation envoyé' })
  @ApiResponse({ status: 400, description: 'Utilisateur non trouvé' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.usersService.sendPasswordResetCode(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec le code reçu' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé avec succès' })
  @ApiResponse({ status: 400, description: 'Code invalide ou mots de passe ne correspondent pas' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.usersService.resetPassword(
      body.code,
      body.newPassword,
      body.confirmPassword,
    );
  }

  // Update user
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // Delete user
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un utilisateur (Admin uniquement)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur à supprimer' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
