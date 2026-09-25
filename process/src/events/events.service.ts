import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { IncomingEventDto } from './dto/incoming-event.dto';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async create(event: IncomingEventDto): Promise<{
    event: EventDocument;
    created: boolean;
  }> {
    try {
      const createdEvent = await this.eventModel.create({
        eventId: event.eventId,
        agentId: event.agentId,
        name: event.name,
        value: event.value,
        timestamp: new Date(event.timestamp),
      });
      this.logger.debug(`Created event eventId=${event.eventId} agentId=${event.agentId}`);

      return {
        event: createdEvent,
        created: true,
      };
    } catch (error) {
      if (!this.isDuplicateEvent(error)) throw error;

      const existingEvent = await this.eventModel.findOne({ eventId: event.eventId }).exec();

      if (!existingEvent) throw error;
      this.logger.debug(`Event already exists eventId=${event.eventId}`);
      return {
        event: existingEvent,
        created: false,
      };
    }
  }

  private isDuplicateEvent(error: unknown): boolean {
    if (!(error instanceof MongoServerError)) {
      return false;
    }

    return error.code === 11000 && error.keyPattern?.eventId === 1;
  }
}
