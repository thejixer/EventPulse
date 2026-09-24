import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RuleOperator } from '../../types/rule-operator';
import { EventName } from '../../types/event-types';

export type RuleDocument = HydratedDocument<Rule>;

@Schema({
  collection: 'rules',
  timestamps: true,
})
export class Rule {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    index: true,
    enum: Object.values(EventName),
  })
  eventName: EventName;

  @Prop({
    required: true,
    enum: Object.values(RuleOperator),
  })
  operator: RuleOperator;

  @Prop({
    required: true,
  })
  value: number;

  @Prop({
    required: true,
    default: 1,
  })
  version: number;
}

export const RuleSchema = SchemaFactory.createForClass(Rule);