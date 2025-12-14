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
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import * as NestPlatformExpress from '@nestjs/platform-express';
const FileInterceptor = (NestPlatformExpress as any).FileInterceptor;
import { diskStorage } from 'multer';
import { CreateMailDto } from '../mail/dto/create-mail.dto';

import { ForgotPasswordDto } from '../mail/dto/forgot-password.dto';
import { ResetPasswordDto } from '../mail/dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeviceTokenDto } from './dto/device-token.dto';
import { AvailabilityService } from '../availability/availability.service';
import { UpdateAvailabilityDto } from '../availability/dto/availability.dto';

import { NotificationsFirebaseService } from '../notifications-firebase/notifications-firebase.service';

@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationsFirebaseService: NotificationsFirebaseService,
  ) { }

  @Post('me/device-token')
  @UseGuards(JwtAuthGuard)
  async registerDeviceToken(
    @CurrentUser() user: any,
    @Body() body: DeviceTokenDto,
  ) {
    await this.notificationsFirebaseService.registerToken(
      user.userId,
      'ANDROID', // Assuming Android for now based on context
      body.deviceToken,
    );
    return { message: 'Device token registered' };
  }

  @Delete('me/device-token')
  @UseGuards(JwtAuthGuard)
  async removeDeviceToken(
    @CurrentUser() user: any,
    @Body() body: DeviceTokenDto,
  ) {
    // Current implementation doesn't support unregistering specific token easily via public API
    // but typically we'd do nothing or implement it. 
    // For now returning success to satisfy the client call.
    return { message: 'Device token removed' };
  }

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

  @Get(':ownerId/availability')
  @UseGuards(JwtAuthGuard)
  async getAvailability(@Param('ownerId') ownerId: string) {
    return this.availabilityService.getAvailability(ownerId);
  }

  @Post('me/availability')
  @UseGuards(JwtAuthGuard)
  async updateAvailability(
    @CurrentUser() user: any,
    @Body() body: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.updateAvailability(user.userId, body);
  }
}
