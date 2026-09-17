import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateHomeworkDto } from './create-homeworks.dto.js';

// group_id va lesson_id ni o'zgartirishga ruxsat yo'q
export class UpdateHomeworkDto extends PartialType(
  OmitType(CreateHomeworkDto, ['group_id', 'lesson_id'] as const),
) {}
