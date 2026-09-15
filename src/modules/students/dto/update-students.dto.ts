import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { StudentStatus } from '../../../common/enums/index.js';
import { CreateStudentDto } from './create-students.dto.js';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiPropertyOptional({ enum: StudentStatus, example: StudentStatus.active })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}