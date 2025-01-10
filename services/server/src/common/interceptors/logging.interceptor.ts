import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const now = Date.now();

    // Log Request
    this.logRequest(request);

    return next.handle().pipe(
      // Log Success Response
      tap((data) => {
        this.logResponse(request, response, data, now);
      }),
      // Log Error
      catchError((error) => {
        this.logError(request, error, now);
        throw error;
      }),
    );
  }

  private logRequest(request: Request): void {
    const { method, originalUrl, body, query, params, headers } = request;

    this.logger.log(
      'Incoming Request',
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          method,
          url: originalUrl,
          query,
          params,
          body: this.sanitizeData(body),
          headers: this.sanitizeHeaders(headers),
          ip: request.ip,
        },
        null,
        2,
      ),
    );
  }

  private logResponse(
    request: Request,
    response: Response,
    data: any,
    startTime: number,
  ): void {
    const { method, originalUrl } = request;
    const responseTime = Date.now() - startTime;

    this.logger.log(
      'Response',
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          method,
          url: originalUrl,
          statusCode: response.statusCode,
          responseTime: `${responseTime}ms`,
          response: this.sanitizeData(data),
        },
        null,
        2,
      ),
    );
  }

  private logError(request: Request, error: any, startTime: number): void {
    const { method, originalUrl } = request;
    const responseTime = Date.now() - startTime;

    this.logger.error(
      'Error Response',
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          method,
          url: originalUrl,
          statusCode: error.status || 500,
          responseTime: `${responseTime}ms`,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
        null,
        2,
      ),
    );
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
      'cookie',
    ];

    this.recursiveSanitize(sanitized, sensitiveFields);
    return sanitized;
  }

  private recursiveSanitize(obj: any, sensitiveFields: string[]): void {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach((key) => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        this.recursiveSanitize(obj[key], sensitiveFields);
      }
    });
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-auth-token',
      'x-refresh-token',
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
