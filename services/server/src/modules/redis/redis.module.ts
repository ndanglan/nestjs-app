import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';
import { RedisService } from 'src/modules/redis/redis.service';
@Global()
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore as unknown as CacheStore,
      host: 'localhost',
      port: 6379,
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class RedisModule {}
