import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTokenDto {
  @ApiProperty({
    description: 'Token FCM (Firebase Cloud Messaging) de l\'appareil',
    example: 'dGhpcyBpcyBhIGZha2UgZmNtIHRva2VuIGZvciB0ZXN0aW5n',
    required: true,
  })
  @IsString()
  fcmToken: string;

  @ApiProperty({
    description: 'Plateforme de l\'appareil',
    enum: ['ANDROID', 'IOS', 'WEB'],
    example: 'ANDROID',
    required: true,
  })
  @IsIn(['ANDROID', 'IOS', 'WEB'])
  platform: 'ANDROID' | 'IOS' | 'WEB';
}



