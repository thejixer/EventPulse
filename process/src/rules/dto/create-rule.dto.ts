import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { EventName } from '../../types/event-types';
import { RuleOperator } from '../../types/rule-operator';

export class CreateRuleDto {
  @ApiProperty({
    example: 'High Temperature',
  })
  @IsString()
  name: string;

  @ApiProperty({
    enum: EventName,
    example: EventName.TEMPERATURE,
  })
  @IsEnum(EventName)
  eventName: EventName;

  @ApiProperty({
    enum: RuleOperator,
    example: RuleOperator.GREATER_THAN,
  })
  @IsEnum(RuleOperator)
  operator: RuleOperator;

  @ApiProperty({
    example: 80,
  })
  @IsNumber()
  value: number;
}