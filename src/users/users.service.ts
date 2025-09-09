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

    // 2️⃣ Encriptar contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3️⃣ Crear usuario
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role ?? Role.ASESOR,
      },
    });
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con id ${id} no fue encontrado.`);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        role: (dto.role as Role) ?? existingUser.role,
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
