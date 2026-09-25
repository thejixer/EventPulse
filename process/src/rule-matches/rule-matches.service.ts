import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { RuleMatch, RuleMatchDocument } from './schemas/rule-match.schema';
import { RuleDocument } from '../rules/schemas/rule.schema';
import { IncomingEventDto } from '../events/dto/incoming-event.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RuleMatchesService {
  private readonly logger = new Logger(RuleMatchesService.name);

  constructor(
    @InjectModel(RuleMatch.name)
    private readonly ruleMatchModel: Model<RuleMatchDocument>,
    private readonly redisService: RedisService,
  ) {}

  async create(
    event: IncomingEventDto,
    rule: RuleDocument,
  ): Promise<{
    ruleMatch: RuleMatchDocument;
    created: boolean;
  }> {
    let createdRuleMatch: RuleMatchDocument;

    try {
      createdRuleMatch = await this.ruleMatchModel.create({
        eventId: event.eventId,
        ruleId: rule._id,
        ruleVersion: rule.version,
        agentId: event.agentId,
        timestamp: new Date(event.timestamp),
        ruleSnapshot: {
          name: rule.name,
          eventName: rule.eventName,
          operator: rule.operator,
          value: rule.value,
        },
      });
      this.logger.debug(`Created rule match eventId=${event.eventId} ruleId=${rule._id} ruleVersion=${rule.version}`);
    } catch (error) {
      if (!this.isDuplicateMatch(error)) throw error;

      const existingMatch = await this.ruleMatchModel
        .findOne({
          eventId: event.eventId,
          ruleId: rule._id,
        })
        .exec();

      if (!existingMatch) throw error;

      this.logger.debug(`Rule match already exists eventId=${event.eventId} ruleId=${rule._id}`);

      return {
        ruleMatch: existingMatch,
        created: false,
      };
    }

    const redisKey = `rule:${rule._id}:agent:${event.agentId}`;

    try {
      await this.redisService.increment(redisKey);
    } catch (error) {
      this.logger.error(
        `Failed to update Redis counter key=${redisKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      ruleMatch: createdRuleMatch,
      created: true,
    };
  }

  private isDuplicateMatch(error: unknown): boolean {
    if (!(error instanceof MongoServerError)) return false;

    return error.code === 11000 && error.keyPattern?.eventId === 1 && error.keyPattern?.ruleId === 1;
  }
}
