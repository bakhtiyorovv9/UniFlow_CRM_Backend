import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateExamDto } from './create-exam.dto.js';

export class UpdateExamDto extends PartialType(
  OmitType(CreateExamDto, ['group_id'] as const),
) {}
