import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiProperty({ description: 'ID du message à marquer comme lu' })
  @IsString()
  @IsNotEmpty()
  messageId: string;
}


















