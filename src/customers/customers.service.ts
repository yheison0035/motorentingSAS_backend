import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Role } from '@prisma/client';
import * as XLSX from 'xlsx';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AssignMultipleDto } from './dto/assign-multiple.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // Obtener clientes según rol
  async getCustomers(user: any) {
    const customers =
      user.role === Role.ADMIN
        ? await this.prisma.customer.findMany({
            include: { advisor: true, comments: true, state: true },
            orderBy: { updatedAt: 'desc' },
          })
        : await this.prisma.customer.findMany({
            where: { advisorId: user.userId },
            include: { advisor: true, comments: true, state: true },
            orderBy: { updatedAt: 'desc' },
          });

    return {
      success: true,
      message: 'Clientes obtenidos correctamente',
      data: customers,
    };
  }

  // Obtener cliente por ID
  async getCustomerById(id: number, user: any) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        advisor: true,
        state: true,
        comments: {
          include: { createdBy: true },
        },
      },
    });

    if (!customer) throw new NotFoundException('Cliente no encontrado');

    if (user.role === Role.ASESOR && customer.advisorId !== user.userId) {
      throw new ForbiddenException('No tienes permiso para ver este cliente');
    }

    return {
      success: true,
      message: 'Cliente obtenido',
      data: {
        ...customer,
        birthdate: formatDate(customer.birthdate),
      },
    };
  }

  // Crear cliente
  async createCustomer(dto: CreateCustomerDto, user: any) {
    const existing = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException(
        `El cliente con email ${dto.email} ya existe`,
      );
    }

    let advisorId: number | null | undefined = dto.advisorId;
    if (user.role === Role.ASESOR) {
      advisorId = user.userId;
    } else if (user.role === Role.ADMIN && !dto.advisorId) {
      advisorId = null;
    }

    const birthdate = new Date(dto.birthdate);

    let stateId = dto.stateId;
    if (!stateId) {
      const defaultState = await this.prisma.state.findUnique({
        where: { name: 'Sin Contactar' },
      });
      stateId = defaultState?.id;
    }

    const customer = await this.prisma.customer.create({
      data: {
        ...dto,
        birthdate,
        advisorId,
        stateId,
      },
      include: {
        advisor: { select: { id: true, email: true } },
        state: true,
      },
    });

    return {
      success: true,
      message: 'Cliente creado exitosamente',
      data: customer,
    };
  }

  // Actualizar cliente
  async updateCustomer(id: number, dto: UpdateCustomerDto, user: any) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    if (user.role === Role.ASESOR && customer.advisorId !== user.userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    if (dto.birthdate) dto.birthdate = new Date(dto.birthdate as any) as any;

    const updated = await this.prisma.customer.update({
      where: { id },
      data: { ...dto },
      include: { advisor: true, state: true },
    });

    return { success: true, message: 'Cliente actualizado', data: updated };
  }

  // Eliminar cliente
  async deleteCustomer(id: number, user: any) {
    if (user.role !== Role.ADMIN)
      throw new ForbiddenException('Solo el ADMIN puede eliminar clientes');

    await this.prisma.customer.delete({ where: { id } });

    return { success: true, message: 'Cliente eliminado correctamente' };
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

    const comment = await this.prisma.comment.create({
      data: { description, customerId, createdById: user.userId },
      include: { createdBy: true },
    });

    return { success: true, message: 'Comentario agregado', data: comment };
  }

  // Reasignar cliente a un asesor
  async assignAdvisor(customerId: number, advisorId: number, user: any) {
    if (user.role !== Role.ADMIN)
      throw new ForbiddenException('Solo ADMIN puede reasignar asesores');

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: { advisorId },
      include: { advisor: true, state: true },
    });

    return { success: true, message: 'Cliente reasignado', data: updated };
  }

  // Reasignar múltiples clientes
  async assignMultipleCustomers(dto: AssignMultipleDto, user: any) {
    if (user.role !== Role.ADMIN)
      throw new ForbiddenException(
        'Solo ADMIN puede asignar múltiples clientes',
      );

    const { customerIds, advisorId } = dto;

    const result = await this.prisma.customer.updateMany({
      where: { id: { in: customerIds } },
      data: { advisorId },
    });

    return {
      success: true,
      message: `${result.count} clientes reasignados al asesor ${advisorId}`,
      data: result,
    };
  }

  // Importar clientes desde Excel (solo ADMIN)
  async importCustomers(file: Express.Multer.File, user: any) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede importar clientes');
    }

    // Leer archivo Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      throw new BadRequestException('El archivo está vacío o mal formateado');
    }

    // Buscar el estado por defecto "Sin Contactar"
    const defaultState = await this.prisma.state.findUnique({
      where: { name: 'Sin Contactar' },
    });

    if (!defaultState) {
      throw new NotFoundException(
        'No se encontró el estado por defecto "Sin Contactar"',
      );
    }

    // Normalizar datos de clientes
    const customersData = rows.map((row) => {
      const customer: any = {
        name: row['name']?.trim(),
        email: row['email']?.trim(),
        phone: row['phone']?.toString().trim(),
        address: row['address']?.trim(),
        city: row['city']?.trim(),
        department: row['department']?.trim(),
        document: row['document']?.toString().trim(),
        stateId: defaultState.id, // se asigna el estado "Sin Contactar"
      };

      // Solo incluir birthdate si viene y es válido
      if (row['birthdate']) {
        const parsed = new Date(row['birthdate']);
        if (!isNaN(parsed.getTime())) {
          customer.birthdate = parsed;
        }
      }

      return customer;
    });

    // Insertar clientes en la BD ignorando duplicados
    const result = await this.prisma.customer.createMany({
      data: customersData,
      skipDuplicates: true,
    });

    return {
      success: true,
      message: `Importación finalizada: ${result.count} clientes creados (duplicados ignorados)`,
      count: result.count,
    };
  }
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0]; // yyyy-mm-dd
}
