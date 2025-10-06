import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ZodExceptionFilter } from './exception-filters/zod-exception-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestMethod } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('/api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  const configService = app.get(ConfigService);

  const zodExceptionFilter = new ZodExceptionFilter(configService);
  app.useGlobalFilters(zodExceptionFilter);

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
