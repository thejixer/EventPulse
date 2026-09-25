import { ApiProperty } from '@nestjs/swagger';

export class AgentStatisticsDto {
  @ApiProperty({
    example: 'agent-1',
  })
  agentId: string;

  @ApiProperty({
    example: 42,
  })
  count: number;
}

export class StatisticsResponseDto {
  @ApiProperty({
    example: '6ab65d51cd101ddedbfe847e',
  })
  ruleId: string;

  @ApiProperty({
    type: [AgentStatisticsDto],
  })
  agents: AgentStatisticsDto[];
}
