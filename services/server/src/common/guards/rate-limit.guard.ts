import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { RedisService } from 'src/modules/redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  private readonly REQUESTS_LIMIT = 100;
  private readonly TIME_WINDOW = 60; // seconds

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const key = `ratelimit:${ip}`;

    // Lấy số lần request hiện tại
    const current = (await this.redisService.get<number>(key)) || 0;

    if (current >= this.REQUESTS_LIMIT) {
      // Giới hạn 100 request/phút
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too Many Requests',
          waitTime: this.TIME_WINDOW,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Tăng số lần request và set TTL
    await this.redisService.set(key, current + 1, this.TIME_WINDOW);
    return true;
  }
}
