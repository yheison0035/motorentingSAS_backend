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
  @IsEnum(DeliveryState)
  deliveryState?: DeliveryState;

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
