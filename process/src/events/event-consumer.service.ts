import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect, ConsumeMessage } from 'amqplib';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IncomingEventDto } from './dto/incoming-event.dto'
import { EventsService } from './events.service';
@Injectable()
export class EventConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EventConsumerService.name);

  private connection!: ChannelModel;
  private channel!: Channel;

  private readonly exchange = 'event-pulse.events';
  private readonly queue = 'event-pulse.process';
  private readonly routingKey = 'event';

  constructor(
    private readonly configService: ConfigService,
    private readonly eventsService: EventsService,
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
    const rabbitMqUrl =
      this.configService.getOrThrow<string>('RABBITMQ_URL');

    this.connection = await connect(rabbitMqUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.prefetch(10);

    this.logger.log('Connected to RabbitMQ');
  }

  private async setupTopology(): Promise<void> {
    await this.channel.assertExchange(this.exchange, 'direct', {
      durable: true,
    });

    await this.channel.assertQueue(this.queue, {
      durable: true,
    });

    await this.channel.bindQueue(
      this.queue,
      this.exchange,
      this.routingKey,
    );

    this.logger.log(
      `RabbitMQ topology ready: exchange=${this.exchange} queue=${this.queue}`,
    );
  }

  private async startConsumer(): Promise<void> {
    await this.channel.consume(
      this.queue,
      (message) => {
        void this.handleMessage(message);
      },
      {
        noAck: false,
      },
    );

    this.logger.log(`Consuming messages from queue=${this.queue}`);
  }

  private async handleMessage(message: ConsumeMessage | null,): Promise<void> {
    
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

    const result = await this.eventsService.create(event);

    if (result.created) {
      this.logger.log(
        `Persisted event eventId=${event.eventId} mongoId=${result.event._id} agentId=${event.agentId}`,
      );
    } else {
      this.logger.log(
        `Event already persisted eventId=${event.eventId} agentId=${event.agentId}`,
      );
    }

    this.channel.ack(message);
  }

  private async validateEvent(payload: unknown): Promise<IncomingEventDto | null> {
    
    const event = plainToInstance(IncomingEventDto, payload);

    const errors = await validate(event, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      this.logger.warn(
        `Invalid event: ${JSON.stringify(errors)}`,
      );

      return null;
    }

    return event;
  }
}