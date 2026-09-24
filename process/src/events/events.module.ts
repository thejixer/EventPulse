import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema, Event } from './schemas/event.schema';
import { EventConsumerService } from './event-consumer.service';
import { ConfigModule } from '@nestjs/config';
import { EventsService } from './events.service';
@Module({
  imports: [
    ConfigModule.forRoot({
     isGlobal: true,
    }),
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
      },
    ]),
  ],
  providers: [EventConsumerService, EventsService],
  exports: [
    EventsService,
  ],
})
export class EventsModule {}
