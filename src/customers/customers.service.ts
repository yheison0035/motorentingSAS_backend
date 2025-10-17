import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Role, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AssignMultipleDto } from './dto/assign-multiple.dto';
import { hasRole } from 'src/common/role-check.util';
import { Workbook } from 'exceljs';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // Obtener clientes según rol (activos, excluye entregados)
  async getCustomers(user: any) {
    const baseWhere: any = {
      // excluimos los entregados: VENTA (id 19) con plateNumber
      NOT: {
        AND: [{ stateId: 19 }, { plateNumber: { not: null } }],
      },
    };

    const isHighRole = hasRole(user.role, [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.COORDINADOR,
    ]);

    const excludeStatesForAdvisor = ['NO INTERESADO', 'REPORTADO'];

    const whereClause = isHighRole
      ? baseWhere
      : {
          ...baseWhere,
          advisorId: user.userId,
          state: {
            name: { notIn: excludeStatesForAdvisor },
          },
        };

    const customers = await this.prisma.customer.findMany({
      where: whereClause,
      include: {
        advisor: true,
        comments: {
          include: { createdBy: true },
          orderBy: { createdAt: 'desc' },
        },
        state: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      message: 'Clientes obtenidos correctamente',
      data: customers,
    };
  }

  // Obtener clientes entregados/finalizados
  async getDeliveredCustomers(user: any) {
    const baseWhere: any = {
      stateId: 19,
      plateNumber: { not: null },
    };

    const customers = hasRole(user.role, [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.COORDINADOR,
    ])
      ? await this.prisma.customer.findMany({
          where: baseWhere,
          include: {
            advisor: true,
            comments: {
              include: { createdBy: true },
              orderBy: { createdAt: 'desc' },
            },
            state: true,
          },
          orderBy: { updatedAt: 'desc' },
        })
      : await this.prisma.customer.findMany({
          where: { ...baseWhere, advisorId: user.userId },
          include: {
            advisor: true,
            comments: {
              include: { createdBy: true },
              orderBy: { createdAt: 'desc' },
            },
            state: true,
          },
          orderBy: { updatedAt: 'desc' },
        });

    return {
      success: true,
      message: 'Clientes entregados obtenidos correctamente',
      data: customers,
    };
  }

  async exportDeliveredCustomersExcel(user: any): Promise<ArrayBuffer> {
    const { data } = await this.getDeliveredCustomers(user);
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Clientes Entregados');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nombre', key: 'name', width: 25 },
      { header: 'Documento', key: 'document', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Fecha de Nacimiento', key: 'birthdate', width: 25 },
      { header: 'Dirección', key: 'address', width: 25 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Ciudad', key: 'city', width: 20 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Placa', key: 'plateNumber', width: 15 },
      { header: 'Estado', key: 'state', width: 20 },
      { header: 'Asesor', key: 'advisor', width: 25 },
      { header: 'Fecha Entrega', key: 'deliveryDate', width: 20 },
      { header: 'Estado Entrega', key: 'deliveryState', width: 20 },
      { header: 'Fecha Creación', key: 'createdAt', width: 20 },
      { header: 'Ultima Actualización', key: 'updatedAt', width: 20 },
    ];

    data?.forEach((c) => {
      sheet.addRow({
        id: c.id,
        name: c.name,
        document: c.document,
        email: c.email,
        birthdate: c.birthdate
          ? new Date(c.birthdate).toLocaleDateString('es-CO')
          : '',
        address: c.address,
        phone: c.phone,
        city: c.city,
        department: c.department,
        plateNumber: c.plateNumber,
        state: c.state?.name,
        advisor: c.advisor?.name || c.advisor?.email || '',
        deliveryDate: c.deliveryDate
          ? new Date(c.deliveryDate).toLocaleDateString('es-CO')
          : '',
        deliveryState: c.deliveryState,
        createdAt: new Date(c.createdAt).toLocaleDateString('es-CO'),
        updatedAt: new Date(c.updatedAt).toLocaleDateString('es-CO'),
      });
    });

    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
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
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new NotFoundException('Cliente no encontrado');

    if (
      hasRole(user.role, [Role.ASESOR]) &&
      customer.advisorId !== user.userId
    ) {
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
    const existing = await this.prisma.customer.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException(
        `El cliente con email ${dto.email} ya existe`,
      );
    }

    let advisorId: number | null | undefined = dto.advisorId;
    if (hasRole(user.role, [Role.ASESOR])) {
      advisorId = user.userId;
    } else if (
      hasRole(user.role, [Role.SUPER_ADMIN, Role.ADMIN]) &&
      !dto.advisorId
    ) {
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

    if (dto.birthdate) dto.birthdate = new Date(dto.birthdate as any) as any;

    if (
      (dto.deliveryState === 'ENTREGADO' || dto.stateId === 19) &&
      !customer.deliveryDate
    ) {
      dto.deliveryDate = new Date().toISOString(); // guarda fecha actual
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        advisor: true,
        state: true,
        comments: { include: { createdBy: true } },
      },
    });

    return {
      success: true,
      message: 'Cliente actualizado con éxito',
      data: updated,
    };
  }

  // Eliminar cliente
  async deleteCustomer(id: number, user: any) {
    if (!hasRole(user.role, [Role.SUPER_ADMIN]))
      throw new ForbiddenException('No tienes permisos');

    await this.prisma.customer.delete({ where: { id } });

    return { success: true, message: 'Cliente eliminado correctamente' };
  }

  // Agregar comentario
  async addComment(
    customerId: number,
    description: string,
    user: { userId: number },
  ) {
    const comment = await this.prisma.comment.create({
      data: {
        description,
        customerId,
        createdById: user.userId,
      },
      include: { createdBy: true },
    });

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      message: 'Comentario agregado correctamente',
      data: comment,
    };
  }

  // Reasignar cliente a un asesor
  async assignAdvisor(customerId: number, advisorId: number, user: any) {
    if (!hasRole(user.role, [Role.SUPER_ADMIN, Role.ADMIN, Role.COORDINADOR]))
      throw new ForbiddenException('No tienes permisos');

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: { advisorId },
      include: { advisor: true, state: true },
    });

    return { success: true, message: 'Cliente reasignado', data: updated };
  }

  // Reasignar múltiples clientes
  async assignMultipleCustomers(dto: AssignMultipleDto, user: any) {
    if (!hasRole(user.role, [Role.SUPER_ADMIN, Role.ADMIN, Role.COORDINADOR]))
      throw new ForbiddenException('No tienes permisos');

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

  // Importar clientes desde Excel (solo SUPER_ADMIN, ADMIN Y COORDINADOR)
  async importCustomers(file: Express.Multer.File, user: any) {
    if (!hasRole(user.role, [Role.SUPER_ADMIN, Role.ADMIN, Role.COORDINADOR])) {
      throw new ForbiddenException('No tienes permisos para importar clientes');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      throw new BadRequestException('El archivo está vacío o mal formateado');
    }

    const defaultState = await this.prisma.state.findUnique({
      where: { name: 'Sin Contactar' },
    });

    if (!defaultState) {
      throw new NotFoundException(
        'No se encontró el estado por defecto "Sin Contactar"',
      );
    }

    // Columnas válidas según tu modelo
    const validColumns = [
      'name',
      'email',
      'phone',
      'address',
      'city',
      'department',
      'document',
      'birthdate',
      'plateNumber',
      'deliveryDate',
      'deliveryState',
    ];

    const customersData: Prisma.CustomerCreateManyInput[] = [];

    for (const [index, row] of rows.entries()) {
      const name = row['name']?.toString().trim();
      const phone = row['phone']?.toString().trim();

      if (!name || !phone) {
        console.warn(`Fila ${index + 2} omitida: faltan campos requeridos`);
        continue;
      }

      const customer: any = {
        name,
        email: null,
        phone,
        stateId: defaultState.id,
        address: null,
        city: null,
        department: null,
        document: null,
        birthdate: null,
        plateNumber: null,
        deliveryDate: null,
        deliveryState: null,
      };

      // Copiar dinámicamente las columnas que existan
      for (const key of validColumns) {
        if (['name', 'phone'].includes(key)) continue;
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          if (['birthdate', 'deliveryDate'].includes(key)) {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) customer[key] = parsed;
          } else {
            customer[key] = value.toString().trim();
          }
        }
      }

      customersData.push(customer);
    }

    if (!customersData.length) {
      throw new BadRequestException(
        'No se encontraron filas válidas para importar',
      );
    }

    const result = await this.prisma.customer.createMany({
      data: customersData,
      skipDuplicates: true,
    });

    return {
      success: true,
      message: `Importación completada: ${result.count} clientes creados (duplicados ignorados)`,
      count: result.count,
    };
  }
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0]; // yyyy-mm-dd
}
