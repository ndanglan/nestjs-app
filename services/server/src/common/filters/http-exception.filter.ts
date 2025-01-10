import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const errorResponse = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      message: exception.message,
      error: exception.name,
      body: this.sanitizeData(request.body),
      query: request.query,
      params: request.params,
    };

    // Log error
    this.logger.error(
      `Error Response: ${JSON.stringify(errorResponse, null, 2)}`,
    );

    response.status(status).json({
      status,
      data: null,
      message: exception.message,
    });
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    const sensitiveFields = [
      'password',
      'token',
      'refreshToken',
      'accessToken',
      'authorization',
    ];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
