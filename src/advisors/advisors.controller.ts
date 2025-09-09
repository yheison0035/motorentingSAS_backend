import { Controller, Delete, Get, Patch, Post, Put } from '@nestjs/common';
import { AdvisorsService } from './advisors.service';

@Controller('/advisors')
export class AdvisorsController {
  constructor(private advisorsService: AdvisorsService) {}
  @Get()
  getAllAdvisors() {
    return this.advisorsService.getAdvisors();
  }

  @Post()
  createAdvisor() {
    return this.advisorsService.createAdvisor();
  }

  @Put()
  updateAdvisor() {
    return this.advisorsService.updateAdvisor();
  }

  @Delete()
  deleteAdvisor() {
    return this.advisorsService.deleteAdvisor();
  }

  @Patch()
  updateAdvisorSegment() {
    return this.advisorsService.updateAdvisorSegment();
  }
}
