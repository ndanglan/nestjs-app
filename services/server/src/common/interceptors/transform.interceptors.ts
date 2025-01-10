import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ResponseFormat } from 'src/types/response.type';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((data) => ({
        status: context.switchToHttp().getResponse().statusCode,
        data: data,
      })),
      catchError((error) => {
        if (error instanceof HttpException) {
          return throwError(
            () =>
              new HttpException(
                {
                  status: error.getStatus(),
                  data: null,
                  message: error.message,
                },
                error.getStatus(),
              ),
          );
        }

        // Xử lý các lỗi không phải HttpException
        return throwError(
          () =>
            new InternalServerErrorException({
              status: 500,
              data: null,
              message: 'Internal server error',
            }),
        );
      }),
    );
  }
}
