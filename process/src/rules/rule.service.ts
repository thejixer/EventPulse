import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { Rule, RuleDocument } from './schemas/rule.schema';
import { EventName } from '../types/event-types';

@Injectable()
export class RulesService {
  constructor(@InjectModel(Rule.name) private readonly ruleModel: Model<RuleDocument>) {}

  async create(createRuleDto: CreateRuleDto): Promise<RuleDocument> {
    return this.ruleModel.create(createRuleDto);
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{
    data: RuleDocument[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.ruleModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.ruleModel.countDocuments().exec(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<RuleDocument> {
    this.validateObjectId(id);

    const rule = await this.ruleModel.findById(id).exec();

    if (!rule) {
      throw new NotFoundException(`Rule with id "${id}" not found`);
    }

    return rule;
  }

  async update(id: string, updateRuleDto: UpdateRuleDto): Promise<RuleDocument> {
    this.validateObjectId(id);

    const rule = await this.ruleModel
      .findByIdAndUpdate(
        id,
        {
          $set: updateRuleDto,
          $inc: {
            version: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!rule) throw new NotFoundException(`Rule with id "${id}" not found`);

    return rule;
  }

  async remove(id: string): Promise<void> {
    this.validateObjectId(id);

    const result = await this.ruleModel.findByIdAndDelete(id).exec();

    if (!result) throw new NotFoundException(`Rule with id "${id}" not found`);
  }

  async findByEventName(eventName: EventName): Promise<RuleDocument[]> {
    return this.ruleModel.find({ eventName }).exec();
  }

  validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid rule id "${id}"`);
    }
  }
}
