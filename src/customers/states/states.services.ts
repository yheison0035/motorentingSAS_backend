import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StatesService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los estados
  async getAllStates() {
    return this.prisma.state.findMany({
      orderBy: { id: 'asc' },
    });
  }

  // Obtener un estado por ID
  async getStateById(id: number) {
    const state = await this.prisma.state.findUnique({
      where: { id },
    });

    if (!state) {
      throw new NotFoundException(`El estado con ID ${id} no existe`);
    }

    return state;
  }
}
