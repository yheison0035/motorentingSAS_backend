import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
/* import * as bcrypt from 'bcrypt'; */

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos que no estén en el DTO
      forbidNonWhitelisted: true, // lanza error si envías campos extra
      transform: true, // transforma los tipos (ej: "123" → number si espera number)
    }),
  );

  /* const hash = await bcrypt.hash('123456', 10);
  console.log(hash); */

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API_MotorentingSAS')
    .setDescription('Documentación y pruebas de la API')
    .setVersion('1.0')
    .addBearerAuth() // si quieres probar con JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Ruta => http://localhost:3000/api-docs

  app.enableCors();

  await app.listen(3000);
}
bootstrap();
