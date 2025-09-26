import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateMotivationDto } from './dto/create-motivation.dto';
import { UpdateMotivationDto } from './dto/update-motivation.dto';

@Injectable()
export class MotivationService {
  constructor(private prisma: PrismaService) {}

  async getMessage() {
    const message = await this.prisma.motivationMessage.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (!message) throw new NotFoundException('No hay mensajes motivacionales');
    return { success: true, data: message };
  }

  async create(dto: CreateMotivationDto) {
    const created = await this.prisma.motivationMessage.create({ data: dto });
    return { success: true, message: 'Mensaje creado', data: created };
  }

  async update(id: number, dto: UpdateMotivationDto) {
    const existing = await this.prisma.motivationMessage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Mensaje no encontrado');
    const updated = await this.prisma.motivationMessage.update({
      where: { id },
      data: dto,
    });
    return { success: true, message: 'Mensaje actualizado', data: updated };
  }

  async delete(id: number) {
    await this.prisma.motivationMessage.delete({ where: { id } });
    return { success: true, message: 'Mensaje eliminado' };
  }
}
