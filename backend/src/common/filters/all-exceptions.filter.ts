import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
    }

    // 에러 로깅 (민감 정보 제외)
    const errorLog: any = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message: exception instanceof Error ? exception.message : message,
    };

    // Validation 에러의 경우 상세 내용 로깅
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && (exceptionResponse as any).errors) {
        errorLog.validationErrors = (exceptionResponse as any).errors;
      }
    }

    // 스택 트레이스는 개발 환경에서만
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      errorLog.stack = exception.stack;
    }

    this.logger.error(errorLog);

    // 4xx 클라이언트 에러는 원래 메시지 전달, 5xx 서버 에러만 가림
    const isClientError = status >= 400 && status < 500;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        isClientError || process.env.NODE_ENV !== 'production'
          ? message
          : '서버 오류가 발생했습니다',
    });
  }
}
