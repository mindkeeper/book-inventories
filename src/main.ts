import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ZodExceptionFilter } from './exception-filters/zod-exception-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestMethod } from '@nestjs/common';
import { PrismaExceptionFilter } from './exception-filters/prisma-exception-filter';
import { TransformResponseInterceptor } from './utils/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('/api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  const PORT = process.env.PORT || 3000;

  // Exception Filters
  const zodExceptionFilter = new ZodExceptionFilter(configService);
  const prismaExceptionFilter = new PrismaExceptionFilter(configService);
  app.useGlobalFilters(zodExceptionFilter, prismaExceptionFilter);

  // Interceptors
  app.useGlobalInterceptors(new TransformResponseInterceptor(reflector));

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Book Inventories API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory, {
    useGlobalPrefix: false,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(PORT);
}
bootstrap();
