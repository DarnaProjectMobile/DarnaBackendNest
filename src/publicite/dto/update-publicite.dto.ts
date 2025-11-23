import { PartialType } from '@nestjs/mapped-types';
import { CreatePubliciteDto } from './create-publicite.dto';

export class UpdatePubliciteDto extends PartialType(CreatePubliciteDto) {}

