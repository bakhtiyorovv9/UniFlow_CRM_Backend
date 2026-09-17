import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TeacherGroupStatus } from '../../../common/enums/index.js';

export class UpdateGroupTeacherDto {
  @ApiPropertyOptional({
    enum: TeacherGroupStatus,
    example: TeacherGroupStatus.active,
  })
  @IsOptional()
  @IsEnum(TeacherGroupStatus)
  status?: TeacherGroupStatus;
}
