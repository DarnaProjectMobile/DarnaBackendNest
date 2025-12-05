import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
    @ApiProperty({
        description: 'Nouveau statut du message',
        enum: ['sent', 'delivered', 'read']
    })
    @IsString()
    @IsIn(['sent', 'delivered', 'read'])
    status: string;
}
