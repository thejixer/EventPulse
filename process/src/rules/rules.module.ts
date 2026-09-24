import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleSchema, Rule } from './schemas/rule.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Rule.name,
        schema: RuleSchema,
      },
    ]),
  ],
})
export class RulesModule {}
