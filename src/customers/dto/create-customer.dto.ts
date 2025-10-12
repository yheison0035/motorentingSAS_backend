import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsInt,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { DeliveryState } from '@prisma/client';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsDateString()
  birthdate: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  document: string;

  @IsOptional()
  @IsEnum(DeliveryState)
  deliveryState?: DeliveryState;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ValidateIf((o) => o.deliveryState === DeliveryState.ENTREGADO)
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsInt()
  advisorId?: number;

  @IsOptional()
  @IsInt()
  stateId?: number;
}
