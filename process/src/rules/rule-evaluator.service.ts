import { Injectable } from '@nestjs/common';
import { RuleOperator } from '../types/rule-operator';

@Injectable()
export class RuleEvaluatorService {
  evaluate(
    eventValue: number,
    operator: RuleOperator,
    ruleValue: number,
  ): boolean {
    switch (operator) {
      case RuleOperator.GREATER_THAN:
        return eventValue > ruleValue;

      case RuleOperator.GREATER_THAN_OR_EQUAL:
        return eventValue >= ruleValue;

      case RuleOperator.LESS_THAN:
        return eventValue < ruleValue;

      case RuleOperator.LESS_THAN_OR_EQUAL:
        return eventValue <= ruleValue;

      case RuleOperator.EQUAL:
        return eventValue === ruleValue;
    }
  }
}
