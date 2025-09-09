import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { StatesService } from './states.services';

@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  // GET /states → lista todos los estados
  @Get()
  getAllStates() {
    return this.statesService.getAllStates();
  }

  // GET /states/:id → obtiene un estado específico
  @Get(':id')
  getStateById(@Param('id', ParseIntPipe) id: number) {
    return this.statesService.getStateById(id);
  }
}
