import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleMatchSchema, RuleMatch } from './schemas/rule-match.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RuleMatch.name,
        schema: RuleMatchSchema,
      },
    ]),
  ],
})
export class RuleMatchesModule {}
