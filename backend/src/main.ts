import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // Validate environment variables before starting the application
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // Enable cookie parser for HttpOnly cookies
  app.use(cookieParser());

  // CORS 설정
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // 글로벌 Validation Pipe 설정 (임시 비활성화)
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //   }),
  // );

  await app.listen(3001);
  console.log('🚀 Backend server running on http://localhost:3001');
}
bootstrap();
