import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { CreateMotivationDto } from './dto/create-motivation.dto';
import { UpdateMotivationDto } from './dto/update-motivation.dto';

@Controller('motivation')
export class MotivationController {
  constructor(private motivationService: MotivationService) {}

  @Get()
  getMessage() {
    return this.motivationService.getMessage();
  }

  @Post()
  create(@Body() dto: CreateMotivationDto) {
    return this.motivationService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMotivationDto,
  ) {
    return this.motivationService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.motivationService.delete(id);
  }
}
