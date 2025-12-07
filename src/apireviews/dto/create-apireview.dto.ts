import { IsString, IsNotEmpty } from 'class-validator';

export class CreateApireviewDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
