import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsDateString()
  birthdate: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  department: string;

  @IsString()
  document: string;

  @IsOptional()
  @IsString()
  delivered?: string;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsInt()
  advisorId?: number;

  @IsOptional()
  @IsInt()
  stateId?: number;
}
