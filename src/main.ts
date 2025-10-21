// we need to import instrument.ts before any other modules.
import './instrument';

import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ZodExceptionFilter } from './filters/zod-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestMethod } from '@nestjs/common';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';
import { TransformResponseInterceptor } from './utils/interceptors/response.interceptor';
import { AllExceptionFilter } from './filters/all-exception.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('/api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const httpAdapterHost = app.get(HttpAdapterHost);

  const PORT = process.env.PORT || 3000;

  // Exception Filters
  const allExceptionFilter = new AllExceptionFilter(httpAdapterHost);
  const zodExceptionFilter = new ZodExceptionFilter(configService);
  const prismaExceptionFilter = new PrismaExceptionFilter(configService);
  const httpExceptionFilter = new HttpExceptionFilter(
    configService,
    httpAdapterHost,
  );
  app.useGlobalFilters(
    allExceptionFilter,
    zodExceptionFilter,
    prismaExceptionFilter,
    httpExceptionFilter,
  );

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
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
