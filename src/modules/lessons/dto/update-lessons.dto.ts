import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Status } from '../../../common/enums/index.js';
import { CreateLessonDto } from './create-lessons.dto.js';

export class UpdateLessonDto extends PartialType(
  OmitType(CreateLessonDto, ['group_id'] as const),
) {
  @ApiPropertyOptional({ enum: Status, example: Status.active })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
