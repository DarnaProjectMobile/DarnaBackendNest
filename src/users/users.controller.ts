import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import * as NestPlatformExpress from '@nestjs/platform-express';
const FileInterceptor = (NestPlatformExpress as any).FileInterceptor;
import { CreateMailDto } from '../mail/dto/create-mail.dto';

import { ForgotPasswordDto } from '../mail/dto/forgot-password.dto';
import { ResetPasswordDto } from '../mail/dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeviceTokenDto } from './dto/device-token.dto';
import { userImageUpload } from './user.upload.images';

@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

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
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: any,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateUser(user.userId, body);
  }

  // 🖼️ Upload / update profile image
  @Patch('me/image')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', userImageUpload),
  )
  async updateImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No image uploaded');
    }

    // Store the relative path to the image
    const imagePath = `/uploads/users/${file.filename}`;
    return this.usersService.updateImageById(user.userId, imagePath);
  }

  @Post('me/send-verification')
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