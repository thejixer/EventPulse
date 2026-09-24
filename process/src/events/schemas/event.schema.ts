// event schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EventName } from '../../types/event-types';

export type EventDocument = HydratedDocument<Event>;

@Schema({
  collection: 'events',
  timestamps: false,
})
export class Event {
  @Prop({
    required: true,
    index: true,
    enum: Object.values(EventName),
  })
  name: EventName;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  eventId: string;

  @Prop({
    required: true,
    index: true,
  })
  agentId: string;

  @Prop({
    required: true,
  })
  value: number;

  @Prop({
    required: true,
    index: true,
  })
  timestamp: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);