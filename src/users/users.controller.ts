import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Solo ADMIN puede listar todos los usuarios
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  getAllUsers(@Req() req) {
    return this.usersService.getUsers(req.user); // se pasa user para validar permisos en el service
  }

  // ADMIN puede consultar cualquier usuario
  // ASESOR solo puede consultar su propio perfil
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  getUser(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.getUser(id, req.user);
  }

  // Solo ADMIN puede crear usuarios
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  createUser(@Body() user: CreateUserDto, @Req() req) {
    return this.usersService.createUser(user, req.user);
  }

  // ADMIN puede actualizar cualquier usuario
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() user: UpdateUserDto,
    @Req() req,
  ) {
    return this.usersService.updateUser(id, user, req.user);
  }

  // ADMIN puede eliminar usuarios
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.deleteUser(id, req.user);
  }

  // ADMIN puede alternar rol (ejemplo)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('/:id/toggle-role')
  updateUserSegment(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.updateUserSegment(id, req.user);
  }
}
