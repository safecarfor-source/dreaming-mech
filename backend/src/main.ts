import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // BigInt JSON 직렬화 지원
  (BigInt.prototype as any).toJSON = function() { return Number(this); };

  // Validate environment variables before starting the application
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // Nginx/Docker 환경에서 실제 방문자 IP를 가져오기 위한 설정
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

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

  // 글로벌 예외 필터 설정
  app.useGlobalFilters(new AllExceptionsFilter());

  // 글로벌 Validation Pipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3001);
  console.log('🚀 Backend server running on http://localhost:3001');
}
bootstrap();
