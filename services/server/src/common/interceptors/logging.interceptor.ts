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
import { cloneDeep } from 'lodash';

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

    const sanitized = cloneDeep(data);
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
      } // Xử lý array
      else if (Array.isArray(obj[key])) {
        // Nếu là array, chỉ lấy phần tử đầu tiên và thêm length
        const arrayLength = obj[key].length;
        if (arrayLength > 0) {
          const firstItem = obj[key][0];
          // Đệ quy sanitize cho item đầu tiên nếu nó là object
          if (typeof firstItem === 'object') {
            this.recursiveSanitize(firstItem, sensitiveFields);
          }
          obj[key] = {
            first: firstItem,
            total: arrayLength,
            message: `... and ${arrayLength - 1} more items`,
          };
        } else {
          obj[key] = { total: 0, message: 'Empty array' };
        }
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
