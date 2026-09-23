import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryAttendanceDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Guruh bo'yicha filtr" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number;

  @ApiPropertyOptional({ description: "Talaba bo'yicha filtr" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  student_id?: number;

  @ApiPropertyOptional({ description: 'Boshlanish sanasi (ISO)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Tugash sanasi (ISO)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
