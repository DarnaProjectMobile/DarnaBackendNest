import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<UserDocument>;
  let mailService: MailService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'Client',
    dateDeNaissance: '1990-01-01',
    numTel: '12345678',
    gender: 'Male',
    image: 'profile.jpg',
    credits: 0,
    ratingAvg: 0,
    badges: [],
    isVerified: false,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockUserModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    new: jest.fn().mockResolvedValue(mockUser),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'Client' as any,
      dateDeNaissance: '1990-01-01',
      numTel: '12345678',
      gender: 'Male' as any,
    };

    it('should create a new user', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const saveMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.create = jest.fn().mockReturnValue({
        save: saveMock,
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.createUser(createUserDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [{ email: createUserDto.email }],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserModel.findOne).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser, mockUser];
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(users),
      });

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockUserModel.find).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should return null if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      username: 'updateduser',
      email: 'updated@example.com',
    };

    it('should update a user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateUserDto,
      );

      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateUserDto,
        { new: true },
      );
    });

    it('should hash password if provided in update', async () => {
      const updateWithPassword: UpdateUserDto = {
        password: 'newPassword123',
      };
      const updatedUser = { ...mockUser, password: 'hashedNewPassword' };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedNewPassword' as never);

      await service.update('507f1f77bcf86cd799439011', updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('invalid-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await service.remove('507f1f77bcf86cd799439011');

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sendVerificationCodeById', () => {
    it('should send verification code', async () => {
      const userWithSave = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockResolvedValue(userWithSave);

      const result = await service.sendVerificationCodeById(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toEqual({ message: 'Verification code sent to email' });
      expect(mockUserModel.findById).toHaveBeenCalled();
      expect(userWithSave.save).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.sendVerificationCodeById('invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmailById', () => {
    it('should verify email with correct code', async () => {
      const userWithCode = {
        ...mockUser,
        verificationCode: '123456',
        save: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockResolvedValue(userWithCode);

      const result = await service.verifyEmailById(
        '507f1f77bcf86cd799439011',
        '123456',
      );

      expect(result).toEqual({ message: 'Email verified successfully' });
      expect(userWithCode.isVerified).toBe(true);
      expect(userWithCode.verificationCode).toBeUndefined();
    });

    it('should throw BadRequestException with invalid code', async () => {
      const userWithCode = {
        ...mockUser,
        verificationCode: '123456',
        save: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockResolvedValue(userWithCode);

      await expect(
        service.verifyEmailById('507f1f77bcf86cd799439011', 'wrong-code'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendPasswordResetCode', () => {
    it('should send password reset code', async () => {
      const userWithSave = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findOne.mockResolvedValue(userWithSave);

      const result = await service.sendPasswordResetCode('test@example.com');

      expect(result).toEqual({
        message: 'Password reset code sent to your email',
      });
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mailService.sendMail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.sendPasswordResetCode('notfound@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid code', async () => {
      const userWithResetCode = {
        ...mockUser,
        resetCode: '123456',
        save: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findOne.mockResolvedValue(userWithResetCode);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.resetPassword(
        '123456',
        'newPassword',
        'newPassword',
      );

      expect(result).toEqual({ message: 'Password reset successful' });
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(userWithResetCode.resetCode).toBeUndefined();
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const userWithResetCode = {
        ...mockUser,
        resetCode: '123456',
      };
      mockUserModel.findOne.mockResolvedValue(userWithResetCode);

      await expect(
        service.resetPassword('123456', 'newPassword', 'differentPassword'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with invalid code', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-code', 'newPassword', 'newPassword'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
