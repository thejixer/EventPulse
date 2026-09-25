import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleMatchSchema, RuleMatch } from './schemas/rule-match.schema';
import { RuleMatchesService } from './rule-matches.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RuleMatch.name,
        schema: RuleMatchSchema,
      },
    ]),
  ],
  providers: [RuleMatchesService],
  exports: [RuleMatchesService],
})
export class RuleMatchesModule {}
