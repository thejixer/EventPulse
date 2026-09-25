import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleMatchSchema, RuleMatch } from './schemas/rule-match.schema';
import { RuleMatchesService } from './rule-matches.service';
import { RulesModule } from '../rules/rules.module';
import { RuleMatchesController } from './rule-matches.controller';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RuleMatch.name,
        schema: RuleMatchSchema,
      },
    ]),
    RulesModule,
  ],
  controllers: [RuleMatchesController],
  providers: [RuleMatchesService],
  exports: [RuleMatchesService],
})
export class RuleMatchesModule {}
