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
    trim: true,
  })
  name: string;

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
  eventId: string;

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
// for idempotency of rule match submition
RuleMatchSchema.index({ eventId: 1, ruleId: 1 }, { unique: true });
// Optimizes rule occurrence queries by time range
RuleMatchSchema.index({ ruleId: 1, timestamp: 1 });
