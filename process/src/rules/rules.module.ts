import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rule, RuleSchema } from './schemas/rule.schema';
import { RulesController } from './rule.controller';
import { RulesService } from './rule.service';

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
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}