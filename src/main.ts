import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar archivos estáticos (para servir logos e imágenes)
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/', // Los archivos serán accesibles desde la raíz del dominio
  });

  const config = new DocumentBuilder()
    .setTitle('API Charlotte Core')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('Charlotte')
    .addBearerAuth(
      {
        description: `Integration API Token <JWT>`,
        name: 'Authorization',
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header'
      },
      'Token'
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Configurar validación global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina propiedades que no están en el DTO
    forbidNonWhitelisted: true, // Rechaza requests con propiedades no permitidas
    transform: true, // Transforma automáticamente los tipos
  }));
  var conf = {
    origin: "http://localhost:3000",
    // origin: " https://conecta.charlottechemical.com",
    // origin: ['http://localhost:3000', 'https://conecta.charlottechemical.com'], // o '*' para permitir todos los orígenes (no recomendado en producción)
    credentials: true
  }
  // app.enableCors({
  //   origin: "http://localhost:3000",
  //   // origin: " https://conecta.charlottechemical.com",
  //   // origin: ['http://localhost:3000', 'https://conecta.charlottechemical.com'], // o '*' para permitir todos los orígenes (no recomendado en producción)
  //   credentials: true
  // });
  app.enableCors(conf);
  // app.enableCors();
  const port = AppModule.Port || 3006;
  await app.listen(port);
  // Log the actual port the app is listening on for easier debugging when started via npm
  // This helps ensure the environment PORT is applied when npm spawns the process
  // and aids automated tests that expect the server on a known port.
  // Example output: "Server listening on port: 3006"
  // Keep console.log intentionally (not logger) so it's visible in npm start piping.
  // eslint-disable-next-line no-console
  console.log("CORS Config", conf);

  // console.log(`Server listening on port: ${port}`);
}
bootstrap();