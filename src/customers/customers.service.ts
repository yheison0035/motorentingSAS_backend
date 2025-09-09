import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Role } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // Obtener clientes según rol
  async getCustomers(user: any) {
    if (user.role === Role.ADMIN) {
      return this.prisma.customer.findMany({
        include: { advisor: true, comments: true, state: true },
      });
    }

    return this.prisma.customer.findMany({
      where: { advisorId: user.userId },
      include: { advisor: true, comments: true, state: true },
    });
  }

  // Obtener cliente por ID
  async getCustomerById(id: number, user: any) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { advisor: true, comments: true, state: true },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (user.role === Role.ASESOR && customer.advisorId !== user.userId) {
      throw new ForbiddenException('No tienes permiso para ver este cliente');
    }

    return customer;
  }

  // Crear cliente
  async createCustomer(dto: CreateCustomerDto, user: any) {
    // Validar duplicado
    const existing = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException(
        `El cliente con email ${dto.email} ya existe`,
      );
    }

    // Determinar asesor asignado
    let advisorId: number | null | undefined = dto.advisorId;
    if (user.role === Role.ASESOR) {
      advisorId = user.userId;
    } else if (user.role === Role.ADMIN && !dto.advisorId) {
      advisorId = null;
    }

    const birthdate = new Date(dto.birthdate);

    // Determinar estado asignado
    let stateId = dto.stateId;
    if (!stateId) {
      const defaultState = await this.prisma.state.findUnique({
        where: { name: 'Sin Contactar' },
      });
      stateId = defaultState?.id;
    }

    return this.prisma.customer.create({
      data: {
        name: dto.name,
        email: dto.email,
        birthdate,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        department: dto.department,
        document: dto.document,
        delivered: dto.delivered,
        plateNumber: dto.plateNumber,
        advisorId,
        stateId,
      },
      include: {
        advisor: { select: { id: true, email: true } },
        state: true,
      },
    });
  }

  // Actualizar cliente
  async updateCustomer(id: number, dto: UpdateCustomerDto, user: any) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    if (user.role === Role.ASESOR && customer.advisorId !== user.userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    if (dto.birthdate) {
      dto.birthdate = new Date(dto.birthdate as any) as any;
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
      include: { advisor: true, state: true },
    });
  }

  // Eliminar cliente (solo ADMIN)
  async deleteCustomer(id: number, user: any) {
    if (user.role !== Role.ADMIN)
      throw new ForbiddenException('Solo el ADMIN puede eliminar clientes');

    return this.prisma.customer.delete({ where: { id } });
  }

  // Agregar comentario
  async addComment(customerId: number, description: string, user: any) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    if (user.role === Role.ASESOR && customer.advisorId !== user.userId) {
      throw new ForbiddenException('No puedes comentar este cliente');
    }

    return this.prisma.comment.create({
      data: { description, customerId, createdById: user.userId },
    });
  }

  // Reasignar cliente (solo ADMIN)
  async assignAdvisor(customerId: number, advisorId: number, user: any) {
    if (user.role !== Role.ADMIN)
      throw new ForbiddenException('Solo ADMIN puede reasignar asesores');

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { advisorId },
      include: { advisor: true, state: true },
    });
  }
}
