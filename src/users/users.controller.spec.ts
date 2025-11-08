import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateMailDto } from '../mail/dto/create-mail.dto';
import { ForgotPasswordDto } from '../mail/dto/forgot-password.dto';
import { ResetPasswordDto } from '../mail/dto/reset-password.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    role: 'Client',
    dateDeNaissance: '1990-01-01',
    numTel: '12345678',
    gender: 'Male',
    image: 'profile.jpg',
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateImageById: jest.fn(),
    sendVerificationCodeById: jest.fn(),
    verifyEmailById: jest.fn(),
    sendPasswordResetCode: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser, mockUser];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.getAll();

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const mockCurrentUser = { userId: '507f1f77bcf86cd799439011' };
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.getMe(mockCurrentUser);

      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith(mockCurrentUser.userId);
    });
  });

  describe('updateImage', () => {
    it('should update user image', async () => {
      const mockFile = {
        filename: 'new-profile.jpg',
        originalname: 'profile.jpg',
      } as Express.Multer.File;
      const mockCurrentUser = { userId: '507f1f77bcf86cd799439011' };
      const updatedUser = { ...mockUser, image: 'new-profile.jpg' };
      mockUsersService.updateImageById.mockResolvedValue(updatedUser);

      const result = await controller.updateImage(mockCurrentUser, mockFile);

      expect(result).toEqual(updatedUser);
      expect(service.updateImageById).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'new-profile.jpg',
      );
    });

    it('should throw error if no file uploaded', async () => {
      const mockCurrentUser = { userId: '507f1f77bcf86cd799439011' };

      await expect(
        controller.updateImage(mockCurrentUser, null),
      ).rejects.toThrow('No image uploaded');
    });
  });

  describe('sendVerification', () => {
    it('should send verification code', async () => {
      const mockCurrentUser = { userId: '507f1f77bcf86cd799439011' };
      mockUsersService.sendVerificationCodeById.mockResolvedValue({
        message: 'Verification code sent to email',
      });

      const result = await controller.sendVerification(mockCurrentUser);

      expect(result).toEqual({ message: 'Verification code sent to email' });
      expect(service.sendVerificationCodeById).toHaveBeenCalledWith(
        mockCurrentUser.userId,
      );
    });
  });

  describe('verifyMe', () => {
    it('should verify email', async () => {
      const mockCurrentUser = { userId: '507f1f77bcf86cd799439011' };
      const body: CreateMailDto = { code: '123456' };
      mockUsersService.verifyEmailById.mockResolvedValue({
        message: 'Email verified successfully',
      });

      const result = await controller.verifyMe(mockCurrentUser, body);

      expect(result).toEqual({ message: 'Email verified successfully' });
      expect(service.verifyEmailById).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        '123456',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset code', async () => {
      const body: ForgotPasswordDto = { email: 'test@example.com' };
      mockUsersService.sendPasswordResetCode.mockResolvedValue({
        message: 'Password reset code sent to your email',
      });

      const result = await controller.forgotPassword(body);

      expect(result).toEqual({
        message: 'Password reset code sent to your email',
      });
      expect(service.sendPasswordResetCode).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const body: ResetPasswordDto = {
        code: '123456',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      mockUsersService.resetPassword.mockResolvedValue({
        message: 'Password reset successful',
      });

      const result = await controller.resetPassword(body);

      expect(result).toEqual({ message: 'Password reset successful' });
      expect(service.resetPassword).toHaveBeenCalledWith(
        '123456',
        'newPassword123',
        'newPassword123',
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
      };
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        '507f1f77bcf86cd799439011',
        updateUserDto,
      );

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateUserDto,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
      };
      mockUsersService.update.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.update('invalid-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
