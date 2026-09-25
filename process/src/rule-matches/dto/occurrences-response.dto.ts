import { ApiProperty } from '@nestjs/swagger';

export class AgentOccurrencesDto {
  @ApiProperty({
    example: 'agent-1',
    description: 'Agent identifier',
  })
  agentId: string;

  @ApiProperty({
    type: [String],
    format: 'date-time',
    example: ['2026-09-25T10:15:20.000Z', '2026-09-25T10:15:22.000Z'],
    description: 'Timestamps when the rule matched for this agent',
  })
  occurrences: Date[];
}

export class OccurrencesResponseDto {
  @ApiProperty({
    example: '6ab65d51cd101ddedbfe847e',
  })
  ruleId: string;

  @ApiProperty({
    example: '2026-09-25T00:00:00.000Z',
    format: 'date-time',
  })
  from: string;

  @ApiProperty({
    example: '2026-09-25T23:59:59.999Z',
    format: 'date-time',
  })
  to: string;

  @ApiProperty({
    type: [AgentOccurrencesDto],
  })
  agents: AgentOccurrencesDto[];
}
