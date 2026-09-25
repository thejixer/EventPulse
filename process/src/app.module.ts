import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RulesModule } from './rules/rules.module';
import { EventsModule } from './events/events.module';
import { RuleMatchesModule } from './rule-matches/rule-matches.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    RulesModule,
    EventsModule,
    RuleMatchesModule,
  ],
})
export class AppModule {}
