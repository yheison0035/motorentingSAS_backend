import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssignMultipleDto } from './dto/assign-multiple.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  // GET /customers
  // ADMIN: obtiene todos los clientes con comentarios y asesor asignado
  // ASESOR: solo sus clientes
  @Get()
  getAllCustomers(@Req() req) {
    return this.customersService.getCustomers(req.user);
  }

  // GET /customers/delivered
  // ADMIN: todos los entregados
  // ASESOR: solo sus entregados
  @Get('/delivered')
  getDeliveredCustomers(@Req() req) {
    return this.customersService.getDeliveredCustomers(req.user);
  }

  // GET /customers/:id
  // ADMIN puede consultar cualquier cliente
  // ASESOR solo puede ver sus clientes
  @Get('/:id')
  getCustomerById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.customersService.getCustomerById(id, req.user);
  }

  // POST /customers
  // Crea un cliente
  // ADMIN puede asignar cualquier asesor
  // ASESOR solo se asigna a sí mismo
  @Post()
  createCustomer(@Body() dto: CreateCustomerDto, @Req() req) {
    return this.customersService.createCustomer(dto, req.user);
  }

  // PUT /customers/:id
  // Actualiza un cliente existente
  // ADMIN puede actualizar cualquiera
  // ASESOR solo sus clientes
  @Put('/:id')
  updateCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
    @Req() req,
  ) {
    return this.customersService.updateCustomer(id, dto, req.user);
  }

  // DELETE /customers/:id
  // Solo ADMIN puede eliminar clientes
  @Delete('/:id')
  deleteCustomer(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.customersService.deleteCustomer(id, req.user);
  }

  // POST /customers/:id/comments
  // Agrega un comentario al cliente
  // ADMIN: cualquier cliente
  // ASESOR: solo sus clientes
  @Post('/:id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCommentDto,
    @Req() req,
  ) {
    return this.customersService.addComment(id, dto.description, req.user);
  }

  // POST /customers/:id/assign/:advisorId
  // Reasigna un cliente a otro asesor
  // Solo ADMIN puede usar
  @Post('/:id/assign/:advisorId')
  assignAdvisor(
    @Param('id', ParseIntPipe) id: number,
    @Param('advisorId', ParseIntPipe) advisorId: number,
    @Req() req,
  ) {
    return this.customersService.assignAdvisor(id, advisorId, req.user);
  }

  // POST /customers/assign-multiple
  // Asigna múltiples clientes a un asesor
  // Solo ADMIN puede usar
  @Post('/assign-multiple')
  assignMultipleCustomers(@Body() dto: AssignMultipleDto, @Req() req) {
    return this.customersService.assignMultipleCustomers(dto, req.user);
  }

  // POST /customers/import con form-data (campo: file)
  // Importar clientes desde Excel
  // Solo ADMIN puede usar
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCustomers(@UploadedFile() file: Express.Multer.File, @Req() req) {
    return this.customersService.importCustomers(file, req.user);
  }
}
