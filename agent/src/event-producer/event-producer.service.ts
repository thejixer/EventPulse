import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Channel, ChannelModel, connect } from 'amqplib';
import { faker } from '@faker-js/faker';
import {
  RABBITMQ_EXCHANGE,
  RABBITMQ_QUEUE,
  RABBITMQ_ROUTING_KEY,
} from './event-producer.constants';
import { ConfigService } from '@nestjs/config';
const EVENT_INTERVAL_MS = 200;

interface AgentEvent {
  agentId: string;
  name: string;
  value: number;
  timestamp: string;
}

@Injectable()
export class EventProducerService implements OnModuleInit {
  private readonly logger = new Logger(EventProducerService.name);

  private readonly agentId;

  private readonly rabbitMqUrl;

  private readonly eventTypes = [
    'temperature',
    'speed',
    'pressure',
    'voltage',
    'noise',
    'light',
  ];

  private eventIndex = 0;

  private connection!: ChannelModel;
  private channel!: Channel;

  constructor(private readonly configService: ConfigService) {
    this.agentId = this.configService.getOrThrow<string>('HOSTNAME');
    this.rabbitMqUrl = this.configService.getOrThrow<string>('RABBITMQ_URL');
  }

  async onModuleInit(): Promise<void> {
    await this.connectToRabbitMq();
    await this.startProducing();
  }

  private async connectToRabbitMq(): Promise<void> {
    this.connection = await connect(this.rabbitMqUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(RABBITMQ_EXCHANGE, 'direct', {
      durable: true,
    });

    await this.channel.assertQueue(RABBITMQ_QUEUE, {
      durable: true,
    });

    await this.channel.bindQueue(
      RABBITMQ_QUEUE,
      RABBITMQ_EXCHANGE,
      RABBITMQ_ROUTING_KEY,
    );

    this.logger.log('Connected to RabbitMQ');
  }

  private async startProducing(): Promise<void> {
    this.logger.log(`Agent ${this.agentId} started producing events`);

    while (true) {
      const startTime = performance.now();

      await this.produceEvent();

      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, EVENT_INTERVAL_MS - elapsed);

      await this.delay(remaining);
    }
  }

  private async produceEvent(): Promise<void> {
    const name = this.eventTypes[this.eventIndex];

    const event: AgentEvent = {
      agentId: this.agentId,
      name,
      value: faker.number.float({
        min: 0,
        max: 100,
        fractionDigits: 2,
      }),
      timestamp: new Date().toISOString(),
    };

    const message = Buffer.from(JSON.stringify(event));

    this.channel.publish(RABBITMQ_EXCHANGE, RABBITMQ_ROUTING_KEY, message, {
      persistent: true,
      contentType: 'application/json',
    });

    this.logger.debug(`Published ${event.name}: ${event.value}`);

    this.eventIndex = (this.eventIndex + 1) % this.eventTypes.length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
