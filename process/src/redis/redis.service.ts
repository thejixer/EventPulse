import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly redis: Redis) {}

  async onModuleInit(): Promise<void> {
    this.redis.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connection established');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis connection ready');
    });

    this.redis.on('reconnecting', (delay: number) => {
      this.logger.warn(`Redis reconnecting in ${delay}ms`);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    try {
      await this.redis.ping();

      this.logger.log('Connected to Redis');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  async increment(key: string): Promise<number> {
    const value = await this.redis.incr(key);

    this.logger.debug(`Incremented Redis counter key=${key} value=${value}`);

    return value;
  }
}
