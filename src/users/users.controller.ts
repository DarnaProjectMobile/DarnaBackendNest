import {
  Controller,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateMailDto } from '../mail/dto/create-mail.dto';

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
  getAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    console.log('🧠 Current user from JWT:', user);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.usersService.findById(user.userId);
  }

  // 🖼️ Upload / update profile image
  @Patch('me/image')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
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

  @Post('000000000000000000000000000000')
  @UseGuards(JwtAuthGuard)
  sendVerification(@CurrentUser() user: any) {
    return this.usersService.sendVerificationCodeById(user.userId);
  }
  @Post('me/verify')
  @UseGuards(JwtAuthGuard)
  async verifyMe(@CurrentUser() user: any, @Body() body: CreateMailDto) {
    return this.usersService.verifyEmailById(user.userId, body.code);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.usersService.sendPasswordResetCode(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.usersService.resetPassword(
      body.code,
      body.newPassword,
      body.confirmPassword,
    );
  }
}
