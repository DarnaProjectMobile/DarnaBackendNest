import { Controller, Get, Patch, Body, UseGuards, Req, UploadedFile, UseInterceptors, Post, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private cloudinaryService: CloudinaryService
  ) { }

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
      storage: require('multer').memoryStorage(), // Use memory storage instead of disk
    }),
  )
  async updateImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No image uploaded');
    }

    // Upload to Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, 'users');
    // Store the Cloudinary URL instead of local path
    const imageUrl = result.secure_url;
    return this.usersService.updateImageById(user.userId, imageUrl);
  }

  @Post('me/send-verification')
  @UseGuards(JwtAuthGuard)
  async sendVerification(@CurrentUser() user: any) {
    return this.usersService.sendVerificationCodeById(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}