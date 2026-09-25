import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RulesService } from '../rules/rule.service';
import { OccurrencesQueryDto } from './dto/occurrences-query.dto';
import { OccurrencesResponseDto } from './dto/occurrences-response.dto';
import { RuleMatchesService } from './rule-matches.service';

@ApiTags('Rule Occurrences')
@Controller('rules')
export class RuleMatchesController {
  constructor(
    private readonly rulesService: RulesService,
    private readonly ruleMatchesService: RuleMatchesService,
  ) {}

  @Get(':id/occurrences')
  @ApiOperation({
    summary: 'Get rule occurrences by agent',
    description:
      'Returns timestamps of rule occurrences grouped by agent. The requested time range must not exceed 24 hours.',
  })
  @ApiParam({
    name: 'id',
    description: 'Rule MongoDB ObjectId',
    example: '6ab65d51cd101ddedbfe847e',
  })
  @ApiOkResponse({
    description: 'Rule occurrences grouped by agent',
    type: OccurrencesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid rule ID or time range',
  })
  @ApiNotFoundResponse({
    description: 'Rule not found',
  })
  async getOccurrences(@Param('id') id: string, @Query() query: OccurrencesQueryDto): Promise<OccurrencesResponseDto> {
    this.rulesService.validateObjectId(id);

    const from = new Date(query.from);
    const to = new Date(query.to);

    if (to <= from) {
      throw new BadRequestException('"to" must be after "from"');
    }

    if (to.getTime() - from.getTime() > 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Time range must not exceed 24 hours');
    }

    const agents = await this.ruleMatchesService.getOccurrences(id, from, to);

    return {
      ruleId: id,
      from: query.from,
      to: query.to,
      agents,
    };
  }
}
