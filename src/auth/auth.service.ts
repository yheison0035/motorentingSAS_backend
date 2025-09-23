import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.createUser(dto);
    return { message: 'Usuario creado', user };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      success: true,
      message: 'Login exitoso',
      data: {
        access_token: await this.jwtService.signAsync(payload),
        user,
      },
    };
  }

  async validateUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    // ahora getUser devuelve { success, message, data }
    const result = await this.usersService.getUser(userId, {
      role: 'ADMIN',
      userId,
    });

    if (!result.success || !result.data) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const user = result.data;

    // Validar contraseña actual
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Contraseña actualizada correctamente' };
  }
}
