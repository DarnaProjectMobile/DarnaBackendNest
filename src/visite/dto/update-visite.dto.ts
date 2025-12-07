import { PartialType } from '@nestjs/swagger';
import { CreateVisiteDto } from './create-visite.dto';

export class UpdateVisiteDto extends PartialType(CreateVisiteDto) {}
