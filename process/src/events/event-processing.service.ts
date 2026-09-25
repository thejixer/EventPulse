import { Injectable, Logger } from '@nestjs/common';
import { IncomingEventDto } from './dto/incoming-event.dto';
import { EventsService } from './events.service';
import { RulesService } from '../rules/rule.service';
import { RuleEvaluatorService } from '../rules/rule-evaluator.service';
import { RuleDocument } from '../rules/schemas/rule.schema';
import { RuleMatchesService } from '../rule-matches/rule-matches.service';

@Injectable()
export class EventProcessingService {
  private readonly logger = new Logger(EventProcessingService.name);
  constructor(
    private readonly eventsService: EventsService,
    private readonly rulesService: RulesService,
    private readonly ruleEvaluatorService: RuleEvaluatorService,
    private readonly ruleMatchesService: RuleMatchesService,
  ) {}

  async process(event: IncomingEventDto): Promise<void> {
    this.logger.debug(
      `Processing event eventId=${event.eventId} agentId=${event.agentId} name=${event.name} value=${event.value}`,
    );
    const eventResult = await this.eventsService.create(event);

    if (!eventResult.created) {
      this.logger.debug(`Event already exists eventId=${event.eventId}`);
    }

    const rules: RuleDocument[] = await this.rulesService.findByEventName(event.name);

    this.logger.debug(`Found ${rules.length} applicable rules eventId=${event.eventId} eventName=${event.name}`);

    const matchingRules: RuleDocument[] = rules.filter((rule: RuleDocument) =>
      this.ruleEvaluatorService.evaluate(event.value, rule.operator, rule.value),
    );
    if (matchingRules.length === 0) {
      this.logger.debug(`No rules matched eventId=${event.eventId} eventName=${event.name}`);
      // return;
    } else {
      this.logger.debug(`Matched ${matchingRules.length} rules eventId=${event.eventId}`);
    }

    for (const rule of matchingRules) {
      const result = await this.ruleMatchesService.create(event, rule);
      if (result.created) {
        this.logger.debug(`Created rule match eventId=${event.eventId} ruleId=${rule._id} ruleVersion=${rule.version}`);
        continue;
      }

      this.logger.debug(`Rule match already exists eventId=${event.eventId} ruleId=${rule._id}`);
    }
  }
}
