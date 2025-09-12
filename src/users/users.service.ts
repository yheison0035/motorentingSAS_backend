import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no fue encontrado.`);
    }
    return user;
  }

  async getUsers() {
    return this.prisma.user.findMany();
  }

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(`El email ${dto.email} ya está registrado`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name ?? undefined,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
        phone: dto.phone ?? undefined,
        address: dto.address ?? undefined,
        city: dto.city ?? undefined,
        document: dto.document ?? undefined,
        role: dto.role ?? Role.ASESOR,
        status: dto.status ?? 'ACTIVE',
      },
    });
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con id ${id} no fue encontrado.`);
    }

    if (dto.birthdate) dto.birthdate = new Date(dto.birthdate as any) as any;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        password: dto.password
          ? await bcrypt.hash(dto.password, 10)
          : existingUser.password,
      },
    });
  }

  async deleteUser(id: number) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con id ${id} no fue encontrado.`);
    }

    return this.prisma.user.delete({ where: { id } });
  }

  async updateUserSegment(id: number) {
    const user = await this.getUser(id);
    console.log(user);
    return this.prisma.user.update({
      where: { id },
      data: { role: user.role === Role.ADMIN ? Role.ASESOR : Role.ADMIN },
    });
  }
}
