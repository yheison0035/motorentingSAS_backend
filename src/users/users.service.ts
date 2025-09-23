import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los usuarios (solo ADMIN)
  async getUsers(user: any) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede listar usuarios');
    }

    const users = await this.prisma.user.findMany();
    return {
      success: true,
      message: 'Usuarios obtenidos correctamente',
      data: users,
    };
  }

  // Obtener un usuario
  async getUser(id: number, user?: any) {
    const found = await this.prisma.user.findUnique({ where: { id } });
    if (!found)
      throw new NotFoundException(`Usuario con id ${id} no fue encontrado`);

    if (user && user.role === Role.ASESOR && user.userId !== id) {
      throw new ForbiddenException('No tienes permiso para ver este usuario');
    }

    return {
      success: true,
      message: 'Usuario obtenido',
      data: {
        ...found,
        birthdate: formatDate(found.birthdate),
      },
    };
  }

  // Crear usuario
  async createUser(dto: CreateUserDto, user?: any) {
    if (user && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede crear usuarios');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`El email ${dto.email} ya está registrado`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name?.trim(),
        birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
        phone: dto.phone?.trim(),
        address: dto.address?.trim(),
        city: dto.city?.trim(),
        department: dto.department?.trim(),
        document: dto.document?.trim(),
        role: dto.role ?? Role.ASESOR,
        status: dto.status ?? 'ACTIVE',
      },
    });

    return {
      success: true,
      message: 'Usuario creado exitosamente',
      data: created,
    };
  }

  // Actualizar usuario
  async updateUser(id: number, dto: UpdateUserDto, user?: any) {
    const found = await this.prisma.user.findUnique({ where: { id } });
    if (!found)
      throw new NotFoundException(`Usuario con id ${id} no fue encontrado`);

    if (user && user.role === Role.ASESOR && user.userId !== id) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este usuario',
      );
    }

    if (dto.birthdate) dto.birthdate = new Date(dto.birthdate as any) as any;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        password: dto.password
          ? await bcrypt.hash(dto.password, 10)
          : found.password,
      },
    });

    return { success: true, message: 'Usuario actualizado', data: updated };
  }

  // Eliminar usuario (solo ADMIN)
  async deleteUser(id: number, user: any) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede eliminar usuarios');
    }

    const found = await this.prisma.user.findUnique({ where: { id } });
    if (!found)
      throw new NotFoundException(`Usuario con id ${id} no fue encontrado`);

    await this.prisma.user.delete({ where: { id } });

    return { success: true, message: 'Usuario eliminado correctamente' };
  }

  // Alternar rol (solo ADMIN)
  async updateUserSegment(id: number, user: any) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede cambiar roles');
    }

    const found = await this.prisma.user.findUnique({ where: { id } });
    if (!found)
      throw new NotFoundException(`Usuario con id ${id} no fue encontrado`);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: found.role === Role.ADMIN ? Role.ASESOR : Role.ADMIN },
    });

    return { success: true, message: 'Rol actualizado', data: updated };
  }
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0]; // yyyy-mm-dd
}
