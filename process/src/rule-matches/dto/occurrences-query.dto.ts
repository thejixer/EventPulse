import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class OccurrencesQueryDto {
  @ApiProperty({
    description: 'Start of the occurrence time range (ISO 8601)',
    example: '2026-09-25T00:00:00.000Z',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description: 'End of the occurrence time range (ISO 8601). Maximum range is 24 hours.',
    example: '2026-09-25T23:59:59.999Z',
  })
  @IsDateString()
  to: string;
}
