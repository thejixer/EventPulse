import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelModel, ConfirmChannel, ConsumeMessage, connect } from 'amqplib';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IncomingEventDto } from './dto/incoming-event.dto';
import { EventProcessingService } from './event-processing.service';
import {
  RABBITMQ_EXCHANGE,
  RABBITMQ_QUEUE,
  RABBITMQ_RETRY_DELAY_MS,
  RABBITMQ_RETRY_EXCHANGE,
  RABBITMQ_RETRY_QUEUE,
  RABBITMQ_RETRY_ROUTING_KEY,
  RABBITMQ_ROUTING_KEY,
} from './event-consumer.constants';

@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumerService.name);

  private connection!: ChannelModel;
  private channel!: ConfirmChannel;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventProcessingService: EventProcessingService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
    await this.setupTopology();
    await this.startConsumer();
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async connect(): Promise<void> {
    const rabbitMqUrl = this.configService.getOrThrow<string>('RABBITMQ_URL');

    this.connection = await connect(rabbitMqUrl);
    this.channel = await this.connection.createConfirmChannel();

    await this.channel.prefetch(10);

    this.logger.log('Connected to RabbitMQ');
  }

  private async setupTopology(): Promise<void> {
    await this.channel.assertExchange(RABBITMQ_EXCHANGE, 'direct', {
      durable: true,
    });

    await this.channel.assertQueue(RABBITMQ_QUEUE, {
      durable: true,
    });

    await this.channel.bindQueue(RABBITMQ_QUEUE, RABBITMQ_EXCHANGE, RABBITMQ_ROUTING_KEY);

    await this.channel.assertExchange(RABBITMQ_RETRY_EXCHANGE, 'direct', {
      durable: true,
    });

    await this.channel.assertQueue(RABBITMQ_RETRY_QUEUE, {
      durable: true,
      arguments: {
        'x-message-ttl': RABBITMQ_RETRY_DELAY_MS,
        'x-dead-letter-exchange': RABBITMQ_EXCHANGE,
        'x-dead-letter-routing-key': RABBITMQ_ROUTING_KEY,
      },
    });

    await this.channel.bindQueue(RABBITMQ_RETRY_QUEUE, RABBITMQ_RETRY_EXCHANGE, RABBITMQ_RETRY_ROUTING_KEY);

    this.logger.log(
      `RabbitMQ topology ready: exchange=${RABBITMQ_EXCHANGE} queue=${RABBITMQ_QUEUE} retryQueue=${RABBITMQ_RETRY_QUEUE}`,
    );
  }

  private async startConsumer(): Promise<void> {
    await this.channel.consume(
      RABBITMQ_QUEUE,
      (message) => {
        void this.handleMessage(message);
      },
      {
        noAck: false,
      },
    );

    this.logger.log(`Consuming messages from queue=${RABBITMQ_QUEUE}`);
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) return;

    const rawPayload = message.content.toString();

    let payload: unknown;

    try {
      payload = JSON.parse(rawPayload);
    } catch {
      this.logger.warn('Received invalid JSON message');

      this.channel.nack(message, false, false);
      return;
    }

    const event = await this.validateEvent(payload);

    if (!event) {
      this.logger.warn('Rejecting invalid event');

      this.channel.nack(message, false, false);
      return;
    }

    try {
      await this.eventProcessingService.process(event);

      this.channel.ack(message);

      this.logger.debug(`Processed event successfully eventId=${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process event eventId=${event.eventId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.retryMessage(message);
    }
  }

  private async retryMessage(message: ConsumeMessage): Promise<void> {
    try {
      await this.publishToRetryQueue(message);

      this.channel.ack(message);

      this.logger.warn(`Message moved to retry queue delay=${RABBITMQ_RETRY_DELAY_MS}ms`);
    } catch (error) {
      this.logger.error(
        `Failed to publish message to retry queue: ${error instanceof Error ? error.message : String(error)}`,
      );

      this.channel.nack(message, false, true);
    }
  }

  private async publishToRetryQueue(message: ConsumeMessage): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.channel.publish(
        RABBITMQ_RETRY_EXCHANGE,
        RABBITMQ_RETRY_ROUTING_KEY,
        message.content,
        {
          persistent: true,
          contentType: message.properties.contentType,
        },
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        },
      );
    });
  }

  private async validateEvent(payload: unknown): Promise<IncomingEventDto | null> {
    const event = plainToInstance(IncomingEventDto, payload);

    const errors = await validate(event, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      this.logger.warn(`Invalid event: ${JSON.stringify(errors)}`);

      return null;
    }

    return event;
  }
}
