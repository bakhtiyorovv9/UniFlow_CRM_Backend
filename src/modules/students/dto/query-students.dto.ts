import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { StudentStatus } from '../../../common/enums/index.js';
import { ArchivedQueryDto } from '../../../common/dto/archived-query.dto.js';

export class QueryStudentsDto extends ArchivedQueryDto {
  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
