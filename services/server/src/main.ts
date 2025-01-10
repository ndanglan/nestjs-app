import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFile } from 'fs/promises';
import { AppModule } from 'src/app.module';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptors';

async function bootstrap() {
  const logger = new Logger('Bootstrap'); // Tạo logger instance
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các properties không được định nghĩa trong DTO
      transform: true, // Tự động transform types
      forbidNonWhitelisted: true, // Throw error nếu có properties không được định nghĩa
      transformOptions: {
        enableImplicitConversion: true, // Tự động convert types
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());

  const configService = app.get(ConfigService);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: [configService.get('app.version', '1')],
  });

  const options = new DocumentBuilder()
    .setTitle(configService.get('projectName'))
    .setDescription('Poject Description description')
    .setVersion('1.0')
    .addTag('Project Tag')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);

  await writeFile(`./storage/api-docs.json`, JSON.stringify(document, null, 2));

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'swagger/json',
  });

  await app.listen(configService.get<number>('app.port', 8080));
  logger.verbose(
    `Application is running on: http://localhost:${configService.get<number>('app.port', 8080)}`,
  );
}
bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
