import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import {
  ValidateIf,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { DeliveryState } from '@prisma/client';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ValidateIf((o) => o.deliveryState === DeliveryState.ENTREGADO)
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
}
