import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RulesService } from './rule.service'
import { RulesPaginationDto } from './dto/rule-pagination.dto';

@ApiTags('Rules')
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a rule' })
  @ApiResponse({ status: 201, description: 'Rule created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid rule data.' })
  create(@Body() createRuleDto: CreateRuleDto) {
    return this.rulesService.create(createRuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get rules' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully.' })
  findAll(@Query() pagination: RulesPaginationDto) {
    return this.rulesService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a rule by ID' })
  @ApiParam({
    name: 'id',
    example: '68d3a8f1e2b5c7a9f1234567',
  })
  @ApiResponse({ status: 200, description: 'Rule retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid rule ID.' })
  @ApiResponse({ status: 404, description: 'Rule not found.' })
  findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a rule' })
  @ApiParam({
    name: 'id',
    example: '68d3a8f1e2b5c7a9f1234567',
  })
  @ApiResponse({ status: 200, description: 'Rule updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid rule data or ID.' })
  @ApiResponse({ status: 404, description: 'Rule not found.' })
  update(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateRuleDto,
  ) {
    if (Object.keys(updateRuleDto).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }
    return this.rulesService.update(id, updateRuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a rule' })
  @ApiParam({
    name: 'id',
    example: '68d3a8f1e2b5c7a9f1234567',
  })
  @ApiResponse({ status: 200, description: 'Rule deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid rule ID.' })
  @ApiResponse({ status: 404, description: 'Rule not found.' })
  remove(@Param('id') id: string) {
    return this.rulesService.remove(id);
  }
}