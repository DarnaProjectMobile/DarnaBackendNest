import { PartialType } from '@nestjs/swagger';
import { CreatePubliciteDto } from './create-publicite.dto';

export class UpdatePubliciteDto extends PartialType(CreatePubliciteDto) {}
