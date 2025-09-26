import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateMotivationDto {
  @IsString()
  title: string;

  @IsString()
  subtitle: string;

  @IsArray()
  @ArrayNotEmpty()
  items: { description: string }[];
}
