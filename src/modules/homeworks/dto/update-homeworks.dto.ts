import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateHomeworkDto } from './create-homeworks.dto.js';

export class UpdateHomeworkDto extends PartialType(
  OmitType(CreateHomeworkDto, ['group_id', 'lesson_id'] as const),
) {}
