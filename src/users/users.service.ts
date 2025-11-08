import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { randomInt } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  // Create user
  async createUser(dto: CreateUserDto, image?: string): Promise<User> {
    const existingUser = await this.userModel.findOne({
      $or: [{ email: dto.email }],
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const createdUser = new this.userModel({
      ...dto,
      password: hashed,
      image,
    });

    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async updateImage(username: string, image: string) {
    return this.userModel.findOneAndUpdate(
      { username },
      { image },
      { new: true },
    );
  }

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId);
  }

  async updateImageById(
    userId: string,
    filename: string,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { image: filename }, { new: true })
      .exec();
  }

  // Step 1: Send verification code
  async sendVerificationCodeById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const code = String(randomInt(100000, 999999));
    user.verificationCode = code;
    await user.save();

    console.log(
      '✅ Sending verification email to:',
      user.email,
      'with code:',
      code,
    );
    try {
      await this.mailService.sendVerificationEmail(user.email, code);
      console.log('✅ Email sent successfully');
    } catch (err) {
      console.error('❌ Error sending email:', err);
      throw new Error('Email sending failed');
    }

    return { message: 'Verification code sent to email' };
  }

  // Step 2: Verify code
  async verifyEmailById(userId: string, code: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async sendPasswordResetCode(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new BadRequestException('User not found');

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    await user.save();

    await this.mailService.sendMail({
      to: email,
      subject: 'Password Reset Code',
      text: `Your password reset code is ${resetCode}`,
    });

    return { message: 'Password reset code sent to your email' };
  }

  async resetPassword(
    code: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const user = await this.userModel.findOne({ resetCode: code });
    if (!user) throw new BadRequestException('Invalid or expired code');

    if (newPassword !== confirmPassword)
      throw new BadRequestException('Passwords do not match');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = undefined;
    await user.save();

    return { message: 'Password reset successful' };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateData: any = { ...updateUserDto };

    // Si le mot de passe est fourni, le hasher
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
