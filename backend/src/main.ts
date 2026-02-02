import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,      
    forbidNonWhitelisted: true,
    transform: true,      
  }));

  const configService = app.get(ConfigService);

  const rmqConfig = configService.get<RmqOptions>('rabbitmq');

  if (!rmqConfig) {
    throw new Error("❌ Không tìm thấy cấu hình RabbitMQ! Hãy kiểm tra file .env hoặc key 'rabbitmq' trong config.");
  }

  app.connectMicroservice(rmqConfig);

  await app.startAllMicroservices();

  const config = new DocumentBuilder()
    .setTitle('Restaurant Offline System API')
    .setDescription('Tài liệu API cho hệ thống quản lý nhà hàng Offline-first')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
