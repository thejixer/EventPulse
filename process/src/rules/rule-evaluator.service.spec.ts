import { RuleEvaluatorService } from './rule-evaluator.service';
import { RuleOperator } from '../types/rule-operator';

describe('RuleEvaluatorService', () => {
  let service: RuleEvaluatorService;

  beforeEach(() => {
    service = new RuleEvaluatorService();
  });

  it('should evaluate greater than', () => {
    expect(service.evaluate(80, RuleOperator.GREATER_THAN, 70)).toBe(true);

    expect(service.evaluate(70, RuleOperator.GREATER_THAN, 70)).toBe(false);
  });

  it('should evaluate greater than or equal', () => {
    expect(service.evaluate(70, RuleOperator.GREATER_THAN_OR_EQUAL, 70)).toBe(
      true,
    );

    expect(service.evaluate(69, RuleOperator.GREATER_THAN_OR_EQUAL, 70)).toBe(
      false,
    );
  });

  it('should evaluate less than', () => {
    expect(service.evaluate(60, RuleOperator.LESS_THAN, 70)).toBe(true);

    expect(service.evaluate(70, RuleOperator.LESS_THAN, 70)).toBe(false);
  });

  it('should evaluate less than or equal', () => {
    expect(service.evaluate(70, RuleOperator.LESS_THAN_OR_EQUAL, 70)).toBe(
      true,
    );

    expect(service.evaluate(71, RuleOperator.LESS_THAN_OR_EQUAL, 70)).toBe(
      false,
    );
  });

  it('should evaluate equal', () => {
    expect(service.evaluate(70, RuleOperator.EQUAL, 70)).toBe(true);

    expect(service.evaluate(71, RuleOperator.EQUAL, 70)).toBe(false);
  });
});
