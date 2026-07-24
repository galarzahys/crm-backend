import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitado para que el frontend Angular (en otro puerto/origen durante
  // el desarrollo, y potencialmente otro dominio en producción) pueda
  // consumir la API. CORS_ORIGIN admite una lista separada por comas.
  const origenesPermitidos = (process.env.CORS_ORIGIN ?? 'http://localhost:4200').split(',').map((o) => o.trim());
  app.enableCors({ origin: origenesPermitidos, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gestión App API')
    .setDescription('API REST para el backend de Gestión App (artículos, atributos, presupuestos, listas de precios).')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto);
  // eslint-disable-next-line no-console
  console.log(`Gestión App API corriendo en http://localhost:${puerto} (docs en /api/docs)`);
}
bootstrap();
