import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('MotorentingSAS')
    .setDescription('Documentación y pruebas de la API')
    .setVersion('1.0')
    .addBearerAuth() // si quieres probar con JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Ruta => http://localhost:3000/api-docs

  await app.listen(3001);
}
bootstrap();
