import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Status } from '../../../common/enums/index.js';
import { CreateCourseDto } from './create-courses.dto.js';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiPropertyOptional({ enum: Status, example: Status.active })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
