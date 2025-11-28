import { PartialType } from '@nestjs/swagger';
import { CreateApireviewDto } from './create-apireview.dto';

export class UpdateApireviewDto extends PartialType(CreateApireviewDto) {}
