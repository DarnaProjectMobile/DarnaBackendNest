import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMessageDto {
    @ApiProperty({ description: 'Nouveau contenu du message' })
    @IsString()
    @IsNotEmpty()
    content: string;
}
