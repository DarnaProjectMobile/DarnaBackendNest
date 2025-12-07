import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleReactionDto {
    @ApiProperty({ description: 'Emoji de la réaction', example: '👍' })
    @IsString()
    @IsNotEmpty()
    emoji: string;
}
