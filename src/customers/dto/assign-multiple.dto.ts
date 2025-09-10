import { IsArray, IsInt } from 'class-validator';

export class AssignMultipleDto {
  @IsArray()
  customerIds: number[];

  @IsInt()
  advisorId: number;
}
