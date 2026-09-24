import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventProducerService } from './event-producer/event-producer.service';
@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
	],
	providers: [EventProducerService],
})
export class AppModule {}
