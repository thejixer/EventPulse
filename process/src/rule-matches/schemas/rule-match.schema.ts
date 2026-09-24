import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RuleOperator } from '../../types/rule-operator';
import { EventName } from '../../types/event-types';
export type RuleMatchDocument = HydratedDocument<RuleMatch>;

@Schema({
  _id: false,
})
export class RuleSnapshot {
  @Prop({
    required: true,
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
}

@Schema({
  collection: 'rule_matches',
  timestamps: false,
})
export class RuleMatch {
  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  ruleId: Types.ObjectId;

  @Prop({
    required: true,
  })
  ruleVersion: number;

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  eventId: Types.ObjectId;

  @Prop({
    required: true,
    index: true,
  })
  agentId: string;

  @Prop({
    required: true,
    index: true,
  })
  timestamp: Date;

  @Prop({
    type: RuleSnapshot,
    required: true,
  })
  ruleSnapshot: RuleSnapshot;
}

export const RuleMatchSchema = SchemaFactory.createForClass(RuleMatch);