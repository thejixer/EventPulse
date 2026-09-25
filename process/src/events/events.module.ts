import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema, Event } from './schemas/event.schema';
import { EventConsumerService } from './event-consumer.service';
import { ConfigModule } from '@nestjs/config';
import { EventsService } from './events.service';
import { RulesModule } from '../rules/rules.module';
import { EventProcessingService } from './event-processing.service';
import { RuleMatchesModule } from '../rule-matches/rule-matches.module';
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
    RulesModule,
    RuleMatchesModule,
  ],
  providers: [EventConsumerService, EventsService, EventProcessingService],
  exports: [EventsService],
})
export class EventsModule {}
