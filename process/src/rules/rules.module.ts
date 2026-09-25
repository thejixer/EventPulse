import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rule, RuleSchema } from './schemas/rule.schema';
import { RulesController } from './rule.controller';
import { RulesService } from './rule.service';
import { RuleEvaluatorService } from './rule-evaluator.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Rule.name,
        schema: RuleSchema,
      },
    ]),
  ],
  controllers: [RulesController],
  providers: [RulesService, RuleEvaluatorService],
  exports: [RulesService, RuleEvaluatorService],
})
export class RulesModule {}
