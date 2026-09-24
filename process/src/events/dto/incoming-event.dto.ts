import { IsDateString, IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';
import { EventName } from '../../types/event-types';

export class IncomingEventDto {
  @IsUUID('4')
  eventId: string;

  @IsString()
  agentId: string;

  @IsEnum(EventName)
  name: EventName;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  value: number;

  @IsDateString()
  timestamp: string;
}