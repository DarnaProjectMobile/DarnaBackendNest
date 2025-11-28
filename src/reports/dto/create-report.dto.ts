import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'Inappropriate content', description: 'Report reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ example: 'User posted offensive message', description: 'Detailed description' })
  @IsString()
  @IsNotEmpty()
  details: string;
}
