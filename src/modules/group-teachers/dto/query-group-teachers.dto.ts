import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { TeacherGroupStatus } from '../../../common/enums/index.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryGroupTeachersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TeacherGroupStatus })
  @IsOptional()
  @IsEnum(TeacherGroupStatus)
  status?: TeacherGroupStatus;

  @ApiPropertyOptional({ description: 'Guruh boʻyicha filtr' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number;

  @ApiPropertyOptional({ description: 'Oʻqituvchi boʻyicha filtr' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teacher_id?: number;
}
