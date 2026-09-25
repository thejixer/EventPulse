import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Redis,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');

        return new Redis(redisUrl, {
          maxRetriesPerRequest: 0,
          enableOfflineQueue: false,
          retryStrategy: (times: number): number | null => {
            if (times > 10) return null;

            return Math.min(times * 1000, 5000);
          },
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
